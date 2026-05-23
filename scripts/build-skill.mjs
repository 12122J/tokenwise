#!/usr/bin/env node
/**
 * Builds a deployable Tokenwise skill from a framework config.
 *
 * Usage: node scripts/build-skill.mjs [--config <path>] [--out <dir>]
 *
 * Defaults:
 *   --config  framework/config.yaml
 *   --out     skills/<name>/
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, watch } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';

const args = process.argv.slice(2);
const configIdx = args.indexOf('--config');
const outIdx = args.indexOf('--out');
const configPath = configIdx !== -1 ? args[configIdx + 1] : 'framework/config.yaml';
const outOverride = outIdx !== -1 ? args[outIdx + 1] : null;
const watchMode = args.includes('--watch');

const root = process.cwd();
const configFile = resolve(root, configPath);
const configDir = dirname(configFile);

if (!existsSync(configFile)) {
  process.stderr.write(`Config not found: ${configFile}\n`);
  process.exit(1);
}

// Minimal YAML parser for the subset used in config.yaml:
// top-level scalars, top-level maps (indent 2), top-level arrays of objects (indent 2+4)
function parseYaml(text) {
  const lines = text.split('\n');
  const result = {};
  // Tracks state: {key, type: 'map'|'list', obj (current list item)}
  let scope = null;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (!line.trim()) continue;

    const indent = line.match(/^(\s*)/)[1].length;
    const trimmed = line.trim();

    if (indent === 0) {
      const kv = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (!kv) continue;
      const [, k, v] = kv;
      const val = v.replace(/^["']|["']$/g, '').trim();
      if (val === '') {
        // Peek at what follows to decide map vs list
        scope = { key: k };
        result[k] = null; // placeholder, set when first child seen
      } else {
        result[k] = val;
        scope = null;
      }
      continue;
    }

    if (!scope) continue;

    if (indent === 2) {
      if (trimmed.startsWith('- ')) {
        // Array of scalars or start of array of objects
        if (!Array.isArray(result[scope.key])) result[scope.key] = [];
        const val = trimmed.slice(2).trim();
        const kv = val.match(/^([^:]+):\s*(.*)$/);
        if (kv) {
          // e.g. "- id: locate"
          const [, k, v] = kv;
          const obj = { [k]: v.replace(/^["']|["']$/g, '').trim() };
          result[scope.key].push(obj);
          scope.currentItem = obj;
        } else {
          result[scope.key].push(val);
          scope.currentItem = null;
        }
      } else {
        // Map entry
        if (result[scope.key] === null) result[scope.key] = {};
        const kv = trimmed.match(/^([^:]+):\s*(.*)$/);
        if (!kv) continue;
        const [, k, v] = kv;
        result[scope.key][k] = v.replace(/^["']|["']$/g, '').trim();
      }
      continue;
    }

    if (indent === 4 && scope.currentItem) {
      // Properties of the current list item object
      const kv = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (!kv) continue;
      const [, k, v] = kv;
      scope.currentItem[k] = v.replace(/^["']|["']$/g, '').trim();
    }
  }
  return result;
}

const rawConfig = readFileSync(configFile, 'utf8');
const config = parseYaml(rawConfig);

const name = config.name || 'tokenwise';
const outDir = outOverride ? resolve(root, outOverride) : resolve(root, 'skills', name);
const refsOutDir = resolve(outDir, 'references');

mkdirSync(refsOutDir, { recursive: true });

// Validate references exist and count words
const taskTypes = config.task_types || [];
const errors = [];
for (const t of taskTypes) {
  const refPath = resolve(configDir, t.reference);
  if (!existsSync(refPath)) {
    errors.push(`  Missing reference for task type '${t.id}': ${refPath}`);
  } else {
    const words = readFileSync(refPath, 'utf8').split(/\s+/).filter(Boolean).length;
    if (words > 250) {
      process.stderr.write(`Warning: ${t.reference} is ${words} words (recommended: under 200)\n`);
    }
  }
}

if (errors.length) {
  process.stderr.write('Build failed — missing reference files:\n' + errors.join('\n') + '\n');
  process.exit(1);
}

// Build reference list for SKILL.md
const refLines = taskTypes.map(t => {
  const refName = basename(t.reference, '.md');
  return `   - ${t.id}: \`references/${refName}.md\``;
}).join('\n');

// Generate SKILL.md
const skill = `---
name: ${name}
description: Use when coding in unfamiliar or large repositories, when context or tool usage may be expensive, when multiple workflow skills could apply, or when the task type matches a configured reference.
---

# ${name.charAt(0).toUpperCase() + name.slice(1)}

Spend context only when it changes the next action.

## Runtime Router

1. Classify the task: \`answer\`, \`locate\`, \`debug\`, \`implement\`, \`review\`, \`plan\`, or a custom type.
2. Pick a budget:
${Object.entries(config.budgets || {}).map(([k, v]) => `   - \`${k}\`: ${v}`).join('\n')}
3. Choose the cheapest reliable evidence:
   - structural code question: indexed graph lookup first
   - literal text question: \`rg\`
   - known file: read the smallest useful range
   - unknown area without an index: search before reading
4. Load at most one reference unless the task proves it needs more:
${refLines}
5. Stop expanding context once you can name the next edit, command, answer, or blocker.
6. Verify with the cheapest check that can catch the likely failure.

## Guardrails

- Do not load multiple heavy workflow skills speculatively.
- Do not read whole files for orientation when symbol/index lookup can answer.
- Do not spawn broad exploration agents when indexed lookup can answer directly.
- Do not make token-savings claims without eval data.

## Output

When the task is non-trivial, report the budget, evidence path, and verification used.
`;

writeFileSync(resolve(outDir, 'SKILL.md'), skill);

// Copy reference files
for (const t of taskTypes) {
  const src = resolve(configDir, t.reference);
  const dest = resolve(refsOutDir, basename(t.reference));
  copyFileSync(src, dest);
}

const wordCount = skill.split(/\s+/).filter(Boolean).length;
process.stdout.write(`Built: ${outDir}/\n`);
process.stdout.write(`  SKILL.md: ${wordCount} words\n`);
process.stdout.write(`  References: ${taskTypes.length} files\n`);
if (!watchMode) {
  process.stdout.write(`\nDeploy:\n`);
  process.stdout.write(`  Claude Code:  cp -r ${outDir} ~/.claude/skills/${name}\n`);
  process.stdout.write(`  Codex:        copy ${outDir}/SKILL.md content into AGENTS.md\n`);
  process.stdout.write(`  Cursor:       copy SKILL.md content into .cursorrules\n`);
}

// ── watch mode ────────────────────────────────────────────────────────────────
if (watchMode) {
  process.stdout.write(`\nWatching ${configDir} for changes...\n`);

  let debounce = null;
  const rebuild = (event, filename) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      process.stdout.write(`\n[${new Date().toLocaleTimeString()}] ${filename} changed — rebuilding...\n`);
      // Re-exec this script without --watch to trigger a fresh build
      import('node:child_process').then(({ execFileSync }) => {
        try {
          const scriptArgs = [
            '--config', configPath,
            ...(outOverride ? ['--out', outOverride] : []),
          ];
          execFileSync(process.execPath, [process.argv[1], ...scriptArgs], { stdio: 'inherit' });
        } catch {
          process.stderr.write('Rebuild failed — fix the error above and save again.\n');
        }
      });
    }, 200);
  };

  watch(configDir, { recursive: true }, rebuild);
}
