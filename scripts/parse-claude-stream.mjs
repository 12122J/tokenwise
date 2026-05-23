#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/parse-claude-stream.mjs <stream-jsonl>');
  process.exit(2);
}

const metrics = {
  input_tokens: 0,
  output_tokens: 0,
  total_tokens: 0,
  cost_usd: 0,
  tool_calls: 0,
  file_reads: 0,
  grep_calls: 0,
  codegraph_calls: 0
};

for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
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
    metrics.output_tokens += usage.output_tokens ?? 0;
  }

  const cost = event.total_cost_usd ?? event.cost_usd;
  if (typeof cost === 'number') metrics.cost_usd = Math.max(metrics.cost_usd, cost);

  const name = event.name ?? event.tool_name ?? event.message?.name;
  if (name) {
    metrics.tool_calls += 1;
    if (/^(Read|read)$/i.test(name)) metrics.file_reads += 1;
    if (/grep|rg|search/i.test(name) && !/codegraph/i.test(name)) metrics.grep_calls += 1;
    if (/codegraph/i.test(name)) metrics.codegraph_calls += 1;
  }
}

metrics.total_tokens = metrics.input_tokens + metrics.output_tokens;
console.log(JSON.stringify(metrics, null, 2));

