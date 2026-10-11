// Run with: node --test scripts/check-docs-prose.test.mjs
// The tests that check tracked files run git in a temporary repository.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkRepository, findProseProblems, isChecked, main } from './check-docs-prose.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const EM_DASH = '—';
const EN_DASH = '–';
const HYPHENS = 'double hyphen used as a dash';

// The problems of a text, each written as `line:column problem`.
function problems(text) {
  return findProseProblems(text).map(({ line, column, problem }) => `${line}:${column} ${problem}`);
}

describe('findProseProblems', () => {
  test('reports a double hyphen, an em dash and an en dash used as a dash, with line and column', () => {
    const text = `One -- two.\n\nThree ${EM_DASH} four, five${EM_DASH}six.\nSeven ${EN_DASH} eight.\n`;
    assert.deepEqual(problems(text), [
      `1:5 ${HYPHENS}`,
      '3:7 em dash',
      '3:19 em dash',
      '4:7 en dash used as a dash',
    ]);
  });

  test('reports the problems of a line in the order they appear', () => {
    assert.deepEqual(problems(`a ${EM_DASH} b -- c ${EN_DASH} d -- e`), [
      '1:3 em dash',
      `1:7 ${HYPHENS}`,
      '1:12 en dash used as a dash',
      `1:16 ${HYPHENS}`,
    ]);
  });

  test('reports a double hyphen at the end or the start of a line', () => {
    assert.deepEqual(problems('word --\n-- word\n'), [`1:6 ${HYPHENS}`, `2:1 ${HYPHENS}`]);
  });

  test('does not report hyphens that are not a dash', () => {
    const text = [
      'An end-to-end test, run with npm test --watch.',
      `Pages 10${EN_DASH}20 and a non-breaking hyphen.`,
      '<!-- a comment -->',
      '---',
      '- - -',
      '  --  ',
      '| a | b |',
      '| -- | :-: |',
      '| x | y |',
    ].join('\n');
    assert.deepEqual(problems(text), []);
  });

  test('does not report a dash inside a fenced code block', () => {
    const text = [
      '```bash',
      'git checkout abc -- SOUL.md',
      '```',
      '~~~',
      `a ${EM_DASH} b`,
      '~~~',
      'after -- text',
    ].join('\n');
    assert.deepEqual(problems(text), [`7:7 ${HYPHENS}`]);
  });

  test('ends a code block at a fence of the same character, at least as long, with no text after it', () => {
    const text = [
      '````markdown',
      '```',
      'a -- b',
      '```',
      '~~~~',
      '```` not the end',
      'c -- d',
      '`````',
      'e -- f',
    ].join('\n');
    assert.deepEqual(problems(text), [`9:3 ${HYPHENS}`]);
  });

  test('reads a fence inside a list item or a block quote', () => {
    const text = ['1. Step', '', '   ```bash', '   run -- it', '   ```', '> ```', '> a -- b', '> ```', '> c -- d'].join('\n');
    assert.deepEqual(problems(text), [`9:5 ${HYPHENS}`]);
  });

  test('reads a line that starts with an inline code span of three backticks as prose', () => {
    assert.deepEqual(problems('```npm test``` runs the tests -- all of them\nnext -- line'), [
      `1:31 ${HYPHENS}`,
      `2:6 ${HYPHENS}`,
    ]);
  });

  test('does not report a dash inside an inline code span', () => {
    const text = [
      'Restore it with `git checkout <hash> -- SOUL.md`.',
      'A heading such as ``## Boundaries -- `Never` ``.',
      `Status \`disk 45% ${EM_DASH} all nominal\` and \`ok\` -- done`,
    ].join('\n');
    assert.deepEqual(problems(text), [`3:42 ${HYPHENS}`]);
  });

  test('reads a backtick with no later run of the same length on the line as text', () => {
    assert.deepEqual(problems('A ` and a dash -- here\n`` a -- b `\n'), [`1:16 ${HYPHENS}`, `2:6 ${HYPHENS}`]);
  });

  test('reads a line of many inline code spans', () => {
    const spans = '`x` '.repeat(100_000);
    assert.deepEqual(problems(`${spans}-- end`), [`1:${spans.length + 1} ${HYPHENS}`]);
    assert.deepEqual(problems(`\`\` ${spans}\`a -- b`), [`1:${spans.length + 7} ${HYPHENS}`]);
  });

  test('reports every dash on a line of many dashes', () => {
    const found = findProseProblems(EM_DASH.repeat(130_000));
    assert.equal(found.length, 130_000);
    assert.deepEqual(found.at(-1), { line: 1, column: 130_000, problem: 'em dash' });
  });

  test('reports a heading named Why this exists or Why this matters, at any level and in any case', () => {
    const text = [
      '## Why this exists',
      '### why this matters',
      '# **Why This Matters** to a reader',
      'Why this exists is explained below.',
      '## Why this existed',
      '## Why',
      '```',
      '## Why this exists',
      '```',
    ].join('\n');
    assert.deepEqual(problems(text), [
      '1:1 heading named "Why this exists"',
      '2:1 heading named "why this matters"',
      '3:1 heading named "Why This Matters"',
    ]);
  });

  test('reads a text whose lines end with CR LF', () => {
    assert.deepEqual(problems('a -- b\r\n```\r\nc -- d\r\n```\r\ne\r\n'), [`1:3 ${HYPHENS}`]);
  });
});

describe('isChecked', () => {
  test('checks prose files, including a starter example and a file named like a skipped directory', () => {
    for (const path of [
      'README.md',
      'guides/soul-hardening.md',
      'souls/examples/website-project.md',
      'docs/changelog-format.md',
      'docs/build.md',
      'site/pages/index.mdx',
    ]) {
      assert.equal(isChecked(path), true, path);
    }
  });

  test('skips changelogs, licenses, installed and generated files, and test data', () => {
    for (const path of [
      'CHANGELOG.md',
      'packages/cli/changelog.md',
      'changelog.d/123.fixed.md',
      'LICENSE.md',
      'LICENSE-THIRD-PARTY.md',
      'node_modules/package/README.md',
      'vendor/library/README.md',
      'dist/README.md',
      'packages/cli/build/notes.md',
      'test/fixtures/SOUL.md',
      'src/__tests__/case.md',
      'corpus/malicious/SOUL.md',
      'golden/report.md',
      'src/__snapshots__/report.md',
    ]) {
      assert.equal(isChecked(path), false, path);
    }
  });
});

// A symbolic link cannot be created on Windows without a privilege, so there the fixture has none.
const HAS_LINK = process.platform !== 'win32';

describe('checkRepository and main', () => {
  let root;
  let outside;
  before(() => {
    root = mkdtempSync(join(tmpdir(), 'check-docs-prose-'));
    const tracked = {
      'README.md': 'Title\n\nA line -- with a dash.\n',
      'guides/a.md': `## Why this exists\n\nBody ${EM_DASH} text.\n`,
      'clean.mdx': 'No dash here.\n',
      'CHANGELOG.md': 'Fixed -- a thing.\n',
      'test/fixtures/SOUL.md': 'Data -- here.\n',
      'deleted.md': 'Gone -- later.\n',
      'script.js': '// a -- b\n',
    };
    const untracked = { 'notes.md': 'Not added -- to git.\n' };
    for (const [path, content] of Object.entries({ ...tracked, ...untracked })) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    const names = Object.keys(tracked);
    if (HAS_LINK) {
      symlinkSync('README.md', join(root, 'link.md'));
      names.push('link.md');
    }
    for (const args of [['init', '--quiet'], ['add', '--', ...names]]) {
      const { status, stderr } = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
      assert.equal(status, 0, `git ${args[0]} failed: ${stderr}`);
    }
    rmSync(join(root, 'deleted.md'));

    // A .git file that names a missing directory, so git finds no repository here or above.
    outside = mkdtempSync(join(tmpdir(), 'check-docs-prose-outside-'));
    writeFileSync(join(outside, '.git'), 'gitdir: ./missing\n');
    writeFileSync(join(outside, 'README.md'), 'A line -- with a dash.\n');
  });
  after(() => {
    for (const dir of [root, outside]) rmSync(dir, { recursive: true, force: true });
  });

  const EXPECTED = [
    `README.md:3:8: ${HYPHENS}`,
    'guides/a.md:1:1: heading named "Why this exists"',
    'guides/a.md:3:6: em dash',
  ];

  test('checks the tracked .md and .mdx files that exist, are not links and are not skipped', () => {
    assert.deepEqual(checkRepository(root), { problems: EXPECTED, fileCount: 3 });
  });

  test('reports a directory that is not a git repository with the reason git gives', () => {
    const { problems, fileCount } = checkRepository(outside);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^cannot list the tracked files: \S/);
    assert.equal(fileCount, 0);
  });

  test('main returns 1 for a directory that is not a git repository', (t) => {
    const log = t.mock.method(console, 'log', () => {});
    assert.equal(main([], outside), 1);
    assert.match(log.mock.calls[0].arguments[0], /^cannot list the tracked files: \S/);
    assert.equal(log.mock.calls[1].arguments[0], 'Checked 0 files: 1 problem.');
  });

  test('main prints each problem, the totals and how to fix them, and returns 1', (t) => {
    const log = t.mock.method(console, 'log', () => {});
    assert.equal(main([], root), 1);
    const lines = log.mock.calls.map((call) => call.arguments[0]);
    assert.deepEqual(lines.slice(0, -1), [...EXPECTED, 'Checked 3 files: 3 problems.']);
    assert.match(lines.at(-1), /^Write each sentence with a period, a comma, a colon or parentheses/);
  });

  test('main prints only the totals and returns 0 when there is no problem', (t) => {
    const log = t.mock.method(console, 'log', () => {});
    writeFileSync(join(root, 'README.md'), 'Title\n\nA line: with a colon.\n');
    writeFileSync(join(root, 'guides/a.md'), '## Background\n\nBody text.\n');
    assert.equal(main([], root), 0);
    assert.deepEqual(log.mock.calls.map((call) => call.arguments[0]), ['Checked 3 files: 0 problems.']);
  });

  test('main writes a control character in a file name as an escape', { skip: !HAS_LINK && 'file names differ on Windows' }, (t) => {
    const log = t.mock.method(console, 'log', () => {});
    const name = 'a\u001b[2Jb.md';
    writeFileSync(join(root, name), 'One -- two.\n');
    assert.equal(spawnSync('git', ['add', '--', name], { cwd: root }).status, 0);
    assert.equal(main([], root), 1);
    const lines = log.mock.calls.map((call) => call.arguments[0]);
    assert.ok(lines.includes(`a\\u{1b}[2Jb.md:1:5: ${HYPHENS}`), lines.join('\n'));
    assert.ok(lines.every((line) => !line.includes('\u001b')), 'a line holds the control character');
  });
});

describe('command line', () => {
  const script = join(repoRoot, 'scripts', 'check-docs-prose.mjs');

  function run(args) {
    return spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: 'utf8' });
  }

  for (const flag of ['--help', '-h']) {
    test(`${flag} prints usage and exits 0`, () => {
      const { status, stdout, stderr } = run([flag]);
      assert.equal(status, 0);
      assert.match(stdout, /^Usage: node scripts\/check-docs-prose\.mjs\n/);
      assert.equal(stderr, '');
    });
  }

  test('an argument it does not know prints usage to stderr and exits 2', () => {
    const { status, stdout, stderr } = run(['README.md']);
    assert.equal(status, 2);
    assert.equal(stdout, '');
    assert.equal(stderr, 'Unknown argument: README.md\nUsage: node scripts/check-docs-prose.mjs\n');
  });
});
