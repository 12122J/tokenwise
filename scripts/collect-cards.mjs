#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cardsDir = join(root, 'knowledge', 'cards');
const required = ['id', 'category', 'source', 'problem', 'rule', 'metrics', 'confidence', 'loads_into'];

function walk(dir) {
  const entries = readdirSync(dir).sort();
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    return path.endsWith('.yaml') ? [path] : [];
  });
}

function parseScalarMap(text) {
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith(' ') || line.startsWith('-') || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) map[match[1]] = match[2].trim();
  }
  return map;
}

const files = walk(cardsDir);
const errors = [];
const cards = [];

for (const file of files) {
  const rel = relative(root, file);
  const text = readFileSync(file, 'utf8');
  const parsed = parseScalarMap(text);
  for (const key of required) {
    if (!parsed[key]) errors.push(`${rel}: missing ${key}`);
  }
  if (parsed.id && !/^[a-z0-9-]+$/.test(parsed.id)) {
    errors.push(`${rel}: id must be lowercase kebab-case`);
  }
  cards.push({
    file: rel,
    id: parsed.id ?? null,
    category: parsed.category ?? null,
    source: parsed.source ?? null,
    confidence: parsed.confidence ?? null
  });
}

const summary = {
  card_count: cards.length,
  categories: Object.fromEntries(
    [...new Set(cards.map((card) => card.category).filter(Boolean))]
      .sort()
      .map((category) => [category, cards.filter((card) => card.category === category).length])
  ),
  errors
};

console.log(JSON.stringify(summary, null, 2));
if (errors.length > 0) process.exit(1);
