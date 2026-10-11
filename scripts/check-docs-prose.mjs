#!/usr/bin/env node
// Checks the prose of every tracked Markdown file for dashes and for one kind of heading.
//
// Usage: node scripts/check-docs-prose.mjs [--help]
//
// Prose is written without a dash. An em dash, and a double hyphen or an en dash with a space or the
// start or end of the line on each side, are each reported, and so is a heading named "Why this
// exists" or "Why this matters". A fenced code block and an inline code span are not prose, so a
// command keeps its `--` separator and its `--flag` options. The files checked are the .md and .mdx
// files git tracks that isChecked accepts, so a file that has not been added to git is not checked.

import { spawnSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Markdown under a directory with one of these names is not prose a reader follows: installed and
// generated files, changelog fragments, and test data, whose text is what a test compares against.
const SKIPPED_DIRS = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  'changelog.d',
  'test',
  'tests',
  '__tests__',
  'fixtures',
  'corpus',
  'golden',
  'snapshots',
  '__snapshots__',
]);

// A changelog records each release as it was written, and a license is a legal text.
const SKIPPED_FILES = /^(changelog\.mdx?|licen[cs]e.*)$/i;

// Whether the file at `path`, written with `/` between its segments, is checked.
export function isChecked(path) {
  const dirs = path.split('/');
  const name = dirs.pop();
  return !SKIPPED_FILES.test(name) && !dirs.some((dir) => SKIPPED_DIRS.has(dir));
}

// Each pattern is matched against a line of prose, and each match is one problem.
const MARKS = [
  [/(?<!\S)--(?!\S)/g, () => 'double hyphen used as a dash'],
  [/—/g, () => 'em dash'],
  [/(?<!\S)–(?!\S)/g, () => 'en dash used as a dash'],
  [/^\s{0,3}#{1,6}\s*[*_]*(why this (?:exists|matters))\b/gi, (match) => `heading named "${match[1]}"`],
];

// Returns the line with each inline code span replaced by backticks, which keeps every other
// character at its position. A span starts at a run of backticks and ends at the next run of the
// same length on the line; a run with no such later run is text. `closes[k]` is the run that closes
// run k, found by reading the runs from last to first, so a line of many runs is read once.
function maskInlineCode(line) {
  const runs = [...line.matchAll(/`+/g)];
  const nearest = new Map();
  const closes = [];
  for (let k = runs.length - 1; k >= 0; k--) {
    closes[k] = nearest.get(runs[k][0].length);
    nearest.set(runs[k][0].length, k);
  }
  let masked = '';
  let done = 0;
  for (let k = 0; k < runs.length; k++) {
    if (closes[k] === undefined) continue;
    const end = runs[closes[k]].index + runs[closes[k]][0].length;
    masked += line.slice(done, runs[k].index) + '`'.repeat(end - runs[k].index);
    done = end;
    k = closes[k];
  }
  return masked + line.slice(done);
}

// Returns one { line, column, problem } for each dash and each named heading in the prose of a
// Markdown text, in the order they appear. Lines and columns count from 1.
export function findProseProblems(text) {
  const problems = [];
  let fence = null;
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const marker = raw.match(/^[\s>]*(`{3,}|~{3,})(.*)$/);
    if (fence !== null) {
      // A code block ends at a fence of the same character, at least as long, with no text after it.
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) {
        fence = null;
      }
      continue;
    }
    // The text after an opening fence of backticks holds no backtick: a line that has one is prose
    // that starts with an inline code span.
    if (marker && !(marker[1][0] === '`' && marker[2].includes('`'))) {
      fence = marker[1];
      continue;
    }
    // A line of only hyphens, colons, pipes and spaces is a rule or the second row of a table.
    if (/^[\s|:-]*$/.test(raw)) continue;
    const line = maskInlineCode(raw);
    const found = [];
    for (const [pattern, name] of MARKS) {
      for (const match of line.matchAll(pattern)) {
        found.push({ line: index + 1, column: match.index + 1, problem: name(match) });
      }
    }
    // One push per problem: spreading the problems of a line of about 125,000 dashes or more into push
    // overflows the stack.
    for (const problem of found.sort((a, b) => a.column - b.column)) problems.push(problem);
  }
  return problems;
}

// Lists the .md and .mdx files git tracks under `root` as { files }. When git cannot list them, for
// example where git is not installed or `root` is not in a git repository, returns { reason } instead.
function trackedMarkdownFiles(root) {
  const { status, stdout, stderr, error } = spawnSync('git', ['ls-files', '-z', '--', '*.md', '*.mdx'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (status === 0) return { files: stdout.split('\0').filter(Boolean) };
  if (error) return { reason: `git did not run (${error.code})` };
  return { reason: stderr.trim().split(/\r?\n/)[0] || `git ls-files exited with status ${status}` };
}

// Checks every tracked Markdown file under `root` that isChecked accepts and returns one line per
// problem, each starting with the file, the line and the column.
export function checkRepository(root) {
  const { files, reason } = trackedMarkdownFiles(root);
  if (!files) return { problems: [`cannot list the tracked files: ${reason}`], fileCount: 0 };
  const problems = [];
  let fileCount = 0;
  for (const file of files.filter(isChecked)) {
    let text;
    try {
      // A tracked file that has been deleted, or that is a symbolic link, has no text of its own here.
      if (!lstatSync(join(root, file), { throwIfNoEntry: false })?.isFile()) continue;
      text = readFileSync(join(root, file), 'utf8');
    } catch (error) {
      problems.push(`${file}: cannot read (${error.code})`);
      continue;
    }
    fileCount++;
    for (const { line, column, problem } of findProseProblems(text)) {
      problems.push(`${file}:${line}:${column}: ${problem}`);
    }
  }
  return { problems, fileCount };
}

const USAGE = 'Usage: node scripts/check-docs-prose.mjs';

const HELP = `${USAGE}

Checks the prose of every .md and .mdx file git tracks in this repository.
Prints file:line:column for each double hyphen, em dash or en dash used as
a dash, and for each heading named "Why this exists" or "Why this matters".
Fenced code blocks and inline code are not checked. CHANGELOG.md,
CHANGELOG.mdx, changelog fragments under a changelog.d directory, LICENSE
files and files under a directory of installed, generated or test files,
such as node_modules or fixtures, are not checked.

Options:
  -h, --help    Show this help

Exit status: 0 no problems; 1 problems found; 2 unknown argument.`;

const FIX =
  'Write each sentence with a period, a comma, a colon or parentheses in place of the dash, ' +
  'and put what a "Why this ..." section says under the heading it explains.';

function count(n, noun) {
  return `${n} ${noun}${n === 1 ? '' : 's'}`;
}

// Writes a backslash as \\ and each control, format, unassigned or private-use character, and each
// line or paragraph separator, as a visible escape such as \u{1b}, so that a file name cannot start an
// output line of its own or change how the terminal shows the output.
function printable(text) {
  return text.replace(/[\\\p{C}\p{Zl}\p{Zp}]/gu, (char) =>
    char === '\\' ? '\\\\' : `\\u{${char.codePointAt(0).toString(16)}}`,
  );
}

// Runs the command line `argv` on the repository at `root` and returns its exit status.
export function main(argv, root = resolve(dirname(fileURLToPath(import.meta.url)), '..')) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    return 0;
  }
  if (argv.length > 0) {
    console.error(`Unknown argument: ${printable(argv[0])}\n${USAGE}`);
    return 2;
  }
  const { problems, fileCount } = checkRepository(root);
  for (const problem of problems) console.log(printable(problem));
  console.log(`Checked ${count(fileCount, 'file')}: ${count(problems.length, 'problem')}.`);
  if (problems.length > 0) console.log(FIX);
  return problems.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
