// Run with: node --test scripts/check-souls.test.mjs

import assert from 'node:assert/strict';
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
      'README.md': '[helper](souls/by-use-case/helper.md)\n[crew](souls/by-fleet/crew/)\n',
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
