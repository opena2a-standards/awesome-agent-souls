// Run with: node --test scripts/check-souls.test.mjs

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { checkRepository, readRules, readSections } from './check-souls.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('this repository', () => {
  test('every soul and template meets the CONTRIBUTING.md requirements table', () => {
    const { problems, fileCount, ruleCount } = checkRepository(repoRoot);
    assert.deepEqual(problems, []);
    assert.ok(fileCount > 0, 'no soul files were checked');
    assert.ok(ruleCount > 0, 'no rules were read from CONTRIBUTING.md');
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
});

const GUIDE = `# Guide

| Dimension | Location | Required frontmatter | Required sections |
|-----------|----------|----------------------|-------------------|
| By Use Case | \`souls/by-use-case/<name>.md\` | \`name\`, \`category: use-case\` | \`Identity\`, \`Harm Avoidance\` |
| By Fleet, member | \`souls/by-fleet/<fleet>/<name>-agent.md\` | \`name\`, \`fleet: <fleet>\` | \`Identity\`, \`Boundaries\` or \`Constraints\` |
`;

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

describe('checkRepository', () => {
  const roots = [];
  after(() => {
    for (const root of roots) rmSync(root, { recursive: true, force: true });
  });

  function fixture(files) {
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
    return checkRepository(root).problems;
  }

  test('accepts files that meet the table', () => {
    assert.deepEqual(fixture({}), []);
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

  test('reads level-2 headings only', () => {
    assert.deepEqual(readSections(['# Title', '## Boundaries -- Things You Must Never Do', '### Detail']), [
      'Boundaries -- Things You Must Never Do',
    ]);
  });
});

describe('command line', () => {
  const script = join(repoRoot, 'scripts', 'check-souls.mjs');
  const elsewhere = mkdtempSync(join(tmpdir(), 'check-souls-cwd-'));
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

  test('an unknown argument prints usage to stderr and exits 2', () => {
    const { status, stderr } = run(['--bogus']);
    assert.equal(status, 2);
    assert.match(stderr, /^Unknown argument: --bogus\nUsage: /);
  });

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
    const { status, stdout } = run(['--root', elsewhere]);
    assert.equal(status, 1);
    assert.ok(stdout.startsWith('CONTRIBUTING.md: file not found\n'), stdout);
    assert.match(stdout, /: 1 problem\.\n$/);
  });

  test('names the root relative to the working directory when it is inside it', () => {
    assert.match(run([]).stdout, / files in \. against /);
  });

  test('names the root by its absolute path when run from outside it', () => {
    const { stdout } = run(['--root', repoRoot], elsewhere);
    assert.ok(stdout.includes(` files in ${repoRoot} against `), stdout);
    assert.ok(!stdout.includes(' files in ..'), stdout);
  });
});
