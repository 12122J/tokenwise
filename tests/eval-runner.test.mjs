import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPrompt,
  buildRunPlan,
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

