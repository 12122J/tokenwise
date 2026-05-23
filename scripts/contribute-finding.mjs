#!/usr/bin/env node
/**
 * Record an agent-discovered finding for a reference card.
 *
 * Findings land in framework/findings/ for human review.
 * Run `npm run findings` to list pending findings.
 * Run `npm run findings:merge <file>` to append a finding to its target card.
 *
 * Usage:
 *   node scripts/contribute-finding.mjs \
 *     --card debugging \
 *     --finding "Check git log before any search — most regressions are recent" \
 *     [--task "short description of the task that produced this finding"]
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);

function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const subcommand = args[0];

// ── merge subcommand ──────────────────────────────────────────────────────────
if (subcommand === 'merge') {
  const findingFile = args[1];
  if (!findingFile) {
    process.stderr.write('Usage: contribute-finding.mjs merge <finding-file>\n');
    process.exit(1);
  }

  const findingPath = resolve(process.cwd(), findingFile);
  if (!existsSync(findingPath)) {
    process.stderr.write(`Finding file not found: ${findingPath}\n`);
    process.exit(1);
  }

  const text = readFileSync(findingPath, 'utf8');
  const cardMatch = text.match(/^card:\s*(.+)$/m);
  const finding = text.split('\n\n').slice(1).join('\n\n').trim();

  if (!cardMatch || !finding) {
    process.stderr.write('Invalid finding file — missing card: header or body.\n');
    process.exit(1);
  }

  const cardName = cardMatch[1].trim();
  const cardPath = resolve(process.cwd(), 'framework', 'references', `${cardName}.md`);

  if (!existsSync(cardPath)) {
    process.stderr.write(`Card not found: ${cardPath}\n`);
    process.exit(1);
  }

  const cardText = readFileSync(cardPath, 'utf8');
  const hasSection = cardText.includes('## Contributed Patterns');

  const entry = `\n- ${finding}`;
  if (hasSection) {
    const updated = cardText.replace(
      /(## Contributed Patterns\n)/,
      `$1${entry}\n`
    );
    writeFileSync(cardPath, updated);
  } else {
    appendFileSync(cardPath, `\n## Contributed Patterns\n${entry}\n`);
  }

  process.stdout.write(`Merged into ${cardPath}\n`);
  process.stdout.write(`Review the card, then run: node scripts/build-skill.mjs --config framework/config.yaml\n`);
  process.exit(0);
}

// ── list subcommand ───────────────────────────────────────────────────────────
if (subcommand === 'list') {
  const dir = resolve(process.cwd(), 'framework', 'findings');
  if (!existsSync(dir)) {
    process.stdout.write('No findings yet.\n');
    process.exit(0);
  }
  const files = readdirSync(dir).filter(f => f.endsWith('.md')).sort();
  if (!files.length) {
    process.stdout.write('No pending findings.\n');
    process.exit(0);
  }
  for (const f of files) {
    const text = readFileSync(resolve(dir, f), 'utf8');
    const card = text.match(/^card:\s*(.+)$/m)?.[1] || '?';
    const body = text.split('\n\n').slice(1).join(' ').trim().slice(0, 80);
    process.stdout.write(`${f}  [${card}]  ${body}\n`);
  }
  process.exit(0);
}

// ── record subcommand (default) ───────────────────────────────────────────────
const card = getArg('--card');
const finding = getArg('--finding');
const task = getArg('--task') || '';

if (!card || !finding) {
  process.stderr.write(
    'Usage: node scripts/contribute-finding.mjs --card <name> --finding "<text>" [--task "<context>"]\n' +
    '       node scripts/contribute-finding.mjs list\n' +
    '       node scripts/contribute-finding.mjs merge <finding-file>\n'
  );
  process.exit(1);
}

const findingsDir = resolve(process.cwd(), 'framework', 'findings');
mkdirSync(findingsDir, { recursive: true });

const now = new Date();
const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 16);
const filename = `${ts}-${card}.md`;
const filepath = resolve(findingsDir, filename);

const content = [
  `card: ${card}`,
  `date: ${now.toISOString().slice(0, 10)}`,
  task ? `task: ${task}` : null,
].filter(Boolean).join('\n') + `\n\n${finding}\n`;

writeFileSync(filepath, content);

process.stdout.write(`Finding saved: framework/findings/${filename}\n`);
process.stdout.write(`Review with: node scripts/contribute-finding.mjs list\n`);
process.stdout.write(`Merge with:  node scripts/contribute-finding.mjs merge framework/findings/${filename}\n`);
