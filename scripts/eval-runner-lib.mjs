import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

export const DEFAULT_VARIANTS = [
  'control',
  'superpowers',
  'codegraph',
  'tokenwise',
  'tokenwise-codegraph'
];

export function parseList(value, fallback = []) {
  if (!value || value === 'all') return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildRunPlan({ tasks, variants, repetitions = 1 }) {
  const runs = [];
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    for (const taskId of tasks) {
      for (const variant of variants) {
        runs.push({
          taskId,
          variant,
          repetition,
          runId: `${taskId}__${variant}__${repetition}`
        });
      }
    }
  }
  return runs;
}

export function buildPrompt({ taskId, taskText, variant, variantText, rubrics }) {
  const rubricText = rubrics
    .map((rubric) => `## Rubric: ${rubric.name}\n\n${rubric.text.trim()}`)
    .join('\n\n');

  return [
    '# Tokenwise Eval Run',
    '',
    `Task ID: ${taskId}`,
    `Variant: ${variant}`,
    '',
    '## Task Spec',
    '',
    taskText.trim(),
    '',
    '## Variant Instructions',
    '',
    variantText.trim(),
    '',
    '## Rubrics',
    '',
    rubricText,
    '',
    '## Result Contract',
    '',
    'Complete the task, then emit exactly one machine-readable result line:',
    '',
    '```text',
    'TOKENWISE_RESULT {"success":true,"total_tokens":0,"tool_calls":0,"file_reads":0,"grep_calls":0,"codegraph_calls":0,"skill_words_loaded":0,"notes":"brief"}',
    '```',
    '',
    'Use `success:false` if the task is incomplete, blocked, or failed verification.'
  ].join('\n');
}

export function extractTokenwiseResult(text) {
  const matches = [...text.matchAll(/TOKENWISE_RESULT\s+({.*})/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1][1];
  return JSON.parse(last);
}

export function normalizeResult({ taskId, variant, runId, repetition, durationMs, parsed }) {
  const result = {
    task_id: taskId,
    variant,
    run_id: runId,
    repetition,
    success: parsed?.success === true,
    duration_ms: durationMs
  };

  for (const [key, value] of Object.entries(parsed ?? {})) {
    if (key === 'task_id' || key === 'variant' || key === 'run_id' || key === 'repetition') continue;
    result[key] = value;
  }

  if (typeof result.total_tokens !== 'number') {
    const input = typeof result.input_tokens === 'number' ? result.input_tokens : 0;
    const output = typeof result.output_tokens === 'number' ? result.output_tokens : 0;
    result.total_tokens = input + output;
  }

  return result;
}

export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

export function renderCommandTemplate(command, replacements) {
  return command.replace(/{([a-z_]+)}/g, (match, key) => {
    if (!(key in replacements)) return match;
    return shellQuote(replacements[key]);
  });
}

export function readEvalText(root, kind, id) {
  const path = join(root, 'evals', kind, `${id}.md`);
  return readFileSync(path, 'utf8');
}

export function readTaskText(root, taskId) {
  return readFileSync(join(root, 'evals', 'tasks', `${taskId}.yaml`), 'utf8');
}

export function readRubrics(root) {
  return ['success.md', 'token-efficiency.md'].map((name) => ({
    name,
    text: readFileSync(join(root, 'evals', 'rubrics', name), 'utf8')
  }));
}

export async function runCommand({ command, cwd, env }) {
  return await new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      env: { ...process.env, ...env },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ code, stdout, stderr, text: `${stdout}${stderr}` });
    });
  });
}

export async function executeRun({ root, run, command, outFile, logsDir, promptsDir }) {
  mkdirSync(logsDir, { recursive: true });
  mkdirSync(promptsDir, { recursive: true });

  const taskText = readTaskText(root, run.taskId);
  const variantText = readEvalText(root, 'variants', run.variant);
  const prompt = buildPrompt({
    taskId: run.taskId,
    taskText,
    variant: run.variant,
    variantText,
    rubrics: readRubrics(root)
  });

  const promptFile = join(promptsDir, `${run.runId}.md`);
  const logFile = join(logsDir, `${run.runId}.log`);
  writeFileSync(promptFile, prompt);

  const renderedCommand = renderCommandTemplate(command, {
    prompt_file: promptFile,
    log_file: logFile,
    task_id: run.taskId,
    variant: run.variant,
    run_id: run.runId
  });

  const started = Date.now();
  const completed = await runCommand({
    command: renderedCommand,
    cwd: root,
    env: {
      TOKENWISE_TASK_ID: run.taskId,
      TOKENWISE_VARIANT: run.variant,
      TOKENWISE_RUN_ID: run.runId,
      TOKENWISE_PROMPT_FILE: promptFile,
      TOKENWISE_LOG_FILE: logFile
    }
  });
  const durationMs = Date.now() - started;

  const log = [
    `$ ${renderedCommand}`,
    '',
    completed.stdout,
    completed.stderr
  ].join('\n');
  writeFileSync(logFile, log);

  const parsed = extractTokenwiseResult(completed.text) ?? {
    success: false,
    total_tokens: 0,
    notes: `No TOKENWISE_RESULT marker found. Exit code: ${completed.code}`
  };
  const normalized = normalizeResult({
    taskId: run.taskId,
    variant: run.variant,
    runId: run.runId,
    repetition: run.repetition,
    durationMs,
    parsed
  });

  mkdirSync(dirname(outFile), { recursive: true });
  appendFileSync(outFile, `${JSON.stringify(normalized)}\n`);

  return { result: normalized, promptFile, logFile };
}
