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
  const jsonMessageResults = [];
  for (const line of text.split(/\r?\n/)) {
    try {
      const event = JSON.parse(line);
      const messageText = event.item?.text ?? event.message?.text;
      if (typeof messageText === 'string') {
        const result = extractTokenwiseResultFromPlainText(messageText);
        if (result) jsonMessageResults.push(result);
      }
    } catch {
      // Non-JSON log lines are handled by the plain-text fallback below.
    }
  }
  if (jsonMessageResults.length > 0) {
    return jsonMessageResults[jsonMessageResults.length - 1];
  }

  return extractTokenwiseResultFromPlainText(text);
}

function extractTokenwiseResultFromPlainText(text) {
  const matches = [...text.matchAll(/TOKENWISE_RESULT\s+({.*})/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1][1];
  return JSON.parse(last);
}

export function extractCodexMetrics(text) {
  const metrics = {
    input_tokens: 0,
    cached_input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: 0,
    tool_calls: 0,
    file_reads: 0,
    grep_calls: 0,
    codegraph_calls: 0
  };

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    const usage = event.usage ?? event.message?.usage;
    if (usage) {
      metrics.input_tokens += usage.input_tokens ?? 0;
      metrics.cached_input_tokens += usage.cached_input_tokens ?? 0;
      metrics.output_tokens += usage.output_tokens ?? 0;
      metrics.reasoning_output_tokens += usage.reasoning_output_tokens ?? 0;
    }

    const name = event.name ?? event.tool_name ?? event.item?.name ?? event.message?.name;
    const itemType = event.item?.type ?? event.type;
    if (name && /tool|function/i.test(itemType ?? '')) {
      metrics.tool_calls += 1;
      if (/^(Read|read)$/i.test(name)) metrics.file_reads += 1;
      if (/grep|rg|search/i.test(name) && !/codegraph/i.test(name)) metrics.grep_calls += 1;
      if (/codegraph/i.test(name)) metrics.codegraph_calls += 1;
    }
  }

  metrics.total_tokens = metrics.input_tokens + metrics.output_tokens;
  return metrics;
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

  const codexMetrics = extractCodexMetrics(completed.text);
  const markerResult = extractTokenwiseResult(completed.text);
  const parsed = markerResult ? { ...markerResult, ...nonZeroMetrics(codexMetrics) } : {
    success: false,
    ...nonZeroMetrics(codexMetrics),
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

function nonZeroMetrics(metrics) {
  return Object.fromEntries(
    Object.entries(metrics).filter(([, value]) => typeof value === 'number' && value > 0)
  );
}
