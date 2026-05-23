# Real Eval Status

Last updated: 2026-05-23.

## What Ran

Attempted a real Codex paired pilot:

```bash
node scripts/run-eval.mjs \
  --clean \
  --tasks tokenwise-router-orientation,tokenwise-runner-measurement,tokenwise-review-runner \
  --variants superpowers,tokenwise \
  --command "codex -a never exec --json --ephemeral --skip-git-repo-check --sandbox read-only --cd /private/tmp/tokenwise-work - < {prompt_file}" \
  --out results/real-pilot-runs.jsonl \
  --logs-dir results/real-pilot-logs \
  --prompts-dir results/real-pilot-prompts
```

## Result

Only the first run completed before the account hit the Codex usage limit.

Valid measured run:

```json
{
  "task_id": "tokenwise-router-orientation",
  "variant": "superpowers",
  "success": true,
  "total_tokens": 249955,
  "input_tokens": 245203,
  "cached_input_tokens": 208896,
  "output_tokens": 4752,
  "reasoning_output_tokens": 2724,
  "tool_calls": 14,
  "file_reads": 11,
  "grep_calls": 2,
  "codegraph_calls": 0,
  "skill_words_loaded": 1455
}
```

The remaining runs failed with:

```text
You've hit your usage limit. To get more access now, send a request to your admin or try again at 3:14 PM.
```

## Interpretation

There is not enough paired data to claim savings.

The one valid run shows Superpowers can be expensive on a read-only orientation
task, but it has no matching Tokenwise run yet. Tokenwise savings remain
unproven until the paired runs complete successfully.

## Measurement Fix

`scripts/summarize-results.mjs` now excludes failed zero-token runs from savings
calculations. Failed usage-limit runs no longer produce fake 100% savings.

