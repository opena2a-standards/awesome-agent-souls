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

// Splits a location into its `/`-separated segments. A segment is its placeholder names and the
// literal texts around them: `literals` has one more entry than `names`. A placeholder is a `<`, one
// or more characters other than `>`, and a `>`. The location is scanned with indexOf rather than
// split with a regular expression, which took time quadratic in the number of `<` without a `>`.
function splitPattern(pattern) {
  const segments = [{ literals: [''], names: [] }];
  const addLiteral = (text) => {
    const [first, ...rest] = text.split('/');
    const segment = segments.at(-1);
    segment.literals[segment.literals.length - 1] += first;
    for (const literal of rest) segments.push({ literals: [literal], names: [] });
  };
  let done = 0;
  let open = pattern.indexOf('<');
  while (open !== -1) {
    const close = pattern.indexOf('>', open + 1);
    if (close === -1) break;
    if (close === open + 1) {
      open = pattern.indexOf('<', close);
      continue;
    }
    addLiteral(pattern.slice(done, open));
    const segment = segments.at(-1);
    segment.names.push(pattern.slice(open + 1, close));
    segment.literals.push('');
    done = close + 1;
    open = pattern.indexOf('<', done);
  }
  addLiteral(pattern.slice(done));
  return segments;
}

// Matches one path segment, which contains no `/`, and returns [name, text] for each placeholder,
// or null. A placeholder stands for one or more characters. Where placeholders could divide the
// text in more than one way, as `<a><b>` can, each one takes the most text that still lets the rest
// match. `ends[j]` is the furthest position placeholder j can end at with the rest of the text
// matching what follows it, so placeholder j and everything after it can match the text from
// position p on exactly when p < ends[j]. Working from the last placeholder back, each end is found
// by searching backwards for the literal that follows the placeholder, so the segment is matched
// without trying each way of dividing the text and without a table of positions per placeholder.
function matchSegment({ literals, names }, text) {
  const n = text.length;
  const k = names.length;
  if (k === 0) return text === literals[0] ? [] : null;
  // Each placeholder takes at least one character, so a shorter text cannot match.
  if (n < literals.reduce((sum, literal) => sum + literal.length, k)) return null;
  if (!text.startsWith(literals[0])) return null;
  // 0 marks a placeholder that cannot end anywhere, since each one ends after at least one character.
  const ends = new Array(k).fill(0);
  // The last placeholder ends where the last literal starts, and that literal ends the text.
  const last = literals[k];
  ends[k - 1] = text.endsWith(last) ? n - last.length : 0;
  for (let j = k - 2; j >= 0 && ends[j + 1] > 0; j--) {
    // Placeholder j can end where the literal after it starts, if that literal ends before
    // ends[j + 1], so that placeholder j + 1 still has a character to take.
    const literal = literals[j + 1];
    const latest = ends[j + 1] - literal.length - 1;
    ends[j] = latest > 0 ? Math.max(text.lastIndexOf(literal, latest), 0) : 0;
  }
  let start = literals[0].length;
  if (start >= ends[0]) return null;
  const values = [];
  for (let j = 0; j < k; j++) {
    values.push([names[j], text.slice(start, ends[j])]);
    start = ends[j] + literals[j + 1].length;
  }
  return values;
}

// Returns a function that matches a path against a location such as `souls/by-fleet/<fleet>/<name>.md`
// and returns the text of each placeholder by name, or null. A placeholder does not match `/`.
function patternToMatcher(pattern) {
  const segments = splitPattern(pattern);
  return (path) => {
    const parts = path.split('/');
    if (parts.length !== segments.length) return null;
    const values = [];
    for (const [index, part] of parts.entries()) {
      const matched = matchSegment(segments[index], part);
      if (!matched) return null;
      values.push(...matched);
    }
    return Object.fromEntries(values);
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

const ESCAPES = { '\\': '\\\\', '\t': '\\t', '\n': '\\n', '\r': '\\r' };

// Writes each control character, format character (such as a right-to-left override or a zero width
// space), private-use, unassigned or unpaired surrogate code point, line or paragraph separator, space
// other than U+0020 (such as a no-break space), character that is shown as nothing by default (such
// as a Hangul filler or a variation selector) and the two blank symbols, the Braille blank and the
// musical null notehead, as a visible escape such as \n, \x1b, \xa0 or \u{202e}, so that a file name
// cannot start an output line of its own or change how the terminal shows the output, and none of
// these characters can pass for a space or for nothing. A backslash is written as \\, so a name that
// holds the text \u{202e} is not written the same way as a name that holds a right-to-left override.
// Which code points are unassigned follows the Unicode version of the Node.js build
// (process.versions.unicode), so a code point assigned in a newer Unicode version is escaped by a
// Node.js built with an older one, and may be printed as it is by a Node.js built with the newer one.
function printable(text) {
  return text.replace(/[\\\p{C}\p{Zl}\p{Zp}\p{Default_Ignorable_Code_Point}\u{2800}\u{1d159}]|(?! )\p{Zs}/gu, (char) => {
    if (ESCAPES[char]) return ESCAPES[char];
    const code = char.codePointAt(0).toString(16);
    return code.length <= 2 ? `\\x${code.padStart(2, '0')}` : `\\u{${code}}`;
  });
}

// Writes a path the way printable writes text, except that where the path separator is a backslash,
// as on Windows, where a backslash cannot be part of a name, each backslash is kept as it is.
// `separator` is the separator of this platform unless a test passes another.
function printablePath(path, separator = sep) {
  return separator === '\\' ? path.split(separator).map(printable).join(separator) : printable(path);
}

// The working directory, or null when it has been removed.
function workingDirectory() {
  try {
    return process.cwd();
  } catch {
    return null;
  }
}

// Runs the command line `argv` and returns its exit status. Paths are printed with the path separator
// `separator`, so a test can print them as Windows does on any platform.
export function main(argv, { separator = sep } = {}) {
  const cwd = workingDirectory();
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
      // Without a working directory a relative path cannot be made absolute, so it is kept as given.
      root = cwd === null && !isAbsolute(value) ? value : resolve(value);
      i++;
    } else {
      // An unknown argument is often a directory given without --root, so it is written as a path.
      console.error(`Unknown argument: ${printablePath(argv[i], separator)}\n${USAGE}`);
      return 2;
    }
  }
  const where = cwd === null ? root : displayRoot(root, cwd);
  const { problems, fileCount, ruleCount } = checkRepository(root, where);
  // A problem with the root names it the way the summary line does.
  for (const problem of problems) {
    console.log(
      problem.startsWith(`${where}: `)
        ? printablePath(where, separator) + printable(problem.slice(where.length))
        : printable(problem),
    );
  }
  console.log(
    `Checked ${count(fileCount, 'file')} in ${printablePath(where, separator)} against ${count(ruleCount, 'rule')} ` +
      `from ${GUIDE}: ${count(problems.length, 'problem')}.`,
  );
  return problems.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
