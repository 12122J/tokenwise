# Measurement

Tokenwise savings are measured with paired runs across fixed tasks.

## Variants

- `control`: default agent behavior
- `superpowers`: Superpowers active
- `codegraph`: CodeGraph active
- `tokenwise`: Tokenwise active
- `tokenwise-codegraph`: Tokenwise and CodeGraph active

## Result Format

Write one JSON object per run to `results/runs.jsonl`.

```json
{
  "task_id": "bugfix-known-failure",
  "variant": "tokenwise-codegraph",
  "success": true,
  "input_tokens": 90000,
  "output_tokens": 8000,
  "total_tokens": 98000,
  "cost_usd": 0.32,
  "tool_calls": 10,
  "file_reads": 2,
  "grep_calls": 1,
  "codegraph_calls": 3,
  "skill_words_loaded": 450
}
```

## Savings Formula

```text
savings_pct =
  (superpowers_total_tokens - variant_total_tokens)
  / superpowers_total_tokens
  * 100
```

## Claim Gate

Do not claim Tokenwise saves tokens until:

- each task has paired `superpowers` and target-variant runs
- success rate is equal or better for the target variant
- median savings across task medians is positive and stable
- at least five task types are represented

Initial target: `tokenwise-codegraph` saves 30% median total tokens versus
`superpowers` with no task-success regression.

**Note on the first real pilot:** The pilot runs (see `docs/REAL_EVAL_STATUS.md`)
used the tokenwise variant without proper skill injection — the SKILL.md router
was not in scope for any tokenwise run. The comparison measured full Superpowers
plugin vs lightweight behavioral guidelines, not Tokenwise-skill vs Superpowers.
The `evals/variants/tokenwise.md` file now embeds the full skill so future runs
are valid. Rerun the pilot before drawing conclusions from the existing results.

