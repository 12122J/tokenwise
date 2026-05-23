#!/usr/bin/env node
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_VARIANTS,
  buildRunPlan,
  executeRun,
  parseList
} from './eval-runner-lib.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function parseArgs(argv) {
  const args = {
    tasks: 'all',
    variants: 'all',
    repetitions: '1',
    out: 'results/runs.jsonl',
    logsDir: 'results/logs',
    promptsDir: 'results/prompts',
    command: null,
    clean: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--clean') {
      args.clean = true;
      continue;
    }
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    args[key] = argv[i + 1];
    i += 1;
  }

  return args;
}

function availableTaskIds() {
  return readdirSync(join(root, 'evals', 'tasks'))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => file.replace(/\.yaml$/, ''))
    .sort();
}

const args = parseArgs(process.argv.slice(2));
if (!args.command) {
  console.error('Usage: node scripts/run-eval.mjs --command "<agent command>" [--tasks all|id,id] [--variants all|name,name]');
  console.error('The command receives TOKENWISE_PROMPT_FILE, TOKENWISE_TASK_ID, TOKENWISE_VARIANT, and TOKENWISE_RUN_ID env vars.');
  process.exit(2);
}

const tasks = parseList(args.tasks, availableTaskIds());
const variants = parseList(args.variants, DEFAULT_VARIANTS);
const repetitions = Number.parseInt(args.repetitions, 10);
const outFile = join(root, args.out);
const logsDir = join(root, args.logsDir);
const promptsDir = join(root, args.promptsDir);

if (!Number.isInteger(repetitions) || repetitions < 1) {
  console.error('--repetitions must be a positive integer');
  process.exit(2);
}

if (args.clean) {
  rmSync(outFile, { force: true });
  rmSync(logsDir, { recursive: true, force: true });
  rmSync(promptsDir, { recursive: true, force: true });
}

mkdirSync(dirname(outFile), { recursive: true });

const runs = buildRunPlan({ tasks, variants, repetitions });
console.log(`Running ${runs.length} eval runs...`);

for (const run of runs) {
  console.log(`- ${run.runId}`);
  const { result } = await executeRun({
    root,
    run,
    command: args.command,
    outFile,
    logsDir,
    promptsDir
  });
  console.log(`  success=${result.success} total_tokens=${result.total_tokens}`);
}

console.log(`Wrote ${outFile}`);

