#!/usr/bin/env node
/**
 * Wrapper to run a tokenwise eval prompt through Claude Code CLI.
 * Parses the stream-json output, extracts real token counts from the
 * result event, and patches them into the TOKENWISE_RESULT marker so
 * the eval harness records accurate numbers.
 *
 * Usage: node scripts/run-claude-eval.mjs <prompt_file> [--bare]
 *
 * --bare: disable hooks (skips Superpowers auto-load). Requires ANTHROPIC_API_KEY.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const promptFile = process.argv[2];
const bare = process.argv.includes('--bare');

if (!promptFile) {
  process.stderr.write('Usage: node scripts/run-claude-eval.mjs <prompt_file>\n');
  process.exit(1);
}

const prompt = readFileSync(promptFile, 'utf8');

const baseCmd = [
  'claude',
  '--print',
  '--output-format', 'stream-json',
  '--verbose',
  '--dangerously-skip-permissions',
];
if (bare) baseCmd.push('--bare');
const cmd = baseCmd.join(' ');

let rawOutput = '';
try {
  rawOutput = execSync(cmd, {
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
    timeout: 300_000,
  });
} catch (err) {
  rawOutput = err.stdout || '';
  process.stderr.write(err.stderr || '');
}

let totalTokens = 0;
let costUsd = 0;
let toolCalls = 0;
let fileReads = 0;
let grepCalls = 0;
let resultText = '';

for (const line of rawOutput.split('\n')) {
  if (!line.trim()) continue;
  let event;
  try { event = JSON.parse(line); } catch { continue; }

  if (event.type === 'result') {
    const u = event.usage || {};
    totalTokens =
      (u.input_tokens || 0) +
      (u.cache_creation_input_tokens || 0) +
      (u.cache_read_input_tokens || 0) +
      (u.output_tokens || 0);
    costUsd = event.total_cost_usd || 0;
    resultText = event.result || '';
  }

  if (event.type === 'assistant' && Array.isArray(event.message?.content)) {
    for (const block of event.message.content) {
      if (block.type !== 'tool_use') continue;
      toolCalls++;
      const n = block.name || '';
      if (n === 'Read') fileReads++;
      if (n === 'Grep' || (n === 'Bash' && (block.input?.command || '').match(/\brg\b|grep/))) grepCalls++;
    }
  }
}

const patched = resultText.replace(/TOKENWISE_RESULT\s+({.*})/g, (_, json) => {
  try {
    const obj = JSON.parse(json);
    if (!obj.total_tokens) obj.total_tokens = totalTokens;
    if (!obj.cost_usd)     obj.cost_usd     = costUsd;
    if (!obj.tool_calls)   obj.tool_calls   = toolCalls;
    if (!obj.file_reads)   obj.file_reads   = fileReads;
    if (!obj.grep_calls)   obj.grep_calls   = grepCalls;
    return `TOKENWISE_RESULT ${JSON.stringify(obj)}`;
  } catch {
    return _;
  }
});

process.stdout.write((patched || resultText) + '\n');
