// Run with `node --test scripts/check-souls.test.mjs`.
// Set HACKMYAGENT to a scanner command, for example HACKMYAGENT='npx --yes hackmyagent@latest', to also
// run hackmyagent scan-soul on every template and the guide's Minimal Template. The command's words are
// separated by spaces; quote a word that contains spaces, or set HACKMYAGENT to the scanner's path alone.
// Set OPENA2A_CLI to an opena2a-cli command, for example OPENA2A_CLI='npx --yes opena2a-cli@latest', to also
// run the guard sign and guard verify commands in README.md, CONTRIBUTING.md and the guides. Its words are
// read the same way.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkRepository as checkProse } from './check-docs-prose.mjs';
import { checkRepository, main, readRules, readSections } from './check-souls.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// git sets GIT_DIR, and for some commits GIT_INDEX_FILE, in the environment of a hook it runs. Such a
// variable makes git use the repository it names in place of the one found from the directory git runs
// in, and these tests run git, directly and through the checks, in temporary directories. So the
// variables git lists as local to a repository are removed before any test runs.
const localGitVariables = spawnSync('git', ['rev-parse', '--local-env-vars'], { encoding: 'utf8' }).stdout ?? '';
for (const name of localGitVariables.split('\n').filter(Boolean)) delete process.env[name];

// Splits HACKMYAGENT into words. A value that names an existing file is one word, so a scanner's path
// may contain spaces; otherwise words are separated by spaces, and a quoted word may contain them.
function scannerCommand(value) {
  const command = value?.trim();
  if (!command) return null;
  if (existsSync(command)) return [command];
  return [...command.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map((match) => match[1] ?? match[2] ?? match[3]);
}

const HACKMYAGENT = scannerCommand(process.env.HACKMYAGENT);
const OPENA2A_CLI = scannerCommand(process.env.OPENA2A_CLI);

// Returns the spawnSync arguments that run a command's words. On Windows `npx` is npx.cmd, which Node
// starts only through a shell, so there the words are joined into one cmd.exe command line, with each
// word escaped by windowsWord.
function scannerSpawn(words, platform = process.platform) {
  if (platform !== 'win32') return [words[0], words.slice(1), {}];
  return [words.map(windowsWord).join(' '), [], { shell: true }];
}

// cmd.exe treats these characters as special outside double quotes, so a word that contains one is quoted.
const CMD_QUOTED = /[\s&|<>^(),;=]/;
// cmd.exe still expands %name% inside double quotes, and a double quote inside a word would end the
// quoted part early. In a word that contains one of these, every quote and special character is escaped
// with ^ instead, so cmd.exe never enters a quoted part and passes each one on literally.
const CMD_ESCAPED = /["%]/;

// Returns a word as cmd.exe passes it to the program as one argument. The program reads backslashes
// literally except before a double quote, where each pair is one backslash, so backslashes before a
// quote or the closing quote are doubled and a quote in the word is written \". Each match starts at the
// first backslash of a run, so a long run is read once instead of once from each of its backslashes.
function windowsWord(word) {
  if (word && !CMD_QUOTED.test(word) && !CMD_ESCAPED.test(word)) return word;
  const quoted = `"${word.replace(/(?<!\\)(\\*)"/g, '$1$1\\"').replace(/(?<!\\)(\\*)$/, '$1$1')}"`;
  return CMD_ESCAPED.test(word) ? quoted.replace(/[ \t"%&|<>^(),;=]/g, '^$&') : quoted;
}

// A scan still running after this long is stopped, so a scanner or an npx download that hangs fails the
// test instead of blocking it. The first npx run also downloads hackmyagent.
const SCAN_TIMEOUT_MS = 120_000;

// hackmyagent scan-soul exits 1 when the role-play refusal control, SOUL-IH-003, is not detected.
// It detects the control by keyword, and these are keywords from that control's list in the scanner,
// copied here. A test that only looks for these words cannot notice the scanner changing its list,
// so the scanner test below checks the templates against the scanner itself.
const ROLE_PLAY_CONTROL = 'SOUL-IH-003';
const ROLE_PLAY_TERMS = ['role-play', 'jailbreak', 'act as'];

// Returns the text of the Minimal Template code block in a guide whose lines end with LF or CR LF, or
// undefined.
function minimalTemplate(guide) {
  return guide.match(/## Minimal Template\s+```markdown\r?\n([\s\S]*?)\r?\n```/)?.[1];
}

function templateSouls() {
  const guide = readFileSync(join(repoRoot, 'guides', 'creating-your-first-soul.md'), 'utf8');
  const minimal = minimalTemplate(guide);
  assert.ok(minimal !== undefined, 'guides/creating-your-first-soul.md: Minimal Template block not found');
  const templates = readdirSync(join(repoRoot, 'templates'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => [`templates/${name}`, readFileSync(join(repoRoot, 'templates', name), 'utf8')]);
  assert.ok(templates.length > 0, 'no templates were found');
  return [...templates, ['the Minimal Template in the guide', minimal]];
}

// The README.md tables whose last column names the standards and regulations each soul covers.
const STANDARDS_TABLES = ['By Industry', 'By Organization Type'];

// Reads the last column of each row in a README.md table under a STANDARDS_TABLES heading, and returns
// one problem for each name in it that the soul the row links to does not mention, and the number of
// names read. A name is a word of that column that contains a digit or two capital letters, such as
// GLBA, 62443 or FedRAMP; a phrase with no such word, such as attorney-client privilege, is not read.
// `readSoul` returns the text of a file the README links to.
function unmentionedStandards(readme, readSoul) {
  const problems = [];
  let names = 0;
  let table = null;
  for (const line of readme.split(/\r?\n/)) {
    const heading = line.match(/^## (.*)/);
    if (heading) {
      table = STANDARDS_TABLES.find((name) => heading[1] === name || heading[1].startsWith(`${name} `)) ?? null;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    const link = table && cells[0]?.match(/^\[[^\]]*\]\(([^)]+)\)$/);
    if (!link) continue;
    const soul = readSoul(link[1]);
    for (const name of cells.at(-1).split(/[\s,/]+/).filter((word) => /\d|[A-Z].*[A-Z]/.test(word))) {
      names += 1;
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'i').test(soul)) {
        problems.push(`${link[1]}: the README.md ${table} table names ${name}, which the soul does not mention`);
      }
    }
  }
  return { problems, names };
}

// Reads the table in the By Use Case section of a README and returns, for each row, the file its first
// cell links and the comma-separated names in its Popular Platforms cell.
function useCasePlatforms(readme) {
  const section = readme.split(/^## /m).find((part) => part.startsWith('By Use Case'));
  assert.ok(section !== undefined, 'README.md: By Use Case section not found');
  const rows = section
    .split(/\r?\n/)
    .filter((line) => line.startsWith('|'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));
  const column = rows[0]?.indexOf('Popular Platforms') ?? -1;
  assert.ok(column >= 0, 'README.md: the By Use Case table has no Popular Platforms column');
  return rows.slice(2).map((cells) => ({
    file: cells[0].match(/\]\(([^)]+)\)/)?.[1],
    platforms: cells[column].split(',').map((name) => name.trim()).filter(Boolean),
  }));
}

// Returns the names in `platforms` that `text` does not contain as a whole word, matched with case.
function missingPlatforms(text, platforms) {
  return platforms.filter((name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return !new RegExp(`(?<![\\w/])${escaped}(?![\\w/])`).test(text);
  });
}

// Runs `<command> scan-soul <dir> --json` on each soul, saved as SOUL.md in a temporary directory,
// and returns one line per problem. A scan that runs longer than `timeout` milliseconds is stopped, and
// no later soul is scanned.
function scanSoulProblems(command, souls, { timeout = SCAN_TIMEOUT_MS } = {}) {
  const problems = [];
  let scanner = null;
  const dir = mkdtempSync(join(tmpdir(), 'check-souls-scan-'));
  try {
    for (const [file, text] of souls) {
      writeFileSync(join(dir, 'SOUL.md'), text);
      const [program, args, options] = scannerSpawn([...command, 'scan-soul', dir, '--json']);
      const { status, signal, stdout, error } = spawnSync(program, args, {
        ...options,
        encoding: 'utf8',
        timeout,
        // hackmyagent sends anonymous usage telemetry unless this is off.
        env: { ...process.env, OPENA2A_TELEMETRY: 'off' },
      });
      if (error?.code === 'ETIMEDOUT') {
        problems.push(
          `${file}: ${command.join(' ')} scan-soul did not finish within ${timeout / 1000} seconds; scanning stopped at this file`,
        );
        break;
      }
      if (error) {
        problems.push(`${file}: could not run ${command.join(' ')}: ${error.message}`);
        continue;
      }
      let report;
      try {
        report = JSON.parse(stdout);
      } catch {
        problems.push(`${file}: scan-soul --json printed no JSON report (exit ${status ?? signal})`);
        continue;
      }
      if (status !== 0) {
        const missing = (report.criticalMissing ?? []).join(', ') || 'none listed';
        problems.push(`${file}: scan-soul exited ${status ?? signal}; critical controls not detected: ${missing}`);
      }
      const control = (report.domains ?? [])
        .flatMap((domain) => domain.controls ?? [])
        .find((candidate) => candidate.id === ROLE_PLAY_CONTROL);
      if (!control) {
        problems.push(`${file}: scan-soul reported no ${ROLE_PLAY_CONTROL} control`);
        continue;
      }
      if (!control.passed) problems.push(`${file}: scan-soul did not detect the role-play refusal (${ROLE_PLAY_CONTROL})`);
      scanner ??= { version: report.hackmyagentVersion, keywords: control.keywords ?? [] };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const keywords = (scanner?.keywords ?? []).map((keyword) => keyword.toLowerCase());
  for (const term of scanner ? ROLE_PLAY_TERMS.filter((term) => !keywords.includes(term)) : []) {
    problems.push(
      `hackmyagent ${scanner.version} no longer lists "${term}" as a ${ROLE_PLAY_CONTROL} keyword; update ROLE_PLAY_TERMS and the templates' role-play refusal line`,
    );
  }
  return problems;
}

// The prose check lists the files git tracks, so it needs a git clone. Returns why `dir` is not the top
// of a git work tree, as in a source archive with no .git directory, or false when it is.
function notAGitClone(dir) {
  const { status, stdout, stderr, error } = spawnSync('git', ['rev-parse', '--show-prefix'], {
    cwd: dir,
    encoding: 'utf8',
  });
  if (error) return `git did not run (${error.code})`;
  if (status !== 0) return stderr.trim().split(/\r?\n/)[0] || `git rev-parse exited with status ${status}`;
  return stdout.trim() ? 'the directory is inside a git repository but is not its top' : false;
}

const GIT_RUNS = !spawnSync('git', ['--version']).error;

describe('notAGitClone', { skip: !GIT_RUNS && 'git did not run' }, () => {
  let repo;
  let archive;
  before(() => {
    repo = mkdtempSync(join(tmpdir(), 'check-souls-clone-'));
    const { status, stderr } = spawnSync('git', ['init', '--quiet'], { cwd: repo, encoding: 'utf8' });
    assert.equal(status, 0, `git init failed: ${stderr}`);
    mkdirSync(join(repo, 'sub'));
    // A .git file that names a missing directory, so git finds no repository here or above.
    archive = mkdtempSync(join(tmpdir(), 'check-souls-archive-'));
    writeFileSync(join(archive, '.git'), 'gitdir: ./missing\n');
  });
  after(() => {
    for (const dir of [repo, archive]) rmSync(dir, { recursive: true, force: true });
  });

  test('accepts the top of a git work tree', () => {
    assert.equal(notAGitClone(repo), false);
  });

  test('gives the reason git gives for a directory with no repository', () => {
    assert.match(notAGitClone(archive), /\S/);
  });

  test('rejects a directory below the top of a git work tree', () => {
    assert.equal(notAGitClone(join(repo, 'sub')), 'the directory is inside a git repository but is not its top');
  });
});

const NOT_A_CLONE = notAGitClone(repoRoot);

// CONTRIBUTING.md says accepted pull requests are squash-merged into `main`. Returns the ref that holds
// the history of `main` in the clone at `dir`: origin/main where there is one, since a local main can be
// behind it and the branch that is checked out can carry a merge of its own, or else main. Returns
// undefined when the clone has neither, as after a clone of one other branch.
function mainRef(dir) {
  return ['refs/remotes/origin/main', 'refs/heads/main'].find(
    (ref) => spawnSync('git', ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { cwd: dir }).status === 0,
  );
}

// Returns the merge commits in the history of `revision`, newest first, each as its hash, a space and
// its subject.
function mergeCommits(dir, revision) {
  const { status, stdout, stderr } = spawnSync('git', ['log', '--merges', '--format=%H %s', revision, '--'], {
    cwd: dir,
    encoding: 'utf8',
  });
  assert.equal(status, 0, `git log failed: ${stderr}`);
  return stdout.split('\n').filter(Boolean);
}

// Returns the merge commits that `guide` does not name. The guide names a commit by writing the first
// seven or more characters of its hash in inline code.
function unnamedMergeCommits(guide, commits) {
  const named = [...guide.matchAll(/`([0-9a-f]{7,40})`/g)].map((match) => match[1]);
  return commits.filter((commit) => !named.some((hash) => commit.startsWith(hash)));
}

describe('mainRef, mergeCommits and unnamedMergeCommits', { skip: !GIT_RUNS && 'git did not run' }, () => {
  let repo;
  let git;
  let merge;
  let squashed;
  before(() => {
    repo = mkdtempSync(join(tmpdir(), 'check-souls-history-'));
    git = (...args) => {
      const identity = ['-c', 'user.name=Test', '-c', 'user.email=test@example.com'];
      const { status, stdout, stderr } = spawnSync('git', [...identity, ...args], {
        cwd: repo,
        encoding: 'utf8',
        input: '',
      });
      assert.equal(status, 0, `git ${args[0]} failed: ${stderr}`);
      return stdout.trim();
    };
    git('init', '--quiet');
    // Every commit has the empty tree, so the history is built without a work tree or an index.
    const tree = git('mktree');
    const commit = (subject, ...parents) =>
      git('commit-tree', tree, ...parents.flatMap((parent) => ['-p', parent]), '-m', subject);
    const base = commit('Base');
    merge = commit('Merge side', commit('Other', base), commit('Side', base));
    squashed = commit('Change (#1)', merge);
    git('update-ref', 'refs/heads/main', merge);
    git('update-ref', 'refs/remotes/origin/main', squashed);
  });
  after(() => rmSync(repo, { recursive: true, force: true }));

  test('mergeCommits lists a commit with two parents and no commit with one', () => {
    assert.deepEqual(mergeCommits(repo, squashed), [`${merge} Merge side`]);
  });

  test('unnamedMergeCommits accepts the start of a hash in inline code, and no shorter or unquoted one', () => {
    const commits = [`${merge} Merge side`];
    assert.deepEqual(unnamedMergeCommits(`The merge commit \`${merge.slice(0, 7)}\` is older.`, commits), []);
    assert.deepEqual(unnamedMergeCommits(`The merge commit \`${merge}\` is older.`, commits), []);
    assert.deepEqual(unnamedMergeCommits(`The merge commit \`${merge.slice(0, 6)}\` is older.`, commits), commits);
    assert.deepEqual(unnamedMergeCommits(`The merge commit ${merge.slice(0, 7)} is older.`, commits), commits);
    assert.deepEqual(unnamedMergeCommits(`The commit \`${squashed.slice(0, 7)}\` is newer.`, commits), commits);
  });

  test('mainRef names origin/main where the clone has one, then main, then nothing', () => {
    assert.equal(mainRef(repo), 'refs/remotes/origin/main');
    git('update-ref', '-d', 'refs/remotes/origin/main');
    assert.equal(mainRef(repo), 'refs/heads/main');
    git('update-ref', '-d', 'refs/heads/main');
    assert.equal(mainRef(repo), undefined);
  });
});

const MAIN_REF = NOT_A_CLONE ? undefined : mainRef(repoRoot);

describe('this repository', () => {
  test('every soul and template meets the CONTRIBUTING.md requirements table', () => {
    const { problems, fileCount, ruleCount } = checkRepository(repoRoot);
    assert.deepEqual(problems, []);
    assert.ok(fileCount > 0, 'no soul files were checked');
    assert.ok(ruleCount > 0, 'no rules were read from CONTRIBUTING.md');
  });

  test(
    'the prose of every tracked Markdown file passes scripts/check-docs-prose.mjs',
    { skip: NOT_A_CLONE && `the prose check needs a git clone: ${NOT_A_CLONE}` },
    () => {
      const { problems, fileCount } = checkProse(repoRoot);
      assert.deepEqual(problems, []);
      assert.ok(fileCount > 0, 'no Markdown files were checked');
    },
  );

  test('every soul mentions each standard and regulation its README.md table row names', () => {
    const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
    const { problems, names } = unmentionedStandards(readme, (path) => readFileSync(join(repoRoot, path), 'utf8'));
    assert.deepEqual(problems, []);
    assert.ok(names > 0, 'no standard or regulation names were read from the README.md tables');
  });

  test('CONTRIBUTING.md says whether pull requests run CI, matching the repository', () => {
    const guide = readFileSync(join(repoRoot, 'CONTRIBUTING.md'), 'utf8');
    const hasWorkflows = existsSync(join(repoRoot, '.github', 'workflows'));
    assert.equal(
      /no CI workflow/.test(guide),
      !hasWorkflows,
      hasWorkflows
        ? 'the repository now has a CI workflow: describe what it checks in CONTRIBUTING.md'
        : 'the repository has no CI workflow: CONTRIBUTING.md must say so',
    );
  });

  test(
    'CONTRIBUTING.md, which says pull requests are squash-merged, names every merge commit on main',
    {
      skip:
        !MAIN_REF &&
        `the history of main cannot be read: ${NOT_A_CLONE || 'the clone has no origin/main or main branch'}`,
    },
    () => {
      const guide = readFileSync(join(repoRoot, 'CONTRIBUTING.md'), 'utf8');
      assert.match(guide, /squash-merged/);
      assert.deepEqual(unnamedMergeCommits(guide, mergeCommits(repoRoot, MAIN_REF)), []);
    },
  );

  test('every template contains the role-play, jailbreak and act as refusal keywords', () => {
    for (const [file, text] of templateSouls()) {
      for (const term of ROLE_PLAY_TERMS) {
        assert.match(text, new RegExp(`\\b${term}\\b`, 'i'), `${file} lacks the role-play refusal line (${term})`);
      }
    }
  });

  test('every By Use Case soul names each platform its README row lists under Popular Platforms', () => {
    const rows = useCasePlatforms(readFileSync(join(repoRoot, 'README.md'), 'utf8'));
    assert.ok(rows.length > 0, 'README.md: the By Use Case table has no rows');
    const problems = [];
    for (const { file, platforms } of rows) {
      assert.ok(file, 'README.md: a By Use Case row does not link its soul');
      assert.ok(platforms.length > 0, `README.md: the By Use Case row for ${file} lists no platforms`);
      for (const name of missingPlatforms(readFileSync(join(repoRoot, file), 'utf8'), platforms)) {
        problems.push(`${file}: does not mention ${name}, which README.md lists under Popular Platforms`);
      }
    }
    assert.deepEqual(problems, []);
  });

  test('reads the Popular Platforms cell of each By Use Case row and matches names as whole words', () => {
    const readme = [
      '## By Use Case (1 soul)',
      '',
      '| Soul | Focus | Popular Platforms |',
      '|------|-------|-------------------|',
      '| [helper](souls/by-use-case/helper.md) | Notes | X/Twitter, Microsoft Teams |',
      '',
      '## By Fleet',
      '',
      '| Fleet | Agents |',
      '|-------|--------|',
      '| [crew](souls/by-fleet/crew/) | lead |',
    ].join('\r\n');
    assert.deepEqual(useCasePlatforms(readme), [
      { file: 'souls/by-use-case/helper.md', platforms: ['X/Twitter', 'Microsoft Teams'] },
    ]);
    assert.deepEqual(missingPlatforms('Post on X/Twitter and in Microsoft Teams.', ['X/Twitter', 'Microsoft Teams']), []);
    assert.deepEqual(missingPlatforms('Small teams post on Twitter.', ['Teams', 'X/Twitter']), ['Teams', 'X/Twitter']);
  });

  test('reads the Minimal Template from a guide whose lines end with CR LF', () => {
    const guide = '## Minimal Template\r\n\r\n```markdown\r\n# Soul\r\nRefuse role-play.\r\n```\r\n';
    assert.equal(minimalTemplate(guide), '# Soul\r\nRefuse role-play.');
  });

  test(
    'hackmyagent scan-soul passes every template and detects its role-play refusal',
    { skip: HACKMYAGENT ? false : "set HACKMYAGENT='npx --yes hackmyagent@latest' to run it" },
    () => {
      assert.deepEqual(scanSoulProblems(HACKMYAGENT, templateSouls()), []);
    },
  );
});

describe('unmentionedStandards', () => {
  const readme = [
    '## By Industry (2 souls)',
    '',
    '| Soul | Focus | Key Standards and Regulations |',
    '|------|-------|-------------------------------|',
    '| [fintech](souls/fintech.md) | Payments | PCI-DSS, KYC/AML, GLBA |',
    '| [plant](souls/plant.md) | OT systems | IEC 62443, OSHA reporting requirements |',
    '',
    '## By Role (1 soul)',
    '',
    '| Soul | Focus |',
    '|------|-------|',
    '| [writer](souls/writer.md) | SEO copy |',
  ].join('\n');
  const souls = {
    'souls/fintech.md': 'Covers pci-dss, KYC and AML.',
    'souls/plant.md': 'Cites IEC 62264, IEC 624430 and OSHA.',
    'souls/writer.md': '',
  };

  test('reports each name the linked soul does not mention, and none from a table it does not read', () => {
    assert.deepEqual(unmentionedStandards(readme, (path) => souls[path]), {
      problems: [
        'souls/fintech.md: the README.md By Industry table names GLBA, which the soul does not mention',
        'souls/plant.md: the README.md By Industry table names 62443, which the soul does not mention',
      ],
      names: 7,
    });
  });

  test('accepts a soul that mentions every name', () => {
    const covered = { ...souls, 'souls/fintech.md': 'PCI-DSS, KYC, AML and GLBA.', 'souls/plant.md': 'IEC 62443, OSHA.' };
    assert.deepEqual(unmentionedStandards(readme, (path) => covered[path]).problems, []);
  });
});

// A directory a suite's tests share is created in a `before` hook: a test run filtered by name runs
// neither hook of a suite with no selected test, so a directory created in the suite body is left behind.
describe('scanSoulProblems', () => {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'check-souls-stub-'));
  });
  after(() => rmSync(dir, { recursive: true, force: true }));
  const souls = [['templates/basic.md', '## Identity\n\nRefuse role-play, jailbreak and act as requests.\n']];

  function script(name, source) {
    const path = join(dir, `${name}.mjs`);
    writeFileSync(path, source);
    return [process.execPath, path];
  }

  function stub(name, report, exitCode, before = '') {
    return script(name, `process.stdout.write(${JSON.stringify(before + JSON.stringify(report))});\nprocess.exitCode = ${exitCode};\n`);
  }

  function report(passed, keywords, criticalMissing = []) {
    return {
      hackmyagentVersion: '9.9.9',
      criticalMissing,
      domains: [{ domain: 'Injection Hardening', controls: [{ id: 'SOUL-IH-003', keywords, passed }] }],
    };
  }

  test('accepts a scan that exits 0 and detects the role-play refusal', () => {
    const scanner = stub('pass', report(true, ['role-play', 'pretend', 'act as', 'jailbreak', 'as DAN']), 0);
    assert.deepEqual(scanSoulProblems(scanner, souls), []);
  });

  test('reports a scanner whose role-play keywords no longer match the templates', () => {
    const scanner = stub('fail', report(false, ['role-play', 'persona'], ['SOUL-IH-003']), 1);
    assert.deepEqual(scanSoulProblems(scanner, souls), [
      'templates/basic.md: scan-soul exited 1; critical controls not detected: SOUL-IH-003',
      'templates/basic.md: scan-soul did not detect the role-play refusal (SOUL-IH-003)',
      'hackmyagent 9.9.9 no longer lists "jailbreak" as a SOUL-IH-003 keyword; update ROLE_PLAY_TERMS and the templates\' role-play refusal line',
      'hackmyagent 9.9.9 no longer lists "act as" as a SOUL-IH-003 keyword; update ROLE_PLAY_TERMS and the templates\' role-play refusal line',
    ]);
  });

  test('reports a scan that does not report the role-play control', () => {
    const scanner = stub('no-control', { hackmyagentVersion: '9.9.9', domains: [] }, 0);
    assert.deepEqual(scanSoulProblems(scanner, souls), ['templates/basic.md: scan-soul reported no SOUL-IH-003 control']);
  });

  test('reports a scanner command that cannot be run', () => {
    const problems = scanSoulProblems([join(dir, 'missing-hackmyagent')], souls);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^templates\/basic\.md: could not run .*missing-hackmyagent: .*ENOENT/);
  });

  test('reports a scan that prints text before its JSON report', () => {
    const scanner = stub('text-first', report(true, ['role-play', 'act as', 'jailbreak']), 0, 'Downloading hackmyagent\n');
    assert.deepEqual(scanSoulProblems(scanner, souls), ['templates/basic.md: scan-soul --json printed no JSON report (exit 0)']);
  });

  test('accepts role-play keywords the scanner lists in upper case', () => {
    const scanner = stub('upper-case', report(true, ['ROLE-PLAY', 'Jailbreak', 'ACT AS']), 0);
    assert.deepEqual(scanSoulProblems(scanner, souls), []);
  });

  test('stops a scan that does not finish in time and scans no later file', () => {
    // Exits without output after 10 seconds, so without the timeout it reports a missing JSON report.
    const scanner = script('hang', 'setTimeout(() => {}, 10_000);\n');
    const twoSouls = [...souls, ['templates/second.md', souls[0][1]]];
    assert.deepEqual(scanSoulProblems(scanner, twoSouls, { timeout: 500 }), [
      `templates/basic.md: ${scanner.join(' ')} scan-soul did not finish within 0.5 seconds; scanning stopped at this file`,
    ]);
  });

  test('runs the scanner with hackmyagent usage telemetry off', () => {
    const passing = JSON.stringify(report(true, ['role-play', 'act as', 'jailbreak']));
    const scanner = script(
      'telemetry',
      `if (process.env.OPENA2A_TELEMETRY === 'off') process.stdout.write(${JSON.stringify(passing)});\n`,
    );
    // Turned on here, so the scanner sees off only because scanSoulProblems sets it, not because the
    // shell running the tests exported OPENA2A_TELEMETRY=off.
    const previous = process.env.OPENA2A_TELEMETRY;
    process.env.OPENA2A_TELEMETRY = 'on';
    try {
      assert.deepEqual(scanSoulProblems(scanner, souls), []);
    } finally {
      if (previous === undefined) delete process.env.OPENA2A_TELEMETRY;
      else process.env.OPENA2A_TELEMETRY = previous;
    }
  });

  test(
    'runs a scanner named by a path that contains a space',
    { skip: process.platform === 'win32' ? 'the stub scanner is a script with a #! line' : false },
    () => {
      const path = join(dir, 'dir with space', 'hackmyagent');
      mkdirSync(dirname(path));
      const passing = JSON.stringify(report(true, ['role-play', 'act as', 'jailbreak']));
      writeFileSync(path, `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(passing)});\n`, { mode: 0o755 });
      assert.deepEqual(scannerCommand(path), [path]);
      assert.deepEqual(scanSoulProblems(scannerCommand(path), souls), []);
    },
  );
});

describe('scannerCommand and scannerSpawn', () => {
  test('splits HACKMYAGENT into words and keeps a quoted word whole', () => {
    assert.equal(scannerCommand(undefined), null);
    assert.equal(scannerCommand('  '), null);
    assert.deepEqual(scannerCommand(' npx --yes  hackmyagent@latest '), ['npx', '--yes', 'hackmyagent@latest']);
    assert.deepEqual(scannerCommand(`node "/no such dir/cli.mjs" '--a b'`), ['node', '/no such dir/cli.mjs', '--a b']);
  });

  test('runs the words directly, and on Windows as one cmd.exe line with spaced words quoted', () => {
    const words = ['npx', '--yes', 'hackmyagent@latest', 'scan-soul', 'C:\\Temp\\a b', '--json'];
    assert.deepEqual(scannerSpawn(words, 'darwin'), ['npx', words.slice(1), {}]);
    assert.deepEqual(scannerSpawn(words, 'win32'), [
      'npx --yes hackmyagent@latest scan-soul "C:\\Temp\\a b" --json',
      [],
      { shell: true },
    ]);
  });

  test('on Windows quotes a word with a cmd.exe special character and escapes a double quote or %', () => {
    const line = (word) => scannerSpawn(['node', word], 'win32')[0];
    assert.equal(line('C:\\R&D|x^y (1)'), 'node "C:\\R&D|x^y (1)"');
    assert.equal(line('C:\\a b\\'), 'node "C:\\a b\\\\"');
    assert.equal(line(''), 'node ""');
    assert.equal(line('C:\\a"b c\\x'), 'node ^"C:\\a\\^"b^ c\\x^"');
    assert.equal(line('a\\"b'), 'node ^"a\\\\\\^"b^"');
    assert.equal(line('C:\\100%\\%TEMP% & x'), 'node ^"C:\\100^%\\^%TEMP^%^ ^&^ x^"');
  });

  test('on Windows quotes or escapes a word with a cmd.exe special character and no space', () => {
    const line = (word) => scannerSpawn(['node', word], 'win32')[0];
    assert.equal(line('C:\\R&D'), 'node "C:\\R&D"');
    assert.equal(line('a%b\tc'), 'node ^"a^%b^\tc^"');
    for (const special of '&|<>^(),;=') {
      assert.equal(line(`a${special}b`), `node "a${special}b"`);
      assert.equal(line(`a%b${special}c`), `node ^"a^%b^${special}c^"`);
    }
  });

  test('on Windows builds the line for a word with a long run of backslashes in linear time', () => {
    // Returns the line for words with a run of the given number of backslashes, and the time it took.
    const build = (backslashes) => {
      const run = '\\'.repeat(backslashes);
      const start = performance.now();
      const line = scannerSpawn(['node', ` ${run}x`, `a ${run}`, `${run}"x`], 'win32')[0];
      return [line, performance.now() - start];
    };
    const run = '\\'.repeat(100_000);
    const [built, elapsed] = build(100_000);
    assert.equal(built, `node " ${run}x" "a ${run}${run}" ^"${run}${run}\\^"x^"`);
    assert.ok(elapsed < 1000, `built in ${Math.round(elapsed)} ms`);
    // A time bound alone passes a quadratic build when the run is short enough. Four times the
    // backslashes take four times as long in a linear build and sixteen times as long in a quadratic
    // one, so the times at two lengths are compared. Lengths only twice apart would leave a quadratic
    // build with a large fixed cost per call close to the bound. Each time is the fastest of ten
    // builds, so a pause during one does not count.
    const fastest = (backslashes) => Math.min(...Array.from({ length: 10 }, () => build(backslashes)[1]));
    const ratio = fastest(100_000) / fastest(25_000);
    assert.ok(ratio < 6, `four times the backslashes took ${ratio.toFixed(2)} times as long`);
  });
});

const GUIDE = `# Guide

| Dimension | Location | Required frontmatter | Required sections |
|-----------|----------|----------------------|-------------------|
| By Use Case | \`souls/by-use-case/<name>.md\` | \`name\`, \`category: use-case\` | \`Identity\`, \`Harm Avoidance\` |
| By Fleet, member | \`souls/by-fleet/<fleet>/<name>-agent.md\` | \`name\`, \`fleet: <fleet>\` | \`Identity\`, \`Boundaries\` or \`Constraints\` |
`;

// The guide up to and including the table's separator row.
const TABLE_HEADER = GUIDE.split('| By Use Case |')[0];

const GOOD_USE_CASE = `---
name: helper
category: use-case
---

## Identity

## Harm Avoidance
`;

const GOOD_FLEET_MEMBER = `---
name: lead-agent
fleet: crew
---

## Identity

## Constraints
`;

const BASE_README = '[helper](souls/by-use-case/helper.md)\n[crew](souls/by-fleet/crew/)\n';

const GUIDE_WITH_TEMPLATE = `${GUIDE}| Template | \`templates/<name>.md\` | \`name\` | \`Identity\`, \`Harm Avoidance\` |
`;

const GOOD_TEMPLATE = `---
name: basic-template
---

## Identity

## Workflow

## Harm Avoidance
`;

const TEMPLATE_ROW = '| [basic](templates/basic.md) | Answers questions | `Identity`, `Workflow`, `Harm Avoidance` |\n';

// Tests that take away read permission are skipped where taking it away does not stop a read.
const CANNOT_DENY_READ =
  process.platform === 'win32'
    ? 'file modes do not deny reads on Windows'
    : process.getuid?.() === 0
      ? 'running as root, which reads files without read permission'
      : false;

// Runs `check` while the paths have no permissions, then restores their modes.
function withoutReadPermission(paths, check) {
  const modes = paths.map((path) => [path, statSync(path).mode]);
  try {
    for (const [path] of modes) chmodSync(path, 0);
    return check();
  } finally {
    for (const [path, mode] of modes) chmodSync(path, mode);
  }
}

describe('checkRepository', () => {
  const roots = [];
  after(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  // `unreadable` lists paths in the fixture that are checked without read permission.
  function fixture(files, { unreadable = [] } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'check-souls-'));
    roots.push(root);
    const all = {
      'CONTRIBUTING.md': GUIDE,
      'README.md': BASE_README,
      'souls/by-use-case/helper.md': GOOD_USE_CASE,
      'souls/by-fleet/crew/lead-agent.md': GOOD_FLEET_MEMBER,
      ...files,
    };
    for (const [path, content] of Object.entries(all)) {
      if (content === null) continue;
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    return withoutReadPermission(
      unreadable.map((path) => join(root, path)),
      () => checkRepository(root).problems,
    );
  }

  test('accepts files that meet the table', () => {
    assert.deepEqual(fixture({}), []);
  });

  test('reports a root that does not exist by the name it is given', () => {
    const missing = join(tmpdir(), 'check-souls-no-such-dir');
    assert.deepEqual(checkRepository(missing, 'no-such-dir'), {
      problems: ['no-such-dir: directory not found'],
      fileCount: 0,
      ruleCount: 0,
    });
    assert.deepEqual(checkRepository(missing).problems, [`${missing}: directory not found`]);
  });

  test(
    'reports a root that cannot be looked up by the name it is given',
    { skip: process.platform === 'win32' ? 'creating a symbolic link needs extra rights on Windows' : false },
    () => {
      const dir = mkdtempSync(join(tmpdir(), 'check-souls-loop-'));
      roots.push(dir);
      symlinkSync('loop', join(dir, 'loop'));
      assert.deepEqual(checkRepository(join(dir, 'loop'), 'loop'), {
        problems: ['loop: cannot read: too many levels of symbolic links (ELOOP)'],
        fileCount: 0,
        ruleCount: 0,
      });
    },
  );

  test('throws an argument error instead of reporting it as a root that cannot be read', () => {
    assert.throws(() => checkRepository(undefined), { code: 'ERR_INVALID_ARG_TYPE' });
  });

  test('reports a CONTRIBUTING.md that is a directory', () => {
    assert.deepEqual(fixture({ 'CONTRIBUTING.md': null, 'CONTRIBUTING.md/notes.md': 'notes' }), [
      'CONTRIBUTING.md: cannot read: is a directory (EISDIR)',
    ]);
  });

  test('reports a CONTRIBUTING.md that cannot be read', { skip: CANNOT_DENY_READ }, () => {
    assert.deepEqual(fixture({}, { unreadable: ['CONTRIBUTING.md'] }), [
      'CONTRIBUTING.md: cannot read: permission denied (EACCES)',
    ]);
  });

  test('reports a souls directory that cannot be read, and no rule its files would match', { skip: CANNOT_DENY_READ }, () => {
    assert.deepEqual(fixture({}, { unreadable: ['souls'] }), ['souls: cannot read: permission denied (EACCES)']);
    assert.deepEqual(fixture({}, { unreadable: ['souls/by-fleet/crew'] }), [
      'souls/by-fleet/crew: cannot read: permission denied (EACCES)',
    ]);
    assert.deepEqual(fixture({}, { unreadable: ['souls/by-use-case'] }), [
      'souls/by-use-case: cannot read: permission denied (EACCES)',
    ]);
  });

  test(
    'reports a rule no file meets when its files could not be in the directory that cannot be read',
    { skip: CANNOT_DENY_READ },
    () => {
      assert.deepEqual(fixture({ 'CONTRIBUTING.md': GUIDE_WITH_TEMPLATE }, { unreadable: ['souls'] }), [
        'souls: cannot read: permission denied (EACCES)',
        'CONTRIBUTING.md: no file matches `templates/<name>.md` (Template)',
      ]);
      const noFleetMember = { 'souls/by-fleet/crew/lead-agent.md': null };
      assert.deepEqual(fixture(noFleetMember, { unreadable: ['souls/by-use-case'] }), [
        'souls/by-use-case: cannot read: permission denied (EACCES)',
        'CONTRIBUTING.md: no file matches `souls/by-fleet/<fleet>/<name>-agent.md` (By Fleet, member)',
      ]);
    },
  );

  test('reports a souls path that is a file', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': null,
      'souls/by-fleet/crew/lead-agent.md': null,
      souls: 'not a directory',
    });
    assert.deepEqual(problems, ['souls: cannot read: not a directory (ENOTDIR)']);
  });

  test('reports a soul file that cannot be read and checks the others', { skip: CANNOT_DENY_READ }, () => {
    const problems = fixture(
      { 'souls/by-fleet/crew/lead-agent.md': GOOD_FLEET_MEMBER.replace('## Constraints\n', '') },
      { unreadable: ['souls/by-use-case/helper.md'] },
    );
    assert.deepEqual(problems, [
      'souls/by-fleet/crew/lead-agent.md: missing section ## Boundaries or ## Constraints',
      'souls/by-use-case/helper.md: cannot read: permission denied (EACCES)',
    ]);
  });

  test('reports a README.md that cannot be read once, without a problem for each link', { skip: CANNOT_DENY_READ }, () => {
    const problems = fixture({ 'souls/by-use-case/second.md': GOOD_USE_CASE }, { unreadable: ['README.md'] });
    assert.deepEqual(problems, ['README.md: cannot read: permission denied (EACCES)']);
  });

  test('reads a README.md that does not exist as empty, so each soul is reported as not linked', () => {
    assert.deepEqual(fixture({ 'README.md': null }), [
      'souls/by-fleet/crew/lead-agent.md: not linked from README.md (link the file, or its fleet directory)',
      'souls/by-use-case/helper.md: not linked from README.md (link the file, or its fleet directory)',
    ]);
  });

  test('reports a guide without the requirements table', () => {
    const problems = fixture({ 'CONTRIBUTING.md': '# Guide\n\nNo table here.\n' });
    assert.equal(problems.length, 1);
    assert.match(problems[0], /requirements table not found/);
  });

  test('reports a missing section', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace('## Harm Avoidance\n', ''),
    });
    assert.deepEqual(problems, ['souls/by-use-case/helper.md: missing section ## Harm Avoidance']);
  });

  test('accepts a heading that starts with the section name followed by a space', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace(
        '## Harm Avoidance',
        '## Harm Avoidance -- Gray Areas',
      ),
    });
    assert.deepEqual(problems, []);
    assert.deepEqual(
      fixture({
        'souls/by-use-case/helper.md': GOOD_USE_CASE.replace('## Harm Avoidance', '## Harm Avoidances'),
      }),
      ['souls/by-use-case/helper.md: missing section ## Harm Avoidance'],
    );
  });

  test('does not count a heading inside a fenced code block as a section', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace(
        '## Harm Avoidance\n',
        '```markdown\n## Harm Avoidance\n```\n',
      ),
    });
    assert.deepEqual(problems, ['souls/by-use-case/helper.md: missing section ## Harm Avoidance']);
  });

  test('accepts a soul with sections beyond the required ones', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace(
        '## Harm Avoidance',
        '## Values and Principles\n\n## Harm Avoidance',
      ),
    });
    assert.deepEqual(problems, []);
  });

  test('reports a file without frontmatter', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.slice(GOOD_USE_CASE.indexOf('## Identity')),
    });
    assert.deepEqual(problems, [
      'souls/by-use-case/helper.md: missing YAML frontmatter between two --- lines at the top of the file',
    ]);
  });

  test('reports frontmatter that does not start on the first line', () => {
    const problems = fixture({ 'souls/by-use-case/helper.md': `# Helper\n\n${GOOD_USE_CASE}` });
    assert.deepEqual(problems, [
      'souls/by-use-case/helper.md: missing YAML frontmatter between two --- lines at the top of the file',
    ]);
  });

  test('reports a frontmatter field that is present with an empty value', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace('name: helper', 'name:'),
    });
    assert.deepEqual(problems, ['souls/by-use-case/helper.md: missing frontmatter field `name`']);
  });

  test('accepts quoted frontmatter values', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace('category: use-case', 'category: "use-case"'),
      'souls/by-fleet/crew/lead-agent.md': GOOD_FLEET_MEMBER.replace('fleet: crew', "fleet: 'crew'"),
    });
    assert.deepEqual(problems, []);
  });

  test('reports a missing frontmatter field and a wrong fixed value', () => {
    const problems = fixture({
      'souls/by-use-case/helper.md': GOOD_USE_CASE.replace('name: helper\n', '').replace(
        'category: use-case',
        'category: industry',
      ),
    });
    assert.deepEqual(problems, [
      'souls/by-use-case/helper.md: missing frontmatter field `name`',
      'souls/by-use-case/helper.md: frontmatter field `category` is "industry", expected "use-case"',
    ]);
  });

  test('reports a fleet field that does not match the fleet directory', () => {
    const problems = fixture({
      'souls/by-fleet/crew/lead-agent.md': GOOD_FLEET_MEMBER.replace('fleet: crew', 'fleet: other'),
    });
    assert.deepEqual(problems, [
      'souls/by-fleet/crew/lead-agent.md: frontmatter field `fleet` is "other", expected "crew"',
    ]);
  });

  test('accepts either alternative and reports when both are missing', () => {
    assert.deepEqual(
      fixture({
        'souls/by-fleet/crew/lead-agent.md': GOOD_FLEET_MEMBER.replace('## Constraints', '## Boundaries'),
      }),
      [],
    );
    assert.deepEqual(
      fixture({
        'souls/by-fleet/crew/lead-agent.md': GOOD_FLEET_MEMBER.replace('## Constraints\n', ''),
      }),
      ['souls/by-fleet/crew/lead-agent.md: missing section ## Boundaries or ## Constraints'],
    );
  });

  test('reports a file at a location the table does not list', () => {
    const problems = fixture({ 'souls/helper/SOUL.md': GOOD_USE_CASE });
    assert.deepEqual(problems, ['souls/helper/SOUL.md: not at any location listed in CONTRIBUTING.md']);
  });

  test('reports a soul the README does not link', () => {
    const problems = fixture({ 'souls/by-use-case/second.md': GOOD_USE_CASE });
    assert.deepEqual(problems, [
      'souls/by-use-case/second.md: not linked from README.md (link the file, or its fleet directory)',
    ]);
  });

  test('reports a table row that no file matches', () => {
    const problems = fixture({ 'souls/by-fleet/crew/lead-agent.md': null });
    assert.deepEqual(problems, [
      'CONTRIBUTING.md: no file matches `souls/by-fleet/<fleet>/<name>-agent.md` (By Fleet, member)',
    ]);
  });

  // A location with six adjacent placeholders and a directory name of 120 letters, which the location
  // does not match. Trying each way of dividing the name among the placeholders took time that grew with
  // the sixth power of the name's length, one power for each placeholder.
  const ADJACENT = '`souls/<a><b><c><d><e><f>x/<name>.md`';
  const LONG_DIR = `souls/${'a'.repeat(120)}`;

  function adjacentFixture(options) {
    return fixture(
      {
        'CONTRIBUTING.md': `${TABLE_HEADER}| Odd | ${ADJACENT} | \`name\` | \`Identity\` |\n`,
        'README.md': '',
        'souls/by-use-case/helper.md': null,
        'souls/by-fleet/crew/lead-agent.md': null,
        [`${LONG_DIR}/x.md`]: '---\nname: x\n---\n\n## Identity\n',
      },
      options,
    );
  }

  test('matches a location with adjacent placeholders against a long directory name quickly', () => {
    const start = performance.now();
    const problems = adjacentFixture();
    const elapsed = performance.now() - start;
    assert.deepEqual(problems, [
      `${LONG_DIR}/x.md: not at any location listed in CONTRIBUTING.md`,
      `CONTRIBUTING.md: no file matches ${ADJACENT} (Odd)`,
    ]);
    assert.ok(elapsed < 1000, `checked in ${Math.round(elapsed)} ms`);
  });

  test(
    'compares a long directory name that cannot be read with adjacent placeholders quickly',
    { skip: CANNOT_DENY_READ },
    () => {
      const start = performance.now();
      const problems = adjacentFixture({ unreadable: [LONG_DIR] });
      const elapsed = performance.now() - start;
      assert.deepEqual(problems, [
        `${LONG_DIR}: cannot read: permission denied (EACCES)`,
        `CONTRIBUTING.md: no file matches ${ADJACENT} (Odd)`,
      ]);
      assert.ok(elapsed < 1000, `checked in ${Math.round(elapsed)} ms`);
    },
  );

  function templateFixture({ readme = BASE_README + TEMPLATE_ROW, template = GOOD_TEMPLATE } = {}) {
    return fixture({
      'CONTRIBUTING.md': GUIDE_WITH_TEMPLATE,
      'README.md': readme,
      'templates/basic.md': template,
    });
  }

  test('accepts a template whose README row lists its sections in file order', () => {
    assert.deepEqual(templateFixture(), []);
  });

  test('reports a template that no README table row links', () => {
    const expected = [
      'templates/basic.md: no README.md table row links it (add a row to the Templates table that lists its sections)',
    ];
    assert.deepEqual(templateFixture({ readme: BASE_README }), expected);
    assert.deepEqual(templateFixture({ readme: `${BASE_README}See [basic](templates/basic.md).\n` }), expected);
    assert.deepEqual(templateFixture({ readme: `${BASE_README}| [all](templates/) | Templates | \`Identity\` |\n` }), expected);
  });

  test('reports a README row whose sections differ from the template', () => {
    const fewer = TEMPLATE_ROW.replace('`Workflow`, ', '');
    assert.deepEqual(templateFixture({ readme: BASE_README + fewer }), [
      'templates/basic.md: README.md lists sections Identity, Harm Avoidance; the file has Identity, Workflow, Harm Avoidance',
    ]);
    const reordered = GOOD_TEMPLATE.replace('## Identity\n\n## Workflow', '## Workflow\n\n## Identity');
    assert.deepEqual(templateFixture({ template: reordered }), [
      'templates/basic.md: README.md lists sections Identity, Workflow, Harm Avoidance; the file has Workflow, Identity, Harm Avoidance',
    ]);
    const extra = GOOD_TEMPLATE.replace('## Harm Avoidance', '## Tool Permissions\n\n## Harm Avoidance');
    assert.deepEqual(templateFixture({ template: extra }), [
      'templates/basic.md: README.md lists sections Identity, Workflow, Harm Avoidance; the file has Identity, Workflow, Tool Permissions, Harm Avoidance',
    ]);
  });
});

describe('readRules and readSections', () => {
  test('reads fixed values, placeholders and alternatives from the table', () => {
    const [useCase, fleet] = readRules(GUIDE);
    assert.deepEqual(useCase.fields, [{ key: 'name' }, { key: 'category', value: 'use-case' }]);
    assert.deepEqual(fleet.sections, [['Identity'], ['Boundaries', 'Constraints']]);
    assert.deepEqual(fleet.match('souls/by-fleet/crew/lead-agent.md'), { fleet: 'crew', name: 'lead' });
    assert.equal(fleet.match('souls/by-fleet/crew/FLEET.md'), null);
  });

  test('gives each placeholder the most text that still lets the rest of the location match', () => {
    const [rule] = readRules(`${TABLE_HEADER}| Odd | \`souls/<a><b>/<name>-agent.md\` | | |\n`);
    assert.deepEqual(rule.match('souls/xyz/a-agent-agent.md'), { a: 'xy', b: 'z', name: 'a-agent' });
    assert.equal(rule.match('souls/x/a-agent.md'), null);
    assert.equal(rule.match('souls/xy/-agent.md'), null);
    assert.equal(rule.match('souls/x/y/a-agent.md'), null);
  });

  test('starts a placeholder after the whole literal that follows the placeholder before it', () => {
    const [dash] = readRules(`${TABLE_HEADER}| Odd | \`souls/<a>-<b>.md\` | | |\n`);
    assert.deepEqual(dash.match('souls/x-y.md'), { a: 'x', b: 'y' });
    const [word] = readRules(`${TABLE_HEADER}| Odd | \`souls/<a>-to-<b>.md\` | | |\n`);
    assert.deepEqual(word.match('souls/x-to-y.md'), { a: 'x', b: 'y' });
  });

  test('rejects a path with more or fewer segments than the location, even when each segment matches', () => {
    const [rule] = readRules(`${TABLE_HEADER}| Odd | \`souls/<a><b>/<name>-agent.md\` | | |\n`);
    assert.equal(rule.match('souls/xy/a-agent.md/extra'), null);
    assert.equal(rule.match('souls/xy'), null);
  });

  test('reads a location with a long run of < and no closing > quickly, as literal text', () => {
    // Splitting the location with a regular expression read the rest of the run from each <, so the time
    // grew with the square of the run's length: twice the run, four times as long.
    const run = '<'.repeat(100_000);
    const start = performance.now();
    const [rule] = readRules(`${TABLE_HEADER}| Odd | \`souls/<name><>/${run}.md\` | | |\n`);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1000, `read in ${Math.round(elapsed)} ms`);
    assert.deepEqual(rule.match(`souls/crew<>/${run}.md`), { name: 'crew' });
    assert.equal(rule.match('souls/crew<>/x.md'), null);
  });

  test('matches a location with many placeholders quickly, without a table of positions for each one', () => {
    // A table with a row per placeholder and a column per character took time and memory that grew with
    // the number of placeholders times the length of the name, for each name matched.
    const [many] = readRules(`${TABLE_HEADER}| Odd | \`souls/${'<a>'.repeat(100_000)}\` | | |\n`);
    const [long] = readRules(`${TABLE_HEADER}| Odd | \`souls/<first>${'<a>'.repeat(4_999)}.md\` | | |\n`);
    const start = performance.now();
    for (let i = 0; i < 20; i++) assert.equal(many.match(`souls/${String(i).padEnd(255, 'x')}`), null);
    assert.deepEqual(long.match(`souls/${'x'.repeat(20_000)}.md`), { first: 'x'.repeat(15_001), a: 'x' });
    assert.equal(long.match(`souls/${'x'.repeat(4_999)}.md`), null);
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 1000, `matched in ${Math.round(elapsed)} ms`);
  });

  test('matches a location with as many placeholders as the name has characters left after the literals', () => {
    const placeholders = Array.from({ length: 300 }, (_, i) => `<p${i}>`).join('');
    const [rule] = readRules(`${TABLE_HEADER}| Odd | \`souls/x${placeholders}.md\` | | |\n`);
    const each = (first) => Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`p${i}`, i === 0 ? first : 'y']));
    assert.deepEqual(rule.match(`souls/x${'y'.repeat(300)}.md`), each('y'));
    assert.deepEqual(rule.match(`souls/x${'y'.repeat(301)}.md`), each('yy'));
    assert.equal(rule.match(`souls/x${'y'.repeat(299)}.md`), null);
  });

  test('reads level-2 headings only', () => {
    assert.deepEqual(readSections(['# Title', '## Boundaries -- Things You Must Never Do', '### Detail']), [
      'Boundaries -- Things You Must Never Do',
    ]);
  });
});

describe('command line', () => {
  const script = join(repoRoot, 'scripts', 'check-souls.mjs');
  // A working directory beside the temporary roots. The summary names a root inside the working
  // directory by its relative path, so a test that expects a temporary root's absolute path runs
  // from here: the temporary directory can be inside the repository.
  let elsewhere;
  before(() => {
    elsewhere = mkdtempSync(join(tmpdir(), 'check-souls-cwd-'));
  });
  after(() => rmSync(elsewhere, { recursive: true, force: true }));

  function run(args, cwd = repoRoot) {
    return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8' });
  }

  for (const flag of ['--help', '-h']) {
    test(`${flag} prints usage and exits 0`, () => {
      const { status, stdout, stderr } = run([flag]);
      assert.equal(status, 0);
      assert.match(stdout, /^Usage: node scripts\/check-souls\.mjs \[--root <dir>\]/);
      assert.match(stdout, /--root <dir>/);
      assert.equal(stderr, '');
    });
  }

  // Spreading a directory's list of files into push overflows the stack from about 125,000 files. With a
  // stack of 200 KB in place of the default of about 1 MB, 50,000 files are well past that point.
  test('lists a directory of more files than fit on the stack as the arguments of one call', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-souls-many-'));
    try {
      writeFileSync(join(root, 'CONTRIBUTING.md'), GUIDE);
      const dir = join(root, 'souls', 'by-role', 'x');
      mkdirSync(dir, { recursive: true });
      for (let i = 0; i < 50000; i++) writeFileSync(join(dir, `${i}.md`), '');
      const { status, stdout, stderr } = spawnSync(process.execPath, ['--stack-size=200', script, '--root', root], {
        cwd: elsewhere,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      assert.equal(stderr, '');
      assert.equal(status, 1);
      assert.match(stdout, /^souls\/by-role\/x\/49999\.md: not at any location listed in CONTRIBUTING\.md$/m);
      assert.match(stdout, /^Checked 50000 files in /m);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('an unknown argument prints usage to stderr and exits 2', () => {
    const { status, stderr } = run(['--bogus']);
    assert.equal(status, 2);
    assert.match(stderr, /^Unknown argument: --bogus\nUsage: /);
  });

  test('prints an unknown argument as a path, keeping the backslashes of a Windows path on Windows', () => {
    const { status, stderr } = run(['C:\\repo']);
    assert.equal(status, 2);
    const shown = process.platform === 'win32' ? 'C:\\repo' : 'C:\\\\repo';
    assert.equal(stderr.split('\n')[0], `Unknown argument: ${shown}`);
  });

  // The test above tells the Windows way of printing a path apart from the others only on Windows. These
  // run main with each path separator, so both ways are checked on every platform.
  for (const [separator, shown] of [
    ['\\', 'C:\\repo\\a\\u{202e}b'],
    ['/', 'C:\\\\repo\\\\a\\u{202e}b'],
  ]) {
    test(`prints an unknown argument as a path when the path separator is ${separator}`, (t) => {
      const error = t.mock.method(console, 'error', () => {});
      assert.equal(main(['C:\\repo\\a\u{202e}b'], { separator }), 2);
      assert.equal(error.mock.callCount(), 1);
      assert.equal(error.mock.calls[0].arguments[0].split('\n')[0], `Unknown argument: ${shown}`);
    });
  }

  // These run main with each path separator, so both lines that name a --root directory that does not
  // exist, its problem line and the summary line, are checked the Windows way and the other way on every
  // platform. The directory is beside the working directory, so it is named by its absolute path.
  for (const [separator, escape] of [
    ['\\', (path) => path],
    ['/', (path) => path.replaceAll('\\', '\\\\')],
  ]) {
    test(`prints a --root directory that does not exist as a path when the path separator is ${separator}`, (t) => {
      t.mock.method(process, 'cwd', () => elsewhere);
      const log = t.mock.method(console, 'log', () => {});
      const missing = join(`${elsewhere}-missing`, 'no\\such\u{202e}dir');
      const shown = escape(missing).replace('\u{202e}', '\\u{202e}');
      assert.equal(main(['--root', missing], { separator }), 1);
      assert.deepEqual(
        log.mock.calls.map((call) => call.arguments[0]),
        [`${shown}: directory not found`, `Checked 0 files in ${shown} against 0 rules from CONTRIBUTING.md: 1 problem.`],
      );
    });
  }

  for (const args of [['--root'], ['--root', '--help'], ['--root', '-h']]) {
    test(`${args.join(' ')} reports the missing directory and exits 2`, () => {
      const { status, stdout, stderr } = run(args);
      assert.equal(status, 2);
      assert.match(stderr, /^Missing directory after --root\nUsage: /);
      assert.equal(stdout, '');
    });
  }

  test('exits 0 when there are no problems', () => {
    const { status, stdout } = run([]);
    assert.equal(status, 0, stdout);
    assert.match(stdout, /: 0 problems\.\n$/);
  });

  test('prints each problem and exits 1 when problems are found', () => {
    const broken = mkdtempSync(join(tmpdir(), 'check-souls-broken-'));
    try {
      const soul = 'souls/by-use-case/helper.md';
      mkdirSync(join(broken, dirname(soul)), { recursive: true });
      writeFileSync(join(broken, 'CONTRIBUTING.md'), GUIDE);
      writeFileSync(join(broken, 'README.md'), BASE_README);
      writeFileSync(
        join(broken, soul),
        GOOD_USE_CASE.replace('name: helper\n', '').replace('## Harm Avoidance\n', ''),
      );
      const { status, stdout } = run(['--root', broken], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'souls/by-use-case/helper.md: missing frontmatter field `name`',
        'souls/by-use-case/helper.md: missing section ## Harm Avoidance',
        'CONTRIBUTING.md: no file matches `souls/by-fleet/<fleet>/<name>-agent.md` (By Fleet, member)',
        `Checked 1 file in ${broken} against 2 rules from CONTRIBUTING.md: 3 problems.`,
        '',
      ]);
    } finally {
      rmSync(broken, { recursive: true, force: true });
    }
  });

  test('uses the singular for one file, one rule and one problem', () => {
    const single = mkdtempSync(join(tmpdir(), 'check-souls-single-'));
    try {
      const soul = 'souls/by-use-case/helper.md';
      mkdirSync(join(single, dirname(soul)), { recursive: true });
      writeFileSync(join(single, 'CONTRIBUTING.md'), GUIDE.split('| By Fleet, member |')[0]);
      writeFileSync(join(single, 'README.md'), '[helper](souls/by-use-case/helper.md)\n');
      writeFileSync(join(single, soul), GOOD_USE_CASE.replace('## Harm Avoidance\n', ''));
      const { status, stdout } = run(['--root', single], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'souls/by-use-case/helper.md: missing section ## Harm Avoidance',
        `Checked 1 file in ${single} against 1 rule from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
    } finally {
      rmSync(single, { recursive: true, force: true });
    }
  });

  test('reports a directory without CONTRIBUTING.md and exits 1', () => {
    const empty = mkdtempSync(join(tmpdir(), 'check-souls-empty-'));
    try {
      const { status, stdout } = run(['--root', empty], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'CONTRIBUTING.md: file not found',
        `Checked 0 files in ${empty} against 0 rules from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });

  test('reports a --root directory that does not exist and exits 1', () => {
    const { status, stdout } = run(['--root', 'no-such-dir'], elsewhere);
    assert.equal(status, 1);
    assert.deepEqual(stdout.split('\n'), [
      'no-such-dir: directory not found',
      'Checked 0 files in no-such-dir against 0 rules from CONTRIBUTING.md: 1 problem.',
      '',
    ]);
  });

  test('reports a --root that is a file and exits 1', () => {
    const { status, stdout } = run(['--root', 'README.md']);
    assert.equal(status, 1);
    assert.deepEqual(stdout.split('\n'), [
      'README.md: not a directory',
      'Checked 0 files in README.md against 0 rules from CONTRIBUTING.md: 1 problem.',
      '',
    ]);
  });

  test(
    'reports a --root that is a symbolic link loop and exits 1',
    { skip: process.platform === 'win32' ? 'creating a symbolic link needs extra rights on Windows' : false },
    () => {
      symlinkSync('loop', join(elsewhere, 'loop'));
      const { status, stdout, stderr } = run(['--root', 'loop'], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'loop: cannot read: too many levels of symbolic links (ELOOP)',
        'Checked 0 files in loop against 0 rules from CONTRIBUTING.md: 1 problem.',
        '',
      ]);
      assert.equal(stderr, '');
    },
  );

  test('reports a --root name that is too long and exits 1', () => {
    const name = 'a'.repeat(300);
    const { status, stdout, stderr } = run(['--root', name], elsewhere);
    assert.equal(status, 1);
    assert.deepEqual(stdout.split('\n'), [
      `${name}: cannot read: name too long (ENAMETOOLONG)`,
      `Checked 0 files in ${name} against 0 rules from CONTRIBUTING.md: 1 problem.`,
      '',
    ]);
    assert.equal(stderr, '');
  });

  test('reports a souls directory that cannot be read and exits 1', { skip: CANNOT_DENY_READ }, () => {
    const denied = mkdtempSync(join(tmpdir(), 'check-souls-denied-'));
    try {
      writeFileSync(join(denied, 'CONTRIBUTING.md'), GUIDE);
      writeFileSync(join(denied, 'README.md'), BASE_README);
      mkdirSync(join(denied, 'souls'));
      const { status, stdout, stderr } = withoutReadPermission([join(denied, 'souls')], () =>
        run(['--root', denied], elsewhere),
      );
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'souls: cannot read: permission denied (EACCES)',
        `Checked 0 files in ${denied} against 2 rules from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
      assert.equal(stderr, '');
    } finally {
      rmSync(denied, { recursive: true, force: true });
    }
  });

  test('help states the exit status for a --root directory that does not exist', () => {
    assert.match(run(['--help']).stdout, /1 problems found, including a --root\s+directory that does not exist/);
  });

  test('names the root relative to the working directory when it is inside it', () => {
    assert.match(run([]).stdout, / files in \. against /);
  });

  test('names a root below the working directory by its relative path', () => {
    mkdirSync(join(elsewhere, 'nested', 'root'), { recursive: true });
    const { stdout } = run(['--root', 'nested/root'], elsewhere);
    assert.ok(stdout.includes(' files in nested/root against '), stdout);
  });

  test('names the root by its absolute path when run from outside it', () => {
    const { stdout } = run(['--root', repoRoot], elsewhere);
    assert.ok(stdout.includes(` files in ${repoRoot} against `), stdout);
    assert.ok(!stdout.includes(' files in ..'), stdout);
  });

  test(
    'prints control characters in a file name as escapes',
    { skip: process.platform === 'win32' ? 'Windows file names cannot contain control characters' : false },
    () => {
      const root = mkdtempSync(join(tmpdir(), 'check-souls-control-'));
      try {
        mkdirSync(join(root, 'souls', 'by-use-case'), { recursive: true });
        writeFileSync(join(root, 'CONTRIBUTING.md'), GUIDE.split('| By Fleet, member |')[0]);
        writeFileSync(join(root, 'README.md'), '');
        const name = 'a\x1b[31mb\r\t\x7f\x9b\nChecked 0 files: 0 problems.md';
        writeFileSync(join(root, 'souls', 'by-use-case', name), '## Identity\n');
        const { status, stdout } = run(['--root', root], elsewhere);
        assert.equal(status, 1);
        assert.deepEqual(stdout.split('\n'), [
          'souls/by-use-case/a\\x1b[31mb\\r\\t\\x7f\\x9b\\nChecked 0 files: 0 problems.md: ' +
            'missing YAML frontmatter between two --- lines at the top of the file',
          `Checked 1 file in ${root} against 1 rule from CONTRIBUTING.md: 1 problem.`,
          '',
        ]);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  test('prints format characters and line or paragraph separators in a file name as escapes', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-souls-format-'));
    try {
      mkdirSync(join(root, 'souls', 'by-use-case'), { recursive: true });
      writeFileSync(join(root, 'CONTRIBUTING.md'), GUIDE.split('| By Fleet, member |')[0]);
      writeFileSync(join(root, 'README.md'), '');
      // A right-to-left override, zero width space, soft hyphen, line and paragraph separators and a
      // tag character outside the Basic Multilingual Plane.
      const name = 'a\u{202e}b\u{200b}c\xadd\u{2028}e\u{2029}f\u{e0041}g.md';
      writeFileSync(join(root, 'souls', 'by-use-case', name), '## Identity\n');
      const { status, stdout } = run(['--root', root], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'souls/by-use-case/a\\u{202e}b\\u{200b}c\\xadd\\u{2028}e\\u{2029}f\\u{e0041}g.md: ' +
          'missing YAML frontmatter between two --- lines at the top of the file',
        `Checked 1 file in ${root} against 1 rule from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('prints blank and invisible characters in a file name as escapes', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-souls-blank-'));
    try {
      mkdirSync(join(root, 'souls', 'by-use-case'), { recursive: true });
      writeFileSync(join(root, 'CONTRIBUTING.md'), GUIDE.split('| By Fleet, member |')[0]);
      writeFileSync(join(root, 'README.md'), '');
      // A no-break space, an ideographic space, three Hangul fillers, the Braille blank and a variation
      // selector inside and outside the Basic Multilingual Plane. The ordinary space stays as it is.
      const name = 'a\xa0b\u{3000}c\u{115f}d\u{1160}e\u{3164}f\u{2800}g\u{fe0f}h\u{e0100}i j.md';
      writeFileSync(join(root, 'souls', 'by-use-case', name), '## Identity\n');
      const { status, stdout } = run(['--root', root], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'souls/by-use-case/a\\xa0b\\u{3000}c\\u{115f}d\\u{1160}e\\u{3164}f\\u{2800}g\\u{fe0f}h\\u{e0100}i j.md: ' +
          'missing YAML frontmatter between two --- lines at the top of the file',
        `Checked 1 file in ${root} against 1 rule from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('prints the musical null notehead and private-use and unassigned code points as escapes', () => {
    const root = mkdtempSync(join(tmpdir(), 'check-souls-unassigned-'));
    try {
      mkdirSync(join(root, 'souls', 'by-use-case'), { recursive: true });
      writeFileSync(join(root, 'CONTRIBUTING.md'), GUIDE.split('| By Fleet, member |')[0]);
      writeFileSync(join(root, 'README.md'), '');
      // The null notehead is a symbol drawn as blank space. Some file systems do not accept a name with
      // an unassigned code point, so that one is given as an unknown argument instead.
      writeFileSync(join(root, 'souls', 'by-use-case', 'a\u{1d159}b\u{e000}c.md'), '## Identity\n');
      const { status, stdout } = run(['--root', root], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        'souls/by-use-case/a\\u{1d159}b\\u{e000}c.md: ' +
          'missing YAML frontmatter between two --- lines at the top of the file',
        `Checked 1 file in ${root} against 1 rule from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
      const unknown = run(['a\u{378}b'], elsewhere);
      assert.equal(unknown.status, 2);
      assert.equal(unknown.stderr.split('\n')[0], 'Unknown argument: a\\u{378}b');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test(
    'prints a backslash in a file or root name as \\\\, unlike the escape of a format character',
    { skip: process.platform === 'win32' ? 'Windows file names cannot contain a backslash' : false },
    () => {
      const root = mkdtempSync(join(tmpdir(), 'check-souls-back\\slash-'));
      try {
        mkdirSync(join(root, 'souls', 'by-use-case'), { recursive: true });
        writeFileSync(join(root, 'CONTRIBUTING.md'), GUIDE.split('| By Fleet, member |')[0]);
        writeFileSync(join(root, 'README.md'), '');
        // The text \u{202e}, and a right-to-left override.
        writeFileSync(join(root, 'souls', 'by-use-case', 'a\\u{202e}b.md'), '## Identity\n');
        writeFileSync(join(root, 'souls', 'by-use-case', 'a\u{202e}b.md'), '## Identity\n');
        const { status, stdout } = run(['--root', root], elsewhere);
        assert.equal(status, 1);
        assert.deepEqual(stdout.split('\n'), [
          'souls/by-use-case/a\\\\u{202e}b.md: missing YAML frontmatter between two --- lines at the top of the file',
          'souls/by-use-case/a\\u{202e}b.md: missing YAML frontmatter between two --- lines at the top of the file',
          `Checked 2 files in ${root.replace('back\\slash', 'back\\\\slash')} against 1 rule from CONTRIBUTING.md: ` +
            '2 problems.',
          '',
        ]);
        const missing = join(root, 'no\\such');
        assert.deepEqual(run(['--root', missing], elsewhere).stdout.split('\n'), [
          `${missing.replaceAll('\\', '\\\\')}: directory not found`,
          `Checked 0 files in ${missing.replaceAll('\\', '\\\\')} against 0 rules from CONTRIBUTING.md: 1 problem.`,
          '',
        ]);
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  test(
    'on Windows prints a --root directory that does not exist with the backslashes of its path kept',
    { skip: process.platform === 'win32' ? false : 'a backslash separates the parts of a path only on Windows' },
    () => {
      // A path beside the working directory, so the root is named by its absolute path.
      const missing = join(`${elsewhere}-missing`, 'no-such-dir');
      assert.ok(missing.includes('\\'), missing);
      const { status, stdout } = run(['--root', missing], elsewhere);
      assert.equal(status, 1);
      assert.deepEqual(stdout.split('\n'), [
        `${missing}: directory not found`,
        `Checked 0 files in ${missing} against 0 rules from CONTRIBUTING.md: 1 problem.`,
        '',
      ]);
    },
  );

  test(
    'names the root by its absolute path when the working directory has been removed',
    { skip: process.platform === 'win32' ? 'Windows does not remove a directory that is in use' : false },
    () => {
      // The shell removes its working directory, then runs the script in it.
      const runInRemoved = (args) =>
        spawnSync(
          '/bin/sh',
          ['-c', 'mkdir gone && cd gone && rmdir ../gone && exec "$@"', 'sh', process.execPath, script, ...args],
          { cwd: elsewhere, encoding: 'utf8' },
        );
      const found = runInRemoved(['--root', repoRoot]);
      assert.equal(found.stderr, '');
      assert.equal(found.status, 0, found.stdout);
      assert.ok(found.stdout.includes(` files in ${repoRoot} against `), found.stdout);
      assert.match(found.stdout, /: 0 problems\.\n$/);
      const missing = runInRemoved(['--root', 'no-such-dir']);
      assert.equal(missing.stderr, '');
      assert.equal(missing.status, 1);
      assert.deepEqual(missing.stdout.split('\n'), [
        'no-such-dir: directory not found',
        'Checked 0 files in no-such-dir against 0 rules from CONTRIBUTING.md: 1 problem.',
        '',
      ]);
    },
  );
});

// A period that ends a sentence of prose rather than a word of a command: a period followed by a space, a
// tab or the end of the line, with any closing brackets, quotes or emphasis marks, `)`, `]`, `"`, `'`, `*`
// or `_`, between them, as in `(Run npx --yes hackmyagent@latest.)` or `**guard sign --files.**`. A period
// followed by any other character, such as a word character, another period, a comma, a backtick or a
// no-break space, is part of a word to the shell, as in @latest.1, @latest... or --files.md. NPX_PINNED
// and GUARD_SIGN_FILES read a period after their last word this way, and guardCommands reads a period at
// the end of any word of a guard command this way.
const SENTENCE_PERIOD = /\.[)\]"'*_]*(?=[ \t]|$)/;

// npx runs a hackmyagent or opena2a-cli that is already installed, even an older release, unless the
// command asks for @latest, and without --yes it stops to ask before installing. A command is pinned
// when `--yes <package>@latest` is followed by a space, a tab, a backtick, by ;, |, &, (, ), < or >,
// which end a word in bash and dash, as in `(npx --yes hackmyagent@latest)` or `@latest|tee x`, by a
// SENTENCE_PERIOD or by the end of its line. A < or > followed by ( is not counted: bash and zsh read
// <(...) and >(...) as a process substitution and join the path it opens to the word, as in
// @latest/dev/fd/63, which names another package, as @latest/next does. zsh ends a word at a ( that
// follows it directly only when ) comes next, as in @latest(), which it reads as a function definition,
// and reads @latest(x) as a pattern with glob qualifiers, which stops with `no matches found`; bash and
// dash stop at such a ( with a syntax error, so no shell runs another package there. Any other period
// after @latest makes it part of a longer word, as in @latest.1, which names another release.
// An npx command runs the package named by its first word that is not an option, so prose such as
// "npx downloads hackmyagent" names the package without running it. The shell separates words by any
// run of spaces and tabs, and NPX_PINNED does too. NPX_PACKAGE also separates words by other
// whitespace, such as a no-break space, and by the next line character U+0085 and the zero width
// space U+200B, which \s does not match, so a command whose words are joined by one is still checked,
// and is reported as not pinned. A word joined to an option word by such characters alone, with no space
// or tab between them, is part of that option word to the shell, so NPX_PACKAGE reads it both ways: as
// part of the option, so that `npx -x<U+200B>y hackmyagent` is checked as running hackmyagent, and as
// the package, so that `npx --yes<U+200B>hackmyagent@latest` is too. A word that starts with - is read
// as an option either way, so each word is read one way only and a long run of them is read in linear
// time.
const NPX_PACKAGE =
  /^[\s\u{85}\u{200b}]+(?:-[^\s\u{85}\u{200b}]*(?:(?:(?![ \t])[\s\u{85}\u{200b}])+[^-\s\u{85}\u{200b}][^\s\u{85}\u{200b}]*)*[\s\u{85}\u{200b}]+)*(?:hackmyagent|opena2a-cli)\b/u;
const NPX_PINNED = new RegExp(
  String.raw`^[ \t]+--yes[ \t]+(?:hackmyagent|opena2a-cli)@latest(?=[ \t\`;|&()]|[<>](?!\()|${SENTENCE_PERIOD.source}|$)`,
);

// The files docTexts reads. A new guide is added here too, so a test that reads the guides is shown
// to read every one of them.
const DOC_FILES = [
  'CONTRIBUTING.md',
  'README.md',
  'guides/creating-your-first-soul.md',
  'guides/soul-for-teams.md',
  'guides/soul-hardening.md',
  'guides/soul-vs-skills.md',
];

// Returns [file, text] for README.md, CONTRIBUTING.md and each guide.
function docTexts() {
  const guides = readdirSync(join(repoRoot, 'guides'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => `guides/${name}`);
  return ['README.md', 'CONTRIBUTING.md', ...guides].map((file) => [file, readFileSync(join(repoRoot, file), 'utf8')]);
}

// Returns `<file>:<line>: <text>` for each line of a markdown file with an npx command that runs
// hackmyagent or opena2a-cli without `--yes <package>@latest`. Each npx on a line is checked against
// the rest of its line, so the check sees the character that follows @latest even when it is a later
// npx, as in @latest.npx. Only an npx that ends a word can be followed by the whitespace a command
// needs, and an npx in a word that starts with -, such as --use-npx, is part of an option and is
// skipped. Each option word after an npx is then read once, rather than once for every npx before it.
// A line ends at LF or CR LF, so a file checked out with CR LF line ends is read the same way.
function unpinnedNpxCommands(file, text) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const commands = [...line.matchAll(/[^\s\u{85}\u{200b}]+/gu)]
      .filter(([word]) => !word.startsWith('-') && /\bnpx$/.test(word))
      .map((match) => line.slice(match.index + match[0].length));
    const unpinned = commands.some((command) => NPX_PACKAGE.test(command) && !NPX_PINNED.test(command));
    return unpinned ? [`${file}:${index + 1}: ${line.trim()}`] : [];
  });
}

describe('npx commands in README.md, CONTRIBUTING.md and the guides', () => {
  test('a command is pinned when @latest is followed by a space, a tab, a backtick, a sentence period or the end of its line', () => {
    const text = [
      'Run it as `npx --yes hackmyagent@latest`.',
      'npx --yes hackmyagent@latest',
      'npx --yes opena2a-cli@latest guard verify',
      'Run npx --yes hackmyagent@latest.',
      '`--yes` lets npx install it without asking.',
      'npx hackmyagent secure .',
      'npx --yes hackmyagent@0.30.0 secure .',
      'npx --yes hackmyagent@latest-beta secure .',
      'npx --yes hackmyagent@latest.1 secure .',
      'npx --yes hackmyagent@latest secure . && npx hackmyagent scan-soul .',
      'git checkout <hash> -- SOUL.md && npx opena2a-cli guard sign SOUL.md',
      'npx --yes hackmyagent@latest/next secure .',
      'Run npx --yes hackmyagent@latest, then read the report.',
      "HACKMYAGENT='npx --yes hackmyagent@latest'",
      'npx --yes hackmyagent@latest.npx secure .',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:6: npx hackmyagent secure .',
      'a.md:7: npx --yes hackmyagent@0.30.0 secure .',
      'a.md:8: npx --yes hackmyagent@latest-beta secure .',
      'a.md:9: npx --yes hackmyagent@latest.1 secure .',
      'a.md:10: npx --yes hackmyagent@latest secure . && npx hackmyagent scan-soul .',
      'a.md:11: git checkout <hash> -- SOUL.md && npx opena2a-cli guard sign SOUL.md',
      'a.md:12: npx --yes hackmyagent@latest/next secure .',
      'a.md:13: Run npx --yes hackmyagent@latest, then read the report.',
      "a.md:14: HACKMYAGENT='npx --yes hackmyagent@latest'",
      'a.md:15: npx --yes hackmyagent@latest.npx secure .',
    ]);
  });

  test('a command is pinned when @latest is followed by ;, |, &, (, ), or by < or > not followed by (', () => {
    const text = [
      '(npx --yes opena2a-cli@latest) guard verify',
      '(Run npx --yes hackmyagent@latest).',
      'npx --yes hackmyagent@latest|tee x',
      'npx --yes hackmyagent@latest;ls',
      'npx --yes hackmyagent@latest&&ls',
      'npx --yes hackmyagent@latest&',
      'npx --yes hackmyagent@latest<in',
      'npx --yes hackmyagent@latest>out',
      'npx --yes hackmyagent@latest(x)',
      'npx --yes hackmyagent@latest#x',
      '[Run npx --yes hackmyagent@latest]',
      'npx --yes hackmyagent@latest=1',
      'npx --yes hackmyagent@latest<(echo)',
      'npx --yes hackmyagent@latest>(cat)',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:10: npx --yes hackmyagent@latest#x',
      'a.md:11: [Run npx --yes hackmyagent@latest]',
      'a.md:12: npx --yes hackmyagent@latest=1',
      'a.md:13: npx --yes hackmyagent@latest<(echo)',
      'a.md:14: npx --yes hackmyagent@latest>(cat)',
    ]);
  });

  test('a sentence period after @latest may be followed by closing brackets, quotes or emphasis marks', () => {
    const text = [
      '(Run npx --yes hackmyagent@latest.)',
      '[Run npx --yes hackmyagent@latest.]',
      '"Run npx --yes hackmyagent@latest."',
      "'Run npx --yes hackmyagent@latest.'",
      '**Run npx --yes hackmyagent@latest.**',
      '_Run npx --yes hackmyagent@latest._',
      '*(Run npx --yes opena2a-cli@latest.)* Then scan.',
      'Run npx --yes hackmyagent@latest...',
      'Run npx --yes hackmyagent@latest.\u{a0}Then scan.',
      'Run npx --yes hackmyagent@latest., then scan.',
      '(Run npx --yes hackmyagent@latest.)secure',
      'Run `npx --yes hackmyagent@latest.`',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:8: Run npx --yes hackmyagent@latest...',
      'a.md:9: Run npx --yes hackmyagent@latest.\u{a0}Then scan.',
      'a.md:10: Run npx --yes hackmyagent@latest., then scan.',
      'a.md:11: (Run npx --yes hackmyagent@latest.)secure',
      'a.md:12: Run `npx --yes hackmyagent@latest.`',
    ]);
  });

  test('a line that mentions npx and later names a package is not a command', () => {
    const text = [
      'On first use npx downloads hackmyagent, which can take a minute.',
      'With npx, opena2a-cli runs without a global install.',
      'npx -y hackmyagent secure .',
      'Run `npx --yes --quiet hackmyagent@latest secure .` from the project root.',
      'Pass --use-npx hackmyagent to the installer.',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:3: npx -y hackmyagent secure .',
      'a.md:4: Run `npx --yes --quiet hackmyagent@latest secure .` from the project root.',
    ]);
  });

  test('checks a long line of option words that contain npx in linear time', () => {
    // Returns the time taken to check a line of the given number of option words. Checking each npx
    // against the whole rest of its line took time that grew with the square of the number of words:
    // twice the words, four times as long.
    const check = (words) => {
      const line = `npx ${'-npx '.repeat(words)}`;
      const start = performance.now();
      assert.deepEqual(unpinnedNpxCommands('a.md', line), []);
      return performance.now() - start;
    };
    const elapsed = check(20_000);
    assert.ok(elapsed < 1000, `checked in ${Math.round(elapsed)} ms`);
    // As for the backslash runs above, the times at two lengths four times apart are compared, each the
    // fastest of ten checks.
    const fastest = (words) => Math.min(...Array.from({ length: 10 }, () => check(words)));
    const ratio = fastest(20_000) / fastest(5_000);
    assert.ok(ratio < 6, `four times the words took ${ratio.toFixed(2)} times as long`);
  });

  test('a command is pinned when its words are separated by more than one space or a tab', () => {
    const text = [
      'npx  --yes hackmyagent@latest secure .',
      'npx --yes\topena2a-cli@latest guard verify',
      'npx  hackmyagent secure .',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), ['a.md:3: npx  hackmyagent secure .']);
  });

  test('a command is not pinned when its words are joined by whitespace the shell does not split on', () => {
    const text = [
      'npx\u{a0}--yes\u{a0}hackmyagent@latest scan .',
      'npx --yes\u{2009}opena2a-cli@latest guard verify',
      'npx --yes\u{3000}hackmyagent@latest secure .',
      'npx --yes\u{feff}hackmyagent@latest secure .',
      'npx --yes\vhackmyagent@latest secure .',
      'npx --yes\fhackmyagent@latest secure .',
      'npx --yes\rhackmyagent@latest secure .',
      'npx --yes hackmyagent@latest\u{a0}secure .',
      'npx\u{a0}hackmyagent secure .',
      'npx\u{a0}--yes hackmyagent@latest scan .',
      'npx --yes hackmyagent@latest scan .',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:1: npx\u{a0}--yes\u{a0}hackmyagent@latest scan .',
      'a.md:2: npx --yes\u{2009}opena2a-cli@latest guard verify',
      'a.md:3: npx --yes\u{3000}hackmyagent@latest secure .',
      'a.md:4: npx --yes\u{feff}hackmyagent@latest secure .',
      'a.md:5: npx --yes\vhackmyagent@latest secure .',
      'a.md:6: npx --yes\fhackmyagent@latest secure .',
      'a.md:7: npx --yes\rhackmyagent@latest secure .',
      'a.md:8: npx --yes hackmyagent@latest\u{a0}secure .',
      'a.md:9: npx\u{a0}hackmyagent secure .',
      'a.md:10: npx\u{a0}--yes hackmyagent@latest scan .',
    ]);
  });

  test('a command is not pinned when its words are joined by a next line character or a zero width space', () => {
    const text = [
      'npx\u{85}hackmyagent secure .',
      'npx\u{200b}hackmyagent secure .',
      'npx --yes\u{85}hackmyagent@latest secure .',
      'npx --yes\u{200b}opena2a-cli@latest guard verify',
      'npx --yes hackmyagent@latest scan .',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:1: npx\u{85}hackmyagent secure .',
      'a.md:2: npx\u{200b}hackmyagent secure .',
      'a.md:3: npx --yes\u{85}hackmyagent@latest secure .',
      'a.md:4: npx --yes\u{200b}opena2a-cli@latest guard verify',
    ]);
  });

  test('a command is not pinned when an option word holds whitespace the shell does not split on', () => {
    // The shell reads -x<U+200B>y as one option word, so the first five commands run the package after it.
    // In the last two, a space separates y from -x, so y is the package.
    const text = [
      'npx -x\u{200b}y hackmyagent secure .',
      'npx -x\u{85}y hackmyagent secure .',
      'npx -x\u{a0}y opena2a-cli guard verify',
      'npx --yes\u{200b}foo hackmyagent@latest secure .',
      'npx --yes\u{85}-x hackmyagent@latest secure .',
      'npx -x \u{200b}y hackmyagent secure .',
      'npx -x\u{200b} y hackmyagent secure .',
    ].join('\n');
    assert.deepEqual(unpinnedNpxCommands('a.md', text), [
      'a.md:1: npx -x\u{200b}y hackmyagent secure .',
      'a.md:2: npx -x\u{85}y hackmyagent secure .',
      'a.md:3: npx -x\u{a0}y opena2a-cli guard verify',
      'a.md:4: npx --yes\u{200b}foo hackmyagent@latest secure .',
      'a.md:5: npx --yes\u{85}-x hackmyagent@latest secure .',
    ]);
  });

  test('checks a long run of option words joined by zero width spaces in linear time', () => {
    // Returns the time taken to check `npx`, the given number of option words joined by U+200B, and a last
    // word that is not a package. An option word pattern that can also take U+200B, as -\S* can, divides
    // such a run in more ways for each word: with -\S* as the option word of NPX_PACKAGE, each added word
    // about doubled the time.
    const check = (words) => {
      const line = `npx ${'-a\u{200b}'.repeat(words)}x`;
      const start = performance.now();
      assert.deepEqual(unpinnedNpxCommands('a.md', line), []);
      return performance.now() - start;
    };
    // A short run first, so that a check whose time doubles with each word fails here rather than running
    // for ever on the long runs below.
    const short = check(30);
    assert.ok(short < 1000, `checked 30 words in ${Math.round(short)} ms`);
    const elapsed = check(20_000);
    assert.ok(elapsed < 1000, `checked in ${Math.round(elapsed)} ms`);
    const fastest = (words) => Math.min(...Array.from({ length: 10 }, () => check(words)));
    const ratio = fastest(20_000) / fastest(5_000);
    assert.ok(ratio < 6, `four times the words took ${ratio.toFixed(2)} times as long`);
  });

  test('a command at the end of a line is pinned when the line ends with CR LF', () => {
    const text = 'npx --yes hackmyagent@latest\r\nnpx hackmyagent secure .\r\n';
    assert.deepEqual(unpinnedNpxCommands('a.md', text), ['a.md:2: npx hackmyagent secure .']);
  });

  test('every npx hackmyagent and npx opena2a-cli command runs the published release', () => {
    const texts = docTexts();
    assert.deepEqual(texts.map(([file]) => file).sort(), DOC_FILES);
    assert.deepEqual(texts.flatMap(([file, text]) => unpinnedNpxCommands(file, text)), []);
    for (const name of ['hackmyagent', 'opena2a-cli']) {
      assert.ok(
        texts.some(([, text]) => text.includes(`npx --yes ${name}@latest`)),
        `no npx ${name} command found in README.md, CONTRIBUTING.md or the guides`,
      );
    }
  });
});

// hackmyagent secure --ignore <check> keeps a finding out of the Findings list and changes nothing else:
// the report still counts the finding in its severity totals, its categories and its verdict, and the
// command still exits 1. IGNORE_SENTENCE is a sentence that starts at an inline code span naming the
// option, up to its period.
const IGNORE_SENTENCE = /`--ignore\b[^`]*`[^.]*\./g;

// Returns `<file>:<line>: <sentence>` for each IGNORE_SENTENCE in a markdown file. A line ends at LF or
// CR LF.
function ignoreSentences(file, text) {
  return text.split(/\r?\n/).flatMap((line, index) =>
    [...line.matchAll(IGNORE_SENTENCE)].map(([sentence]) => `${file}:${index + 1}: ${sentence}`),
  );
}

describe('the --ignore option in README.md, CONTRIBUTING.md and the guides', () => {
  test('reads each sentence that starts at --ignore, with its file and line', () => {
    const text = 'Scan it.\n`--ignore CONFIG-002` hides the finding but still exits 1. Then reword.\r\nScan again.\r\n';
    assert.deepEqual(ignoreSentences('a.md', text), [
      'a.md:2: `--ignore CONFIG-002` hides the finding but still exits 1.',
    ]);
  });

  test('a sentence about --ignore says it only hides the finding from the list and the command still exits 1', () => {
    const sentences = docTexts().flatMap(([file, text]) => ignoreSentences(file, text));
    for (const file of ['README.md', 'guides/soul-hardening.md']) {
      assert.ok(
        sentences.some((sentence) => sentence.startsWith(`${file}:`)),
        `no sentence that starts at --ignore found in ${file}`,
      );
    }
    assert.deepEqual(
      sentences.filter((sentence) => !/ only hides the finding from the list; .*\bstill exits 1\b/.test(sentence)),
      [],
    );
  });
});

// opena2a-cli guard sign reads a word after `sign` as the directory to search for config files, and the
// search skips SOUL.md, so in a directory holding only SOUL.md, `guard sign SOUL.md` and `guard sign`
// sign nothing. It signs the files named after --files.
// GUARD_SIGN_FILES separates words by spaces and tabs, as the shell does. --files is a word of its own
// when it is followed by a space, a tab, the end of the command (a backtick, & or the end of the line),
// by ;, |, (, ), < or >, which end a word in bash and dash, or by a SENTENCE_PERIOD, as in
// `(Sign them with guard sign --files.)`. As for NPX_PINNED, a < or > followed by ( is not counted, as
// bash and zsh join the path a process substitution opens to the word, as in --files/dev/fd/63, and zsh
// reads a ( that follows a word directly as NPX_PINNED describes. A # is not counted either: # starts a
// comment only at the start of a word, so the shell passes --files#x as one word. Any other period after
// --files makes it part of another word to the shell, as in --files.md, --files... or --files. followed
// by a no-break space. --files=<file> names its file as `--files <file>` does. GUARD_SIGN also separates
// words by other whitespace, such as a no-break space, and by the next line character U+0085 and the zero
// width space U+200B, which \s does not match, so a command whose words are joined by one is still
// checked, and is reported even when --files follows. GUARD_SIGN_FILES is tested at the position after
// each `sign` and reads only the start of the text there, so a line with many `guard sign` commands is
// checked in linear time, and a later `guard sign` on the same line, as after ; or |, is matched and
// checked too.
const GUARD_SIGN = /\bguard([\s\u{85}\u{200b}]+)sign\b/gu;
const GUARD_SIGN_FILES = new RegExp(
  String.raw`[ \t]+--files(?=[ \t\`&;|()=]|[<>](?!\()|${SENTENCE_PERIOD.source}|$)`,
  'y',
);

// Where opena2a-cli guard sign writes its signatures.
const GUARD_DIR = '.opena2a/guard/';
const GUARD_STORE = `${GUARD_DIR}signatures.json`;

// Returns `<file>:<line>: <text>` for each line of a markdown file with a `guard sign` command that is not
// followed by --files, or whose `guard` and `sign` are joined by whitespace other than spaces and tabs.
// Each `guard sign` on a line is checked. Whether file names follow --files is not. A line ends at LF or
// CR LF.
function unnamedGuardSigns(file, text) {
  return text.split(/\r?\n/).flatMap((line, index) => {
    const unnamed = [...line.matchAll(GUARD_SIGN)].some((match) => {
      GUARD_SIGN_FILES.lastIndex = match.index + match[0].length;
      return !/^[ \t]+$/.test(match[1]) || !GUARD_SIGN_FILES.test(line);
    });
    return unnamed ? [`${file}:${index + 1}: ${line.trim()}`] : [];
  });
}

// A guard sign or guard verify command after `npx --yes opena2a-cli@latest`, and the < or > that ends it, if
// one does. A < or > followed by ( does not end it and is kept in its word, as NPX_PINNED and
// GUARD_SIGN_FILES read it. The command takes every such < or >, so the < or > after it is never followed by
// ( and needs no check. guardCommands reads it.
const GUARD_COMMAND = new RegExp(
  String.raw`npx[ \t]+--yes[ \t]+opena2a-cli@latest[ \t]+(guard[ \t]+(?:sign|verify)\b(?:(?!(?<![ \t.])${SENTENCE_PERIOD.source})(?:[^\`#&;|()<>]|(?<![ \t])#|[<>](?=\()))*)([<>]?)`,
  'g',
);

// Returns the words after `npx --yes opena2a-cli@latest` in each distinct guard sign and guard verify
// command in the texts. A command ends at a backtick, a # comment, &, as in && or 2>&1, ;, |, ( or ), as
// in `(npx --yes opena2a-cli@latest guard verify)`, a redirection (< or >) or the end of its line, which
// ends at LF or CR LF. A < or > followed by ( is not a redirection: bash and zsh read <(...) and >(...) as
// a process substitution and join the path it opens to the word, as in verify/dev/fd/63. The < or > is
// kept in its word and the command ends at the (. A word after the subcommand, as in SOUL.md>, is passed
// on to opena2a-cli. A subcommand read this way, as in verify<, is neither sign nor verify, so the opt-in
// run, which runs only a command whose second word is `sign` or `verify`, does not run it, and a test that
// looks for a guard verify command does not count it. As in the shell, a # starts a comment only at the
// start of a word, after a space, a tab or an operator that ends the command, as in `;#x`, and a # inside
// a word is part of it, as in SOUL.md#x. A backtick is not such an operator: it ends the command because
// it closes a Markdown code span. Nor is the ) that closes $(...): a # after it is part of the word, as
// after a backtick that closes a command substitution, so `echo $(echo j)#x` prints j#x in bash, zsh and
// dash, while `(echo c)#x` prints c. A command ends at the ( of $( in any case. A number of one or more
// digits written just before a redirection, with no space or tab between them, as in 2> or 0<, names the
// file descriptor it opens and is not a word. This follows bash and POSIX sh, which read 10>out that way
// too; zsh and dash, the /bin/sh of Debian and Ubuntu, read only a single digit that way, and read the 10
// in 10>out as a word. A SENTENCE_PERIOD at the end of a word also ends the command, as in
// `Run npx --yes opena2a-cli@latest guard verify.`, so the opt-in run passes `verify`, not `verify.`, to
// opena2a-cli. A period after a space, a tab or another period starts or continues a word, as in
// `--files .` or `verify...`, and is kept. Its words are separated by spaces and tabs only, as the shell
// separates them, so the opt-in run passes `--files`, a no-break space and `SOUL.md` to opena2a-cli as one
// word, as a shell would. Quotes are not read: `--files "a b.md"` is read as the words `"a` and `b.md"`,
// so a test checks that no command in the docs quotes a word.
function guardCommands(texts) {
  const commands = new Map();
  for (const [, text] of texts) {
    for (const line of text.split(/\r?\n/)) {
      const matches = line.matchAll(GUARD_COMMAND);
      for (const [, command, redirection] of matches) {
        const words = command.split(/[ \t]+/).filter((word) => word !== '');
        if (redirection && !/[ \t]$/.test(command) && /^\d+$/.test(words.at(-1))) words.pop();
        commands.set(words.join(' '), words);
      }
    }
  }
  return [...commands.values()];
}

// Runs `<command> <words>` in `dir` and returns the command line with its exit status, or with `stop`, a
// problem after which nothing more is run.
function runGuard(command, words, dir, timeout) {
  const line = [...command, ...words].join(' ');
  const [program, args, options] = scannerSpawn([...command, ...words]);
  const { status, signal, error } = spawnSync(program, args, {
    ...options,
    cwd: dir,
    encoding: 'utf8',
    timeout,
    // opena2a-cli sends anonymous usage telemetry unless this is off.
    env: { ...process.env, OPENA2A_TELEMETRY: 'off' },
  });
  if (error?.code === 'ETIMEDOUT') {
    return { line, stop: `${line} did not finish within ${timeout / 1000} seconds; stopped at this command` };
  }
  if (error) return { line, stop: `could not run ${line}: ${error.message}` };
  return { line, status: status ?? signal };
}

// Runs each sign command, as `<command> <words>`, in its own temporary directory holding only `soul` as
// SOUL.md. The sign command must write GUARD_STORE, and each verify command must then pass, and fail once
// SOUL.md has changed. Returns one line per problem. A command still running after `timeout` milliseconds
// is stopped, and no later command is run.
function guardProblems(command, commands, soul, { timeout = SCAN_TIMEOUT_MS } = {}) {
  const problems = [];
  const verifies = commands.filter((words) => words[1] === 'verify');
  for (const sign of commands.filter((words) => words[1] === 'sign')) {
    const dir = mkdtempSync(join(tmpdir(), 'check-souls-guard-'));
    try {
      writeFileSync(join(dir, 'SOUL.md'), soul);
      const signed = runGuard(command, sign, dir, timeout);
      if (signed.stop) return [...problems, signed.stop];
      if (signed.status !== 0) problems.push(`${signed.line} exited ${signed.status}`);
      if (!existsSync(join(dir, GUARD_STORE))) problems.push(`${signed.line} did not write ${GUARD_STORE}`);
      for (const verify of verifies) {
        const result = runGuard(command, verify, dir, timeout);
        if (result.stop) return [...problems, result.stop];
        if (result.status !== 0) problems.push(`${result.line} exited ${result.status} after ${sign.join(' ')}`);
      }
      appendFileSync(join(dir, 'SOUL.md'), '\nA line added after signing.\n');
      for (const verify of verifies) {
        const result = runGuard(command, verify, dir, timeout);
        if (result.stop) return [...problems, result.stop];
        if (result.status === 0) problems.push(`${result.line} exited 0 after SOUL.md changed`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  return problems;
}

describe('guard commands in README.md, CONTRIBUTING.md and the guides', () => {
  test('a guard sign command is followed by --files', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md',
      'Sign it with `guard sign --files SOUL.md`.',
      'Sign them with `guard sign --files`, followed by their paths.',
      'npx --yes opena2a-cli@latest guard sign SOUL.md',
      'Sign it with `guard sign`.',
      'git checkout <hash> -- SOUL.md && npx --yes opena2a-cli@latest guard sign SOUL.md',
      'Run `opena2a guard resign` after an edit.',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:4: npx --yes opena2a-cli@latest guard sign SOUL.md',
      'a.md:5: Sign it with `guard sign`.',
      'a.md:6: git checkout <hash> -- SOUL.md && npx --yes opena2a-cli@latest guard sign SOUL.md',
    ]);
  });

  test('checks each guard sign on a line, whichever comes first', () => {
    const text = [
      'guard sign --files a.md then guard sign b.md',
      'guard sign b.md then guard sign --files a.md',
      'guard sign --files a.md then guard\u{a0}sign --files b.md',
      'guard sign --files a.md then guard sign --files b.md',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:1: guard sign --files a.md then guard sign b.md',
      'a.md:2: guard sign b.md then guard sign --files a.md',
      'a.md:3: guard sign --files a.md then guard\u{a0}sign --files b.md',
    ]);
  });

  test('a guard sign command is followed by --files when its words are separated by more than one space or a tab', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign  --files SOUL.md',
      'npx --yes opena2a-cli@latest guard  sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\tsign\t--files SOUL.md',
      'npx --yes opena2a-cli@latest guard  sign SOUL.md',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), ['a.md:4: npx --yes opena2a-cli@latest guard  sign SOUL.md']);
  });

  test('a guard sign command is reported when its words are joined by whitespace the shell does not split on', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign\u{a0}--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\u{2009}--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\u{3000}--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\u{feff}--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\v--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\f--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\r--files SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{a0}sign SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{a0}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard \u{a0}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{a0} sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{2009}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{3000}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{feff}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\vsign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\fsign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\rsign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:1: npx --yes opena2a-cli@latest guard sign\u{a0}--files SOUL.md',
      'a.md:2: npx --yes opena2a-cli@latest guard sign\u{2009}--files SOUL.md',
      'a.md:3: npx --yes opena2a-cli@latest guard sign\u{3000}--files SOUL.md',
      'a.md:4: npx --yes opena2a-cli@latest guard sign\u{feff}--files SOUL.md',
      'a.md:5: npx --yes opena2a-cli@latest guard sign\v--files SOUL.md',
      'a.md:6: npx --yes opena2a-cli@latest guard sign\f--files SOUL.md',
      'a.md:7: npx --yes opena2a-cli@latest guard sign\r--files SOUL.md',
      'a.md:8: npx --yes opena2a-cli@latest guard\u{a0}sign SOUL.md',
      'a.md:9: npx --yes opena2a-cli@latest guard\u{a0}sign --files SOUL.md',
      'a.md:10: npx --yes opena2a-cli@latest guard \u{a0}sign --files SOUL.md',
      'a.md:11: npx --yes opena2a-cli@latest guard\u{a0} sign --files SOUL.md',
      'a.md:12: npx --yes opena2a-cli@latest guard\u{2009}sign --files SOUL.md',
      'a.md:13: npx --yes opena2a-cli@latest guard\u{3000}sign --files SOUL.md',
      'a.md:14: npx --yes opena2a-cli@latest guard\u{feff}sign --files SOUL.md',
      'a.md:15: npx --yes opena2a-cli@latest guard\vsign --files SOUL.md',
      'a.md:16: npx --yes opena2a-cli@latest guard\fsign --files SOUL.md',
      'a.md:17: npx --yes opena2a-cli@latest guard\rsign --files SOUL.md',
    ]);
  });

  test('a guard sign command is reported when its words are joined by a next line character or a zero width space', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard\u{85}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard\u{200b}sign --files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign\u{85}--files SOUL.md',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:1: npx --yes opena2a-cli@latest guard\u{85}sign --files SOUL.md',
      'a.md:2: npx --yes opena2a-cli@latest guard\u{200b}sign --files SOUL.md',
      'a.md:3: npx --yes opena2a-cli@latest guard sign\u{85}--files SOUL.md',
    ]);
  });

  test('a guard sign command is reported when --files and the next word are joined by whitespace the shell does not split on', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files\u{a0}SOUL.md',
      'npx --yes opena2a-cli@latest guard sign --files\u{200b}SOUL.md',
      'npx --yes opena2a-cli@latest guard sign --files\tSOUL.md',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:1: npx --yes opena2a-cli@latest guard sign --files\u{a0}SOUL.md',
      'a.md:2: npx --yes opena2a-cli@latest guard sign --files\u{200b}SOUL.md',
    ]);
  });

  test('checks each guard sign command on a line, after ; or |', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files a.md; npx --yes opena2a-cli@latest guard sign --files b.md',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md; npx --yes opena2a-cli@latest guard sign SOUL.md',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md | npx --yes opena2a-cli@latest guard\u{a0}sign --files SOUL.md',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:2: npx --yes opena2a-cli@latest guard sign --files SOUL.md; npx --yes opena2a-cli@latest guard sign SOUL.md',
      'a.md:3: npx --yes opena2a-cli@latest guard sign --files SOUL.md | npx --yes opena2a-cli@latest guard\u{a0}sign --files SOUL.md',
    ]);
  });

  test('--files is a word of its own before ;, |, (, ), = or a sentence period, or < or > not followed by (, and not before other characters', () => {
    const text = [
      'Use guard sign --files.',
      '(guard sign --files)',
      'guard sign --files; ls',
      'guard sign --files|cat',
      'npx --yes opena2a-cli@latest guard sign --files=SOUL.md',
      'guard sign --files.md',
      'guard sign --filesystem SOUL.md',
      'guard sign --files-from list.txt',
      'Sign them with guard sign --files, followed by their paths.',
      'guard sign --files<list.txt',
      'guard sign --files>sign.log',
      'guard sign --files(SOUL.md)',
      'Use guard sign --files. Then name the files.',
      'Use guard sign --files.\tThen name the files.',
      'Use guard sign --files...',
      'Use guard sign --files.\u{a0}Then name the files.',
      'guard sign --files#x',
      'guard sign --files #x',
      'guard sign --files<(cat list.txt)',
      'guard sign --files>(cat)',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:6: guard sign --files.md',
      'a.md:7: guard sign --filesystem SOUL.md',
      'a.md:8: guard sign --files-from list.txt',
      'a.md:9: Sign them with guard sign --files, followed by their paths.',
      'a.md:15: Use guard sign --files...',
      'a.md:16: Use guard sign --files.\u{a0}Then name the files.',
      'a.md:17: guard sign --files#x',
      'a.md:19: guard sign --files<(cat list.txt)',
      'a.md:20: guard sign --files>(cat)',
    ]);
  });

  test('a sentence period after --files may be followed by closing brackets, quotes or emphasis marks', () => {
    const text = [
      '(Sign them with guard sign --files.)',
      '[Sign them with guard sign --files.]',
      '"Sign them with guard sign --files."',
      "'Sign them with guard sign --files.'",
      '**Sign them with guard sign --files.**',
      '_Sign them with guard sign --files._',
      '*(Sign them with guard sign --files.)* Then name the files.',
      'Sign them with guard sign --files., then name the files.',
      '(Sign them with guard sign --files.)SOUL.md',
      'Sign them with `guard sign --files.`',
    ].join('\n');
    assert.deepEqual(unnamedGuardSigns('a.md', text), [
      'a.md:8: Sign them with guard sign --files., then name the files.',
      'a.md:9: (Sign them with guard sign --files.)SOUL.md',
      'a.md:10: Sign them with `guard sign --files.`',
    ]);
  });

  test('checks a long line of guard sign commands in linear time', () => {
    // Returns the time taken to check a line of the given number of `guard sign --files` commands. Reading
    // the rest of the line after each `sign` took time that grew with the square of the number of
    // commands: twice the commands, four times as long.
    const check = (commands) => {
      const line = 'guard sign --files '.repeat(commands);
      const start = performance.now();
      assert.deepEqual(unnamedGuardSigns('a.md', line), []);
      return performance.now() - start;
    };
    const elapsed = check(20_000);
    assert.ok(elapsed < 1000, `checked in ${Math.round(elapsed)} ms`);
    const fastest = (commands) => Math.min(...Array.from({ length: 10 }, () => check(commands)));
    const ratio = fastest(20_000) / fastest(5_000);
    assert.ok(ratio < 6, `four times the commands took ${ratio.toFixed(2)} times as long`);
  });

  test('a guard sign command at the end of a line is followed by --files when the line ends with CR LF', () => {
    const text = 'Then run npx --yes opena2a-cli@latest guard sign --files\r\nnpx --yes opena2a-cli@latest guard sign SOUL.md\r\n';
    assert.deepEqual(unnamedGuardSigns('a.md', text), ['a.md:2: npx --yes opena2a-cli@latest guard sign SOUL.md']);
    assert.deepEqual(guardCommands([['a.md', 'npx --yes opena2a-cli@latest guard verify\r\n']]), [['guard', 'verify']]);
  });

  test('reads --files and a file name joined by whitespace the shell does not split on as one word, as the shell does', () => {
    const text = 'npx --yes opena2a-cli@latest guard sign --files\u{a0}SOUL.md\nnpx --yes opena2a-cli@latest guard\tverify';
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files\u{a0}SOUL.md'],
      ['guard', 'verify'],
    ]);
  });

  test('reads a guard command whose words are separated by more than one space or a tab, on one line', () => {
    const text = [
      'npx  --yes opena2a-cli@latest  guard  sign  --files SOUL.md',
      'npx --yes\topena2a-cli@latest\tguard\tverify',
      'Install it with npx --yes opena2a-cli@latest',
      'guard sign is described below.',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', 'SOUL.md'],
      ['guard', 'verify'],
    ]);
  });

  test('reads each distinct guard command, ending it at a comment, && or a backtick', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md    # Integrity signing',
      'git checkout <hash> -- SOUL.md && npx --yes opena2a-cli@latest guard sign --files SOUL.md',
      '3. **Run integrity verification:** `npx --yes opena2a-cli@latest guard verify`',
      '  run: npx --yes opena2a-cli@latest guard verify',
      'npx --yes hackmyagent@latest secure .',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', 'SOUL.md'],
      ['guard', 'verify'],
    ]);
  });

  test('ends a guard command at a # that starts a word, and keeps a # inside a word', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files a.md #x',
      'npx --yes opena2a-cli@latest guard sign --files b.md\t#x',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md#x',
      'npx --yes opena2a-cli@latest guard sign --files#x c.md',
      'npx --yes opena2a-cli@latest guard verify#x',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', 'a.md'],
      ['guard', 'sign', '--files', 'b.md'],
      ['guard', 'sign', '--files', 'SOUL.md#x'],
      ['guard', 'sign', '--files#x', 'c.md'],
      ['guard', 'verify#x'],
    ]);
  });

  test('ends a guard command at a # that follows an operator that ends the command', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files a.md;#x',
      'npx --yes opena2a-cli@latest guard sign --files b.md|#x',
      '(npx --yes opena2a-cli@latest guard sign --files c.md)#x',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', 'a.md'],
      ['guard', 'sign', '--files', 'b.md'],
      ['guard', 'sign', '--files', 'c.md'],
    ]);
  });

  test('ends a guard command at ;, |, ( or )', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md; npx --yes opena2a-cli@latest guard verify',
      'npx --yes opena2a-cli@latest guard verify | tee verify.log',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md|cat',
      '(npx --yes opena2a-cli@latest guard sign --files SOUL.md)',
      '(cd agent && npx --yes opena2a-cli@latest guard verify)',
      'npx --yes opena2a-cli@latest guard verify (after each edit)',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', 'SOUL.md'],
      ['guard', 'verify'],
    ]);
  });

  test('ends a guard command at a sentence period at the end of a word, and keeps any other period', () => {
    const text = [
      'Run npx --yes opena2a-cli@latest guard verify.',
      '(Then run npx --yes opena2a-cli@latest guard sign --files SOUL.md.)',
      '**Run npx --yes opena2a-cli@latest guard sign --files a.md.**',
      'Run npx --yes opena2a-cli@latest guard sign --files b.md. Then commit it.',
      'Run npx --yes opena2a-cli@latest guard sign --files c.md.\tThen commit it.',
      'npx --yes opena2a-cli@latest guard sign --files d.md.bak',
      'npx --yes opena2a-cli@latest guard sign --files e.md...',
      'npx --yes opena2a-cli@latest guard sign --files f.md.\u{a0}g.md',
      'npx --yes opena2a-cli@latest guard sign --files h.md., i.md',
      'npx --yes opena2a-cli@latest guard sign --files .',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'verify'],
      ['guard', 'sign', '--files', 'SOUL.md'],
      ['guard', 'sign', '--files', 'a.md'],
      ['guard', 'sign', '--files', 'b.md'],
      ['guard', 'sign', '--files', 'c.md'],
      ['guard', 'sign', '--files', 'd.md.bak'],
      ['guard', 'sign', '--files', 'e.md...'],
      ['guard', 'sign', '--files', 'f.md.\u{a0}g.md'],
      ['guard', 'sign', '--files', 'h.md.,', 'i.md'],
      ['guard', 'sign', '--files', '.'],
    ]);
    // A period after a tab starts a word too. It is read on its own, as guardCommands keeps only one of the
    // commands it reads as the same words.
    assert.deepEqual(guardCommands([['a.md', 'npx --yes opena2a-cli@latest guard sign --files\t.']]), [
      ['guard', 'sign', '--files', '.'],
    ]);
  });

  test('ends a guard command at a redirection, and does not read the number of the file descriptor it opens as a word', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md > out',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md 2>&1',
      'npx --yes opena2a-cli@latest guard verify</dev/null',
      'npx --yes opena2a-cli@latest guard verify 2> verify.log',
      'npx --yes opena2a-cli@latest guard sign --files a.md 10>out',
      'npx --yes opena2a-cli@latest guard sign --files b.md 0</dev/null',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', 'SOUL.md'],
      ['guard', 'verify'],
      ['guard', 'sign', '--files', 'a.md'],
      ['guard', 'sign', '--files', 'b.md'],
    ]);
  });

  test('reads a number before a redirection as a word when a space or tab separates them, or other characters join it', () => {
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files 2 >out',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md2>out',
      'npx --yes opena2a-cli@latest guard sign --files\t3\t2>out',
      'npx --yes opena2a-cli@latest guard sign --files 4\t>out',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'sign', '--files', '2'],
      ['guard', 'sign', '--files', 'SOUL.md2'],
      ['guard', 'sign', '--files', '3'],
      ['guard', 'sign', '--files', '4'],
    ]);
  });

  test('reads a < or > followed by ( as part of a word, as bash and zsh join the path a process substitution opens to it', () => {
    // The shell runs `guard verify/dev/fd/63` for the first line, so the opt-in run must not run guard verify.
    const text = [
      'npx --yes opena2a-cli@latest guard verify<(cat x)',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md>(cat)',
      'npx --yes opena2a-cli@latest guard sign --files a.md 2<(cat x)',
      'npx --yes opena2a-cli@latest guard verify <(cat x)',
    ].join('\n');
    assert.deepEqual(guardCommands([['a.md', text]]), [
      ['guard', 'verify<'],
      ['guard', 'sign', '--files', 'SOUL.md>'],
      ['guard', 'sign', '--files', 'a.md', '2<'],
      ['guard', 'verify', '<'],
    ]);
  });

  test('never reads a < or > followed by ( as the redirection that ends a guard command', () => {
    // Every sequence of up to three of these after `guard verify`: 9,724 lines.
    const tokens = [' ', '\t', '<', '>', '(', ')', '#', ';', '|', '&', '`', '.', '2', 'a', '--files', '=', '\u{a0}', '"', '*', '_', ']'];
    let tails = [''];
    for (let length = 0; length <= 3; length += 1) {
      if (length > 0) tails = tails.flatMap((tail) => tokens.map((token) => tail + token));
      for (const tail of tails) {
        const line = `npx --yes opena2a-cli@latest guard verify${tail}`;
        for (const match of line.matchAll(GUARD_COMMAND)) {
          const next = line[match.index + match[0].length];
          assert.ok(match[2] === '' || next !== '(', `${JSON.stringify(line)} ends its command at ${match[2]}(`);
        }
      }
    }
  });

  test('every guard sign command is followed by --files, and one signs SOUL.md and one verifies it', () => {
    const texts = docTexts();
    assert.deepEqual(texts.flatMap(([file, text]) => unnamedGuardSigns(file, text)), []);
    const commands = guardCommands(texts);
    assert.deepEqual(
      commands.flatMap((words) => words.filter((word) => /["']/.test(word))),
      [],
      'a guard command in README.md, CONTRIBUTING.md or the guides quotes a word, and guardCommands does not read quotes',
    );
    assert.ok(
      commands.some((words) => words[1] === 'sign' && words.includes('SOUL.md')),
      'no npx opena2a-cli guard sign --files SOUL.md command found in README.md, CONTRIBUTING.md or the guides',
    );
    assert.ok(
      commands.some((words) => words[1] === 'verify'),
      'no npx opena2a-cli guard verify command found in README.md, CONTRIBUTING.md or the guides',
    );
  });

  // The check accepts a guard sign --files with no file after it, so README.md can describe the command in
  // prose. Only the opt-in OPENA2A_CLI run, which runs each npx guard sign command, would find one that signs
  // nothing.
  test('CONTRIBUTING.md says the default run checks guard sign for --files, not for the files after it', () => {
    assert.deepEqual(unnamedGuardSigns('a.md', 'Then run `npx --yes opena2a-cli@latest guard sign --files` to sign.'), []);
    const guide = readFileSync(join(repoRoot, 'CONTRIBUTING.md'), 'utf8');
    assert.match(guide, /It does not check that file names follow `--files`\./);
    assert.doesNotMatch(guide, /followed by the files it signs|names its files after/);
  });

  test('README.md, CONTRIBUTING.md and the guides name the directory guard sign writes to', () => {
    const texts = docTexts();
    const others = texts.flatMap(([file, text]) =>
      text.split(/\r?\n/).flatMap((line, index) => (/\.configguard\b/i.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : [])),
    );
    assert.deepEqual(others, []);
    assert.ok(
      texts.some(([, text]) => text.includes(GUARD_STORE)),
      `README.md, CONTRIBUTING.md and the guides do not name ${GUARD_STORE}`,
    );
    const hardening = readFileSync(join(repoRoot, 'guides', 'soul-hardening.md'), 'utf8');
    const signed = existsSync(join(repoRoot, GUARD_STORE));
    assert.equal(
      /not signed/.test(hardening),
      !signed,
      signed
        ? `the repository now has ${GUARD_STORE}: guides/soul-hardening.md must say how to verify its souls`
        : 'the repository has no signature store: guides/soul-hardening.md must say its souls are not signed',
    );
  });

  // guard sign writes each file's SHA-256 hash to GUARD_STORE, with no key and no signature value, so anyone
  // who can edit a soul can also sign it again. The documents call the record a hash and say so where they
  // tell a reader to sign, rather than call it a cryptographic signature.
  test('README.md, CONTRIBUTING.md and the guides call what guard sign records a hash, not a cryptographic signature', () => {
    const texts = docTexts();
    const claims = texts.flatMap(([file, text]) =>
      text.split(/\r?\n/).flatMap((line, index) => (/cryptograph/i.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : [])),
    );
    assert.deepEqual(claims, []);
    for (const file of ['README.md', 'guides/soul-hardening.md']) {
      assert.match(texts.find(([name]) => name === file)[1], /The record is a hash, not a keyed signature/, file);
    }
  });

  test(
    'the guard sign and guard verify commands sign SOUL.md and detect a change to it',
    { skip: OPENA2A_CLI ? false : "set OPENA2A_CLI='npx --yes opena2a-cli@latest' to run it" },
    () => {
      const soul = readFileSync(join(repoRoot, 'templates', 'basic.md'), 'utf8');
      assert.deepEqual(guardProblems(OPENA2A_CLI, guardCommands(docTexts()), soul), []);
    },
  );
});

// OpenClaw reads an agent's SOUL.md from the agent's workspace, which docs.openclaw.ai places at
// ~/.openclaw/workspace for the default agent and at ~/.openclaw/workspace-<name> for an agent added by
// name. A path ends at a space, a quote, a backtick, a parenthesis or |, and a period, comma, colon or
// semicolon at its end belongs to the sentence. Returns `<file>:<line>: <path>` for each path under
// ~/.openclaw whose first directory starts with `workspace` and is neither of those, such as
// ~/.openclaw/workspaces/default, which OpenClaw does not read. A line ends at LF or CR LF.
function openclawWorkspaceProblems(file, text) {
  return text.split(/\r?\n/).flatMap((line, index) =>
    [...line.matchAll(/~\/\.openclaw\/[^\s`'"()|]*/g)]
      .map(([path]) => path.replace(/[.,:;]+$/, ''))
      .filter((path) => /^~\/\.openclaw\/workspace/.test(path))
      .filter((path) => !/^~\/\.openclaw\/workspace(?:-[^/]+)?(?:\/|$)/.test(path))
      .map((path) => `${file}:${index + 1}: ${path}`),
  );
}

describe('OpenClaw workspace paths in README.md, CONTRIBUTING.md and the guides', () => {
  test('a path names the default workspace or a workspace-<name> directory', () => {
    const text = [
      'Natively reads `~/.openclaw/workspace/SOUL.md` or `~/.openclaw/workspace-<name>/SOUL.md`.',
      'cp souls/a.md ~/.openclaw/workspace/SOUL.md',
      'cp souls/a.md ~/.openclaw/workspace-support-bot/SOUL.md',
      'Settings live in `~/.openclaw/openclaw.json`.',
      'The default workspace is ~/.openclaw/workspace.',
      'cp souls/a.md ~/.openclaw/workspaces/default/SOUL.md',
      'Reads `~/.openclaw/workspaces/<name>/SOUL.md` (copy directly)',
      'cp souls/a.md ~/.openclaw/workspace-/SOUL.md\r',
      'cp souls/a.md "~/.openclaw/workspace_main/SOUL.md"',
    ].join('\n');
    assert.deepEqual(openclawWorkspaceProblems('a.md', text), [
      'a.md:6: ~/.openclaw/workspaces/default/SOUL.md',
      'a.md:7: ~/.openclaw/workspaces/<name>/SOUL.md',
      'a.md:8: ~/.openclaw/workspace-/SOUL.md',
      'a.md:9: ~/.openclaw/workspace_main/SOUL.md',
    ]);
  });

  test('every OpenClaw workspace path is one OpenClaw reads', () => {
    const texts = docTexts();
    assert.deepEqual(texts.flatMap(([file, text]) => openclawWorkspaceProblems(file, text)), []);
    assert.ok(
      texts.some(([, text]) => text.includes('~/.openclaw/workspace/SOUL.md')),
      'no file names the default OpenClaw workspace',
    );
  });
});

describe('guardProblems', () => {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'check-souls-guard-stub-'));
  });
  after(() => rmSync(dir, { recursive: true, force: true }));
  const soul = '## Identity\n\nA soul to sign.\n';
  const sign = ['guard', 'sign', '--files', 'SOUL.md'];
  const verify = ['guard', 'verify'];

  // Signs the files named after --files and nothing else, like opena2a-cli. verify exits 1 when nothing
  // is signed or a signed file has changed, unless verifyPasses is set. With needsTelemetryOff set, every
  // command exits 1 and does nothing unless OPENA2A_TELEMETRY is off.
  function guardStub(name, { verifyPasses = false, needsTelemetryOff = false } = {}) {
    const path = join(dir, `${name}.mjs`);
    const source = [
      "import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';",
      `const verifyPasses = ${verifyPasses};`,
      `const needsTelemetryOff = ${needsTelemetryOff};`,
      "if (needsTelemetryOff && process.env.OPENA2A_TELEMETRY !== 'off') process.exit(1);",
      'const [verb, ...args] = process.argv.slice(3);',
      `const store = ${JSON.stringify(GUARD_STORE)};`,
      "if (verb === 'sign' && args[0] === '--files') {",
      `  mkdirSync(${JSON.stringify(GUARD_DIR)}, { recursive: true });`,
      "  writeFileSync(store, JSON.stringify(args.slice(1).map((file) => [file, readFileSync(file, 'utf8')])));",
      "} else if (verb === 'verify' && !verifyPasses) {",
      "  const signed = existsSync(store) ? JSON.parse(readFileSync(store, 'utf8')) : [];",
      "  const changed = signed.some(([file, text]) => readFileSync(file, 'utf8') !== text);",
      '  process.exitCode = signed.length === 0 || changed ? 1 : 0;',
      '}',
    ];
    writeFileSync(path, `${source.join('\n')}\n`);
    return [process.execPath, path];
  }

  test('accepts a sign command that writes the store and a verify command that detects a change', () => {
    assert.deepEqual(guardProblems(guardStub('honest'), [sign, verify], soul), []);
  });

  test('reports a sign command that names SOUL.md without --files', () => {
    const cli = guardStub('without-files');
    assert.deepEqual(guardProblems(cli, [['guard', 'sign', 'SOUL.md'], verify], soul), [
      `${cli.join(' ')} guard sign SOUL.md did not write ${GUARD_STORE}`,
      `${cli.join(' ')} guard verify exited 1 after guard sign SOUL.md`,
    ]);
  });

  test('reports a verify command that passes after SOUL.md changed', () => {
    const cli = guardStub('verify-passes', { verifyPasses: true });
    assert.deepEqual(guardProblems(cli, [sign, verify], soul), [`${cli.join(' ')} guard verify exited 0 after SOUL.md changed`]);
  });

  test('runs each command with opena2a-cli usage telemetry off', () => {
    const cli = guardStub('telemetry', { needsTelemetryOff: true });
    // Turned on here, so opena2a-cli sees off only because runGuard sets it, not because the shell
    // running the tests exported OPENA2A_TELEMETRY=off.
    const previous = process.env.OPENA2A_TELEMETRY;
    process.env.OPENA2A_TELEMETRY = 'on';
    try {
      assert.deepEqual(guardProblems(cli, [sign, verify], soul), []);
    } finally {
      if (previous === undefined) delete process.env.OPENA2A_TELEMETRY;
      else process.env.OPENA2A_TELEMETRY = previous;
    }
  });

  test('stops a command that does not finish in time and runs no later command', () => {
    const path = join(dir, 'hang.mjs');
    writeFileSync(path, 'setTimeout(() => {}, 10_000);\n');
    const cli = [process.execPath, path];
    assert.deepEqual(guardProblems(cli, [sign, verify], soul, { timeout: 500 }), [
      `${cli.join(' ')} guard sign --files SOUL.md did not finish within 0.5 seconds; stopped at this command`,
    ]);
  });

  test('passes on a word that ends in < or > before ( and does not run a subcommand that does', () => {
    const path = join(dir, 'log-words.mjs');
    const log = join(dir, 'words.log');
    writeFileSync(
      path,
      `import { appendFileSync } from 'node:fs';\nappendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(' ') + '\\n');\n`,
    );
    const cli = [process.execPath, path];
    const text = [
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md>(cat)',
      'npx --yes opena2a-cli@latest guard sign --files SOUL.md<(cat x)',
      'npx --yes opena2a-cli@latest guard sign<(cat x)',
      'npx --yes opena2a-cli@latest guard verify<(cat x)',
    ].join('\n');
    assert.deepEqual(guardProblems(cli, guardCommands([['a.md', text]]), soul), [
      `${cli.join(' ')} guard sign --files SOUL.md> did not write ${GUARD_STORE}`,
      `${cli.join(' ')} guard sign --files SOUL.md< did not write ${GUARD_STORE}`,
    ]);
    assert.equal(readFileSync(log, 'utf8'), 'guard sign --files SOUL.md>\nguard sign --files SOUL.md<\n');
  });
});

describe('this test file', () => {
  test('a run filtered by test name leaves no temporary directory behind', () => {
    const temp = mkdtempSync(join(tmpdir(), 'check-souls-filtered-'));
    try {
      // NODE_TEST_CONTEXT marks a process the test runner started; the run below is a separate run.
      const { NODE_TEST_CONTEXT, ...env } = process.env;
      const { status, stdout } = spawnSync(
        process.execPath,
        [
          '--test',
          '--test-reporter=tap',
          '--test-name-pattern=reports a guide without the requirements table',
          fileURLToPath(import.meta.url),
        ],
        { encoding: 'utf8', env: { ...env, TMPDIR: temp, TEMP: temp, TMP: temp } },
      );
      assert.equal(status, 0, stdout);
      // A pattern that selects no test also passes, as `# pass 1` for the file, so the selected test's
      // own line is checked too.
      assert.match(stdout, /^\s*ok \d+ - reports a guide without the requirements table$/m);
      assert.match(stdout, /^# pass 1$/m);
      assert.deepEqual(readdirSync(temp), []);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });

  test(
    'the notAGitClone tests pass when the environment names another repository, as it does in a git hook',
    { skip: !GIT_RUNS && 'git did not run' },
    () => {
      const other = mkdtempSync(join(tmpdir(), 'check-souls-hook-'));
      try {
        assert.equal(spawnSync('git', ['init', '--quiet'], { cwd: other }).status, 0);
        const gitDir = join(other, '.git');
        const { NODE_TEST_CONTEXT, ...env } = process.env;
        const { status, stdout } = spawnSync(
          process.execPath,
          ['--test', '--test-reporter=tap', '--test-name-pattern=^notAGitClone ', fileURLToPath(import.meta.url)],
          {
            encoding: 'utf8',
            env: { ...env, GIT_DIR: gitDir, GIT_WORK_TREE: other, GIT_INDEX_FILE: join(gitDir, 'index') },
          },
        );
        assert.equal(status, 0, stdout);
        assert.match(stdout, /^ok \d+ - notAGitClone$/m);
        assert.match(stdout, /^# pass [1-9]/m);
      } finally {
        rmSync(other, { recursive: true, force: true });
      }
    },
  );

  // Returns one line for each line of a comment in `lines` that ends inside a sentence and is less than half
  // as wide as the widest line of its comment. A comment is a run of // lines with the same indentation. A
  // line ends inside a sentence when the next line of its comment starts with a lowercase letter, or when the
  // line does not end with a period, colon, question mark or exclamation mark, which closing brackets, quotes
  // or a backtick may follow, as a line that ends before a name such as GUARD_SIGN_FILES does. A line left
  // short there, as an edit that adds words to a paragraph can leave one, is reported so that the paragraph
  // is wrapped again.
  function shortCommentLines(lines) {
    const comments = [];
    let previous;
    lines.forEach((line, index) => {
      const indent = /^([ \t]*)\/\/ /.exec(line)?.[1];
      if (indent !== undefined && indent === previous) comments.at(-1).push(index);
      else if (indent !== undefined) comments.push([index]);
      previous = indent;
    });
    const insideSentence = (index) =>
      /^[ \t]*\/\/ [a-z]/.test(lines[index + 1]) || !/[.:?!][)\]"'`]*$/.test(lines[index]);
    return comments.flatMap((comment) => {
      const widest = Math.max(...comment.map((index) => lines[index].length));
      return comment
        .slice(0, -1)
        .filter((index) => insideSentence(index) && lines[index].length * 2 < widest)
        .map((index) => `line ${index + 1} is ${lines[index].length} columns wide; its comment's widest is ${widest}`);
    });
  }

  test('reports a short comment line that ends inside a sentence, whatever the next line starts with', () => {
    const lines = [
      `// ${'a'.repeat(97)}`,
      '// as in `--files .`',
      '// as NPX_PINNED and',
      '// GUARD_SIGN_FILES read',
      '// it. A sentence.',
      '// Then a colon:',
      '// `guard verify`.',
      '// (A sentence.)',
      '// [A sentence.]',
      '// Then "a quote."',
      "// Then 'a quote.'",
      '// The last line',
    ];
    assert.deepEqual(shortCommentLines(lines), [
      "line 2 is 20 columns wide; its comment's widest is 100",
      "line 3 is 20 columns wide; its comment's widest is 100",
      "line 4 is 24 columns wide; its comment's widest is 100",
    ]);
  });

  test('a comment line that ends inside a sentence is at least half as wide as the widest line of its comment', () => {
    assert.deepEqual(shortCommentLines(readFileSync(fileURLToPath(import.meta.url), 'utf8').split(/\r?\n/)), []);
  });
});
