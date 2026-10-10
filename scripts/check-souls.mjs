#!/usr/bin/env node
// Checks every soul file against the requirements table in CONTRIBUTING.md.
//
// Usage: node scripts/check-souls.mjs [--root <repository directory>] [--help]
//
// The table in CONTRIBUTING.md is the single source of the rules: where each
// kind of file lives, which frontmatter fields it carries and which `##`
// sections it contains. Changing the rules means editing that table.
//
// It also checks README.md: every soul is linked, and every template has a
// table row whose last cell lists the template's `##` sections in file order.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const GUIDE = 'CONTRIBUTING.md';
const README = 'README.md';
const SCANNED_DIRS = ['souls', 'templates'];
const LINKED_DIR = 'souls';
const TEMPLATE_DIR = 'templates';
const HEADER = ['Dimension', 'Location', 'Required frontmatter', 'Required sections'];

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function backticked(text) {
  return [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

function patternToMatcher(pattern) {
  const placeholders = [];
  const source = pattern
    .split(/(<[^>]+>)/)
    .map((part) => {
      const placeholder = part.match(/^<([^>]+)>$/);
      if (placeholder) {
        placeholders.push(placeholder[1]);
        return '([^/]+)';
      }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  const regex = new RegExp(`^${source}$`);
  return (path) => {
    const match = path.match(regex);
    if (!match) return null;
    return Object.fromEntries(placeholders.map((name, index) => [name, match[index + 1]]));
  };
}

function parseField(text) {
  const separator = text.indexOf(':');
  if (separator === -1) return { key: text.trim() };
  return { key: text.slice(0, separator).trim(), value: text.slice(separator + 1).trim() };
}

export function readRules(guideText) {
  const lines = guideText.split(/\r?\n/);
  const start = lines.findIndex(
    (line) => line.trim().startsWith('|') && splitRow(line).join('|') === HEADER.join('|'),
  );
  if (start === -1) return null;
  const rules = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.trim().startsWith('|')) break;
    const [dimension = '', location = '', fields = '', sections = ''] = splitRow(line);
    const [pattern] = backticked(location);
    rules.push({
      dimension,
      pattern,
      match: pattern ? patternToMatcher(pattern) : () => null,
      fields: backticked(fields).map(parseField),
      sections: sections
        .split(',')
        .map((part) => backticked(part))
        .filter((alternatives) => alternatives.length > 0),
    });
  }
  return rules;
}

export function readFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fields = new Map();
  for (let i = 1; i < end; i++) {
    const field = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!field) continue;
    let value = field[2].trim().replace(/^(["'])(.*)\1$/, '$2');
    if (value === '' && i + 1 < end && /^\s+\S/.test(lines[i + 1])) value = lines[i + 1].trim();
    fields.set(field[1], value);
  }
  return { fields, body: lines.slice(end + 1) };
}

export function readSections(bodyLines) {
  const headings = [];
  let fence = null;
  for (const line of bodyLines) {
    const marker = line.match(/^\s*(```|~~~)/);
    if (marker) {
      if (fence === null) fence = marker[1];
      else if (fence === marker[1]) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = line.match(/^## (.+?)\s*$/);
    if (heading) headings.push(heading[1]);
  }
  return headings;
}

function hasSection(headings, name) {
  return headings.some((heading) => heading === name || heading.startsWith(`${name} `));
}

const REASONS = {
  EACCES: 'permission denied',
  EPERM: 'operation not permitted',
  EISDIR: 'is a directory',
  ENOTDIR: 'not a directory',
  ELOOP: 'too many levels of symbolic links',
  ENAMETOOLONG: 'name too long',
};

// Turns a file system error into a problem line that names the path `name`. An error without an
// operating-system error number, such as an argument of the wrong type, is thrown again.
function cannotRead(name, error) {
  if (typeof error?.errno !== 'number') throw error;
  const reason = REASONS[error.code];
  return `${name}: cannot read${reason ? `: ${reason}` : ''} (${error.code})`;
}

// Whether a file at `pattern` could be inside the directory `dir`.
function couldContain(dir, pattern) {
  const dirParts = dir.split('/');
  const patternParts = pattern.split('/');
  return (
    dirParts.length < patternParts.length &&
    dirParts.every((part, index) => patternToMatcher(patternParts[index])(part) !== null)
  );
}

// Lists the .md files under `dir`. A directory that cannot be read adds a problem and is added to
// `unreadable`.
function listMarkdownFiles(root, dir, problems, unreadable) {
  let entries;
  try {
    entries = readdirSync(join(root, dir), { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    problems.push(cannotRead(dir, error));
    unreadable.push(dir);
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...listMarkdownFiles(root, path, problems, unreadable));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files.sort();
}

// `name` is how a problem with the root itself names it, for example as the summary line names it.
export function checkRepository(root, name = root) {
  const problems = [];
  let stats;
  try {
    stats = statSync(root, { throwIfNoEntry: false });
  } catch (error) {
    return { problems: [cannotRead(name, error)], fileCount: 0, ruleCount: 0 };
  }
  if (!stats?.isDirectory()) {
    const problem = stats ? 'not a directory' : 'directory not found';
    return { problems: [`${name}: ${problem}`], fileCount: 0, ruleCount: 0 };
  }
  let guide;
  try {
    guide = readFileSync(join(root, GUIDE), 'utf8');
  } catch (error) {
    const problem = error.code === 'ENOENT' ? `${GUIDE}: file not found` : cannotRead(GUIDE, error);
    return { problems: [problem], fileCount: 0, ruleCount: 0 };
  }
  const rules = readRules(guide);
  if (!rules || rules.length === 0) {
    return {
      problems: [`${GUIDE}: requirements table not found (header: | ${HEADER.join(' | ')} |)`],
      fileCount: 0,
      ruleCount: 0,
    };
  }
  rules.forEach((rule, index) => {
    if (!rule.pattern) problems.push(`${GUIDE}: table row ${index + 1} (${rule.dimension}) has no location`);
  });

  // A README.md that cannot be read is reported once, and its links and rows are not checked.
  let readme = '';
  try {
    readme = readFileSync(join(root, README), 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      problems.push(cannotRead(README, error));
      readme = null;
    }
  }
  const unreadable = [];
  const files = SCANNED_DIRS.flatMap((dir) => listMarkdownFiles(root, dir, problems, unreadable));
  const matchedRules = new Set();

  for (const file of files) {
    let rule = null;
    let placeholders = null;
    for (const candidate of rules) {
      placeholders = candidate.match(file);
      if (placeholders) {
        rule = candidate;
        break;
      }
    }
    if (!rule) {
      problems.push(`${file}: not at any location listed in ${GUIDE}`);
      continue;
    }
    matchedRules.add(rule);

    let text;
    try {
      text = readFileSync(join(root, file), 'utf8');
    } catch (error) {
      problems.push(cannotRead(file, error));
      continue;
    }
    const frontmatter = readFrontmatter(text);
    if (!frontmatter) {
      problems.push(`${file}: missing YAML frontmatter between two --- lines at the top of the file`);
      continue;
    }
    for (const { key, value } of rule.fields) {
      const actual = frontmatter.fields.get(key);
      if (actual === undefined || actual === '') {
        problems.push(`${file}: missing frontmatter field \`${key}\``);
        continue;
      }
      if (value === undefined) continue;
      const expected = value.replace(/<([^>]+)>/g, (whole, name) => placeholders[name] ?? whole);
      if (actual !== expected) {
        problems.push(`${file}: frontmatter field \`${key}\` is "${actual}", expected "${expected}"`);
      }
    }

    const headings = readSections(frontmatter.body);
    for (const alternatives of rule.sections) {
      if (!alternatives.some((name) => hasSection(headings, name))) {
        const wanted = alternatives.map((name) => `## ${name}`).join(' or ');
        problems.push(`${file}: missing section ${wanted}`);
      }
    }

    if (readme === null) continue;

    if (file.startsWith(`${LINKED_DIR}/`)) {
      const directory = `${file.slice(0, file.lastIndexOf('/'))}/`;
      if (!readme.includes(`](${file})`) && !readme.includes(`](${directory})`)) {
        problems.push(`${file}: not linked from ${README} (link the file, or its fleet directory)`);
      }
    }

    if (file.startsWith(`${TEMPLATE_DIR}/`)) {
      const rows = readme
        .split(/\r?\n/)
        .filter((line) => line.trim().startsWith('|') && line.includes(`](${file})`));
      if (rows.length === 0) {
        problems.push(
          `${file}: no ${README} table row links it (add a row to the Templates table that lists its sections)`,
        );
      }
      for (const row of rows) {
        const listed = backticked(splitRow(row).at(-1));
        if (listed.join('\n') !== headings.join('\n')) {
          problems.push(
            `${file}: ${README} lists sections ${listed.join(', ') || '(none)'}; ` +
              `the file has ${headings.join(', ') || '(none)'}`,
          );
        }
      }
    }
  }

  // A file at a rule's location may be in a directory that could not be read.
  for (const rule of rules) {
    if (rule.pattern && !matchedRules.has(rule) && !unreadable.some((dir) => couldContain(dir, rule.pattern))) {
      problems.push(`${GUIDE}: no file matches \`${rule.pattern}\` (${rule.dimension})`);
    }
  }

  return { problems, fileCount: files.length, ruleCount: rules.length };
}

const USAGE = 'Usage: node scripts/check-souls.mjs [--root <dir>]';

const HELP = `${USAGE}

Checks every .md file under souls/ and templates/ against the requirements
table in ${GUIDE}, and checks that ${README} links every soul and lists
every template's sections. Prints one line per problem.

Options:
  --root <dir>  Repository directory to check (default: the repository
                that contains this script). To name a directory that
                starts with -, write it as ./-name
  -h, --help    Show this help

Exit status: 0 no problems; 1 problems found, including a --root
directory that does not exist; 2 unknown argument or --root without a
directory.`;

function displayRoot(root, cwd) {
  const fromCwd = relative(cwd, root);
  if (isAbsolute(fromCwd) || fromCwd === '..' || fromCwd.startsWith(`..${sep}`)) return root;
  return fromCwd.split(sep).join('/') || '.';
}

function count(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

function main(argv) {
  let root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--help' || argv[i] === '-h') {
      console.log(HELP);
      return 0;
    }
    if (argv[i] === '--root') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        console.error(`Missing directory after --root\n${USAGE}`);
        return 2;
      }
      root = resolve(value);
      i++;
    } else {
      console.error(`Unknown argument: ${argv[i]}\n${USAGE}`);
      return 2;
    }
  }
  const where = displayRoot(root, process.cwd());
  const { problems, fileCount, ruleCount } = checkRepository(root, where);
  for (const problem of problems) console.log(problem);
  console.log(
    `Checked ${count(fileCount, 'file')} in ${where} against ${count(ruleCount, 'rule')} ` +
      `from ${GUIDE}: ${count(problems.length, 'problem')}.`,
  );
  return problems.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
