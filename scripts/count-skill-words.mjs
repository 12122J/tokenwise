#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const targets = process.argv.slice(2);
const dirs = targets.length > 0 ? targets.map((target) => join(root, target)) : [join(root, 'skills')];
const exts = new Set(['.md', '.mdc']);

function walk(path) {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return readdirSync(path).sort().flatMap((entry) => walk(join(path, entry)));
}

function extension(path) {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

function countWords(text) {
  return (text.match(/[A-Za-z0-9_'-]+/g) ?? []).length;
}

const files = dirs.flatMap(walk).filter((file) => exts.has(extension(file)));
const rows = files.map((file) => {
  const words = countWords(readFileSync(file, 'utf8'));
  return { file: relative(root, file), words };
});

const total = rows.reduce((sum, row) => sum + row.words, 0);
const byFile = Object.fromEntries(rows.map((row) => [row.file, row.words]));

console.log(JSON.stringify({ total_words: total, files: byFile }, null, 2));
