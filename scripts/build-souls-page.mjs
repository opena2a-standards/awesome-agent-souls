#!/usr/bin/env node
/**
 * build-souls-page.mjs — generate ONE self-contained, emailable HTML file that
 * lets anyone browse the agent SOUL definitions without opening each file.
 *
 * Usage:
 *   node scripts/build-souls-page.mjs
 *   node scripts/build-souls-page.mjs --root /path/to/another/catalog
 *   REPO_PATH=/path/to/another/catalog node scripts/build-souls-page.mjs
 *
 * Reads this repository by default. Writes dist/souls.html, which carries no
 * external assets, works over file:// and needs no network.
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR = resolve(__dirname, '..');

/* -------- resolve target repo -------- */
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const DEFAULT_ROOT = APP_DIR;
const ROOT = resolve(arg('--root') || process.env.REPO_PATH || DEFAULT_ROOT);
const OUT_FILE = join(APP_DIR, 'dist', 'souls.html');
const ASSETS = join(__dirname, 'souls-assets');

/* -------- taxonomy -------- */
const AXIS_ORDER = ['role', 'industry', 'org', 'usecase', 'fleet', 'examples', 'templates'];
const AXIS_LABEL = {
  role: 'By Role',
  industry: 'By Industry',
  org: 'By Organization Type',
  usecase: 'By Use Case',
  fleet: 'By Fleet',
  examples: 'Examples',
  templates: 'Templates',
};
const SIBLING = {
  'by-role': { axis: 'role', grouped: true },
  'by-industry': { axis: 'industry', grouped: true },
  'by-org-type': { axis: 'org', grouped: true },
  'by-use-case': { axis: 'usecase', grouped: false },
  'by-fleet': { axis: 'fleet', grouped: true },
  examples: { axis: 'examples', grouped: false },
};
const GROUP_LABEL = {
  devops: 'DevOps',
  'devrel-team': 'DevRel Team',
  'hr-operations': 'HR Operations',
  'm-and-a-due-diligence': 'M&A Due Diligence',
  'soc-defense': 'SOC Defense',
  'research-lab-team': 'Research Lab Team',
  'open-source-foundation': 'Open Source Foundation',
  'data-science': 'Data Science',
  'real-estate': 'Real Estate',
  'red-team-ops': 'Red Team Ops',
  'incident-response-team': 'Incident Response Team',
  'compliance-audit': 'Compliance Audit',
  'content-factory': 'Content Factory',
  'customer-success': 'Customer Success',
  'data-analytics': 'Data Analytics',
  'dev-squad': 'Dev Squad',
  'executive-advisory': 'Executive Advisory',
  'legal-ops': 'Legal Ops',
  'sales-pipeline': 'Sales Pipeline',
  'research-lab': 'Research Lab',
};
function pretty(slug) {
  return GROUP_LABEL[slug] || slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function titleFromSlug(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/* -------- walk -------- */
const SKIP_DIRS = new Set(['.git', 'node_modules', '.next', 'out', 'dist', 'build', 'coverage', '.turbo', '.cache']);
function walk(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(join(dir, entry.name), acc);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      acc.push(join(dir, entry.name));
    }
  }
  return acc;
}

/* -------- classify -------- */
function classify(rel) {
  const parts = rel.split('/');
  if (parts[0] === 'templates') {
    return { axis: 'templates', group: 'templates', groupLabel: 'Templates', kind: 'template', file: parts.slice(1).join('/') };
  }
  if (parts[0] !== 'souls') return null;
  const key = parts[1];
  const def = SIBLING[key];
  if (!def) return null;
  if (def.grouped) {
    const groupName = parts[2];
    const file = parts.slice(3).join('/');
    const kind = basename(file) === 'FLEET.md' ? 'fleet' : 'soul';
    return { axis: def.axis, group: groupName, groupLabel: pretty(groupName), kind, file };
  }
  const file = parts.slice(2).join('/');
  const kind = def.axis === 'examples' ? 'example' : 'soul';
  return { axis: def.axis, group: key, groupLabel: AXIS_LABEL[def.axis], kind, file };
}

/* -------- frontmatter + sections -------- */
function unquote(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}
function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = /^([A-Za-z0-9_-]+):\s?(.*)$/.exec(line);
    if (!mm) continue;
    const k = mm[1];
    let v = mm[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      data[k] = v
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean);
    } else {
      data[k] = unquote(v);
    }
  }
  return { data, body: text.slice(m[0].length) };
}
function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

// Gives every section a stable anchor derived from its heading, so a deep link
// survives a regeneration. An index would silently point elsewhere once a soul
// gains or loses a section. Repeats get -2, -3, ... in file order.
function addSlugs(sections) {
  const seen = {};
  sections.forEach((sec, i) => {
    const base = slugify(sec.heading) || 'section-' + (i + 1);
    seen[base] = (seen[base] || 0) + 1;
    sec.slug = seen[base] === 1 ? base : base + '-' + seen[base];
  });
  return sections;
}

function parseSections(body) {
  const lines = body.split(/\r?\n/);
  let h1 = '';
  const sections = [];
  let current = null;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (!inFence) {
      if (!h1) {
        const h1m = /^#\s+(.*)$/.exec(line);
        if (h1m) {
          h1 = h1m[1].trim();
          continue;
        }
      }
      const h2m = /^##\s+(.*)$/.exec(line);
      if (h2m) {
        current = { heading: h2m[1].trim(), body: '' };
        sections.push(current);
        continue;
      }
    }
    if (current) current.body += line + '\n';
  }
  const out = sections.map((s) => ({ heading: s.heading, body: s.body.trim() })).filter((s) => s.heading || s.body);
  if (!out.length && body.trim()) out.push({ heading: '', body: body.trim() });
  return { h1, sections: addSlugs(out) };
}

/* -------- build -------- */
function build() {
  let files;
  try {
    files = walk(ROOT);
  } catch {
    files = [];
  }
  const souls = [];
  for (const abs of files) {
    const rel = abs.slice(ROOT.length + 1);
    const cls = classify(rel);
    if (!cls) continue;
    let text = '';
    try {
      text = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    const { data, body } = parseFrontmatter(text);
    const { h1, sections } = parseSections(body);
    const name = (typeof data.name === 'string' && data.name) || basename(rel, '.md');
    const tools = Array.isArray(data.tools) ? data.tools : data.tools ? [data.tools] : [];
    souls.push({
      id: rel,
      path: rel,
      fileName: basename(rel),
      axis: cls.axis,
      axisLabel: AXIS_LABEL[cls.axis],
      group: cls.group,
      groupLabel: cls.groupLabel,
      kind: cls.kind,
      name,
      heading: h1 || (typeof data.role === 'string' && data.role) || titleFromSlug(basename(rel, '.md')),
      role: typeof data.role === 'string' ? data.role : '',
      description: typeof data.description === 'string' ? data.description : '',
      tools,
      author: typeof data.author === 'string' ? data.author : '',
      fleet: typeof data.fleet === 'string' ? data.fleet : '',
      category: typeof data.category === 'string' ? data.category : '',
      team_size: data.team_size != null ? String(data.team_size) : '',
      coordination: typeof data.coordination === 'string' ? data.coordination : '',
      sectionHeadings: sections.map((s) => s.heading).filter(Boolean),
      sections,
    });
  }

  souls.sort((a, b) => (a.axis + '/' + a.group + '/' + a.heading).localeCompare(b.axis + '/' + b.group + '/' + b.heading));

  // count groups
  const groups = new Set(souls.map((s) => s.axis + '/' + s.group));
  const repoName = basename(ROOT);

  const meta = {
    repo: repoName,
    generatedAt: new Date().toISOString(),
    count: souls.length,
    groups: groups.size,
  };

  let json = JSON.stringify({ meta, souls });
  json = json.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  const css = readFileSync(join(ASSETS, 'app.css'), 'utf8');
  const js = readFileSync(join(ASSETS, 'app.js'), 'utf8');
  const template = readFileSync(join(ASSETS, 'template.html'), 'utf8');

  const dateStr = new Date().toISOString().slice(0, 10);
  const out = template
    .split('__CSS__').join(css)
    .split('__DATA__').join(json)
    .split('__JS__').join(js)
    .split('__REPO__').join(repoName)
    .split('__COUNT__').join(String(souls.length))
    .split('__SECTIONS__').join(String(groups.size))
    .split('__DATE__').join(dateStr);

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, out, 'utf8');

  const kb = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(0);
  console.log(`SOUL page → ${OUT_FILE}`);
  console.log(`  ${souls.length} souls · ${groups.size} groups · ${kb} KB (self-contained)`);
  if (!souls.length) {
    console.warn(`  WARNING: no souls found under ${ROOT}`);
  }
}

build();
