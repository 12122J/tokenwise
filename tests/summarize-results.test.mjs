import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

test('summarize-results excludes failed zero-token runs from savings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tokenwise-summary-'));
  const file = join(dir, 'runs.jsonl');
  writeFileSync(file, [
    JSON.stringify({ task_id: 'task-a', variant: 'superpowers', success: true, total_tokens: 100 }),
    JSON.stringify({ task_id: 'task-a', variant: 'tokenwise', success: false, total_tokens: 0 })
  ].join('\n'));

  const stdout = execFileSync('node', ['scripts/summarize-results.mjs', file], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });
  const summary = JSON.parse(stdout);

  assert.equal(summary.savings_vs_superpowers.tokenwise.paired_tasks, 0);
  assert.equal(summary.savings_vs_superpowers.tokenwise.median_savings_pct, null);
  assert.equal(summary.by_task['task-a'].tokenwise.median_total_tokens, null);
});

