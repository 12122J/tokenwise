import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrompt,
  buildRunPlan,
  extractCodexMetrics,
  extractTokenwiseResult,
  normalizeResult,
  parseList
} from '../scripts/eval-runner-lib.mjs';

test('parseList splits comma-separated values and trims whitespace', () => {
  assert.deepEqual(parseList('superpowers, tokenwise-codegraph'), [
    'superpowers',
    'tokenwise-codegraph'
  ]);
});

test('buildRunPlan creates paired task and variant runs', () => {
  const plan = buildRunPlan({
    tasks: ['bugfix-known-failure'],
    variants: ['superpowers', 'tokenwise-codegraph'],
    repetitions: 2
  });

  assert.deepEqual(plan.map((run) => `${run.taskId}:${run.variant}:${run.repetition}`), [
    'bugfix-known-failure:superpowers:1',
    'bugfix-known-failure:tokenwise-codegraph:1',
    'bugfix-known-failure:superpowers:2',
    'bugfix-known-failure:tokenwise-codegraph:2'
  ]);
});

test('buildPrompt includes task, variant, and result contract', () => {
  const prompt = buildPrompt({
    taskId: 'bugfix-known-failure',
    taskText: 'id: bugfix-known-failure\nprompt: "Fix it"',
    variant: 'tokenwise-codegraph',
    variantText: '# Tokenwise + CodeGraph Variant',
    rubrics: [{ name: 'success.md', text: '# Success Rubric' }]
  });

  assert.match(prompt, /bugfix-known-failure/);
  assert.match(prompt, /Tokenwise \+ CodeGraph Variant/);
  assert.match(prompt, /TOKENWISE_RESULT/);
});

test('extractTokenwiseResult reads the last machine-readable result marker', () => {
  const text = [
    'thinking...',
    'TOKENWISE_RESULT {"success":false,"total_tokens":200}',
    'more logs',
    'TOKENWISE_RESULT {"success":true,"total_tokens":120,"file_reads":2}'
  ].join('\n');

  assert.deepEqual(extractTokenwiseResult(text), {
    success: true,
    total_tokens: 120,
    file_reads: 2
  });
});

test('extractTokenwiseResult reads markers from Codex JSON agent messages', () => {
  const text = [
    JSON.stringify({ type: 'thread.started' }),
    JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'agent_message',
        text: 'TOKENWISE_RESULT {"success":true,"total_tokens":1,"notes":"from json"}'
      }
    })
  ].join('\n');

  assert.deepEqual(extractTokenwiseResult(text), {
    success: true,
    total_tokens: 1,
    notes: 'from json'
  });
});

test('extractCodexMetrics parses turn usage and tool events', () => {
  const text = [
    JSON.stringify({
      type: 'turn.completed',
      usage: {
        input_tokens: 100,
        cached_input_tokens: 20,
        output_tokens: 30,
        reasoning_output_tokens: 5
      }
    }),
    JSON.stringify({
      type: 'item.completed',
      item: { type: 'tool_call', name: 'Read' }
    }),
    JSON.stringify({
      type: 'item.completed',
      item: { type: 'tool_call', name: 'codegraph_context' }
    })
  ].join('\n');

  assert.deepEqual(extractCodexMetrics(text), {
    input_tokens: 100,
    cached_input_tokens: 20,
    output_tokens: 30,
    reasoning_output_tokens: 5,
    total_tokens: 130,
    tool_calls: 2,
    file_reads: 1,
    grep_calls: 0,
    codegraph_calls: 1
  });
});

test('normalizeResult fills required run metadata and computed total tokens', () => {
  const result = normalizeResult({
    taskId: 'feature-small-behavior',
    variant: 'tokenwise',
    runId: 'feature-small-behavior__tokenwise__1',
    repetition: 1,
    durationMs: 42,
    parsed: {
      success: true,
      input_tokens: 90,
      output_tokens: 10,
      tool_calls: 3
    }
  });

  assert.equal(result.task_id, 'feature-small-behavior');
  assert.equal(result.variant, 'tokenwise');
  assert.equal(result.run_id, 'feature-small-behavior__tokenwise__1');
  assert.equal(result.repetition, 1);
  assert.equal(result.duration_ms, 42);
  assert.equal(result.total_tokens, 100);
  assert.equal(result.success, true);
  assert.equal(result.tool_calls, 3);
});
