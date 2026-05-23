#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';

const file = process.argv[2] ?? 'results/runs.jsonl';

if (!existsSync(file)) {
  console.log(JSON.stringify({
    error: `No results file found at ${file}`,
    expected_jsonl_shape: {
      task_id: 'bugfix-known-failure',
      variant: 'tokenwise-codegraph',
      success: true,
      total_tokens: 100000,
      cost_usd: 0.25,
      tool_calls: 10,
      file_reads: 2,
      grep_calls: 1,
      codegraph_calls: 3,
      skill_words_loaded: 500
    }
  }, null, 2));
  process.exit(0);
}

const runs = readFileSync(file, 'utf8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON on line ${index + 1}: ${error.message}`);
    }
  });

function median(values) {
  const nums = values.filter((value) => typeof value === 'number' && Number.isFinite(value)).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

function pctSavings(baseline, value) {
  if (!baseline || value == null) return null;
  return ((baseline - value) / baseline) * 100;
}

function measuredSuccessfulRuns(taskRuns) {
  return taskRuns.filter((run) =>
    run.success === true &&
    typeof run.total_tokens === 'number' &&
    Number.isFinite(run.total_tokens) &&
    run.total_tokens > 0
  );
}

const groups = new Map();
for (const run of runs) {
  const key = `${run.task_id}::${run.variant}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(run);
}

const taskIds = [...new Set(runs.map((run) => run.task_id))].sort();
const variants = [...new Set(runs.map((run) => run.variant))].sort();
const byTask = {};

for (const taskId of taskIds) {
  byTask[taskId] = {};
  const superpowersMedian = median(
    measuredSuccessfulRuns(groups.get(`${taskId}::superpowers`) ?? []).map((run) => run.total_tokens)
  );
  for (const variant of variants) {
    const taskRuns = groups.get(`${taskId}::${variant}`) ?? [];
    const measuredRuns = measuredSuccessfulRuns(taskRuns);
    const totalTokens = median(measuredRuns.map((run) => run.total_tokens));
    byTask[taskId][variant] = {
      runs: taskRuns.length,
      success_rate: taskRuns.length
        ? taskRuns.filter((run) => run.success === true).length / taskRuns.length
        : null,
      median_total_tokens: totalTokens,
      measured_runs: measuredRuns.length,
      median_cost_usd: median(measuredRuns.map((run) => run.cost_usd)),
      median_tool_calls: median(measuredRuns.map((run) => run.tool_calls)),
      median_file_reads: median(measuredRuns.map((run) => run.file_reads)),
      median_grep_calls: median(measuredRuns.map((run) => run.grep_calls)),
      median_codegraph_calls: median(measuredRuns.map((run) => run.codegraph_calls)),
      savings_vs_superpowers_pct: pctSavings(superpowersMedian, totalTokens)
    };
  }
}

const byVariant = {};
for (const variant of variants) {
  const variantRuns = runs.filter((run) => run.variant === variant);
  const measuredRuns = measuredSuccessfulRuns(variantRuns);
  byVariant[variant] = {
    runs: variantRuns.length,
    success_rate: variantRuns.length
      ? variantRuns.filter((run) => run.success === true).length / variantRuns.length
      : null,
    measured_runs: measuredRuns.length,
    median_total_tokens: median(measuredRuns.map((run) => run.total_tokens)),
    median_cost_usd: median(measuredRuns.map((run) => run.cost_usd)),
    median_tool_calls: median(measuredRuns.map((run) => run.tool_calls)),
    median_file_reads: median(measuredRuns.map((run) => run.file_reads))
  };
}

const aggregateSavingsVsSuperpowers = {};
for (const variant of variants) {
  if (variant === 'superpowers') continue;
  const savings = [];
  for (const taskId of taskIds) {
    const value = byTask[taskId]?.[variant]?.savings_vs_superpowers_pct;
    if (typeof value === 'number' && Number.isFinite(value)) savings.push(value);
  }
  aggregateSavingsVsSuperpowers[variant] = {
    paired_tasks: savings.length,
    median_savings_pct: median(savings)
  };
}

console.log(JSON.stringify({
  runs: runs.length,
  by_variant: byVariant,
  savings_vs_superpowers: aggregateSavingsVsSuperpowers,
  by_task: byTask
}, null, 2));
