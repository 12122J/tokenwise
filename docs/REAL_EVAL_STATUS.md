# Real Eval Status

Last updated: 2026-05-23.

## What Ran

First attempt, before reset, completed only one Superpowers run and then hit
the Codex usage limit.

After reset, completed a real Codex paired pilot:

```bash
node scripts/run-eval.mjs \
  --clean \
  --tasks tokenwise-router-orientation,tokenwise-runner-measurement,tokenwise-review-runner \
  --variants superpowers,tokenwise \
  --command "codex -a never exec --json --ephemeral --skip-git-repo-check --sandbox read-only --cd /path/to/tokenwise - < {prompt_file}" \
  --out results/real-pilot-runs.jsonl \
  --logs-dir results/real-pilot-logs \
  --prompts-dir results/real-pilot-prompts
```

## Result

All 6 paired runs completed successfully on the second attempt.

Summary:

| Task | Superpowers tokens | Tokenwise tokens | Savings |
| --- | ---: | ---: | ---: |
| `tokenwise-router-orientation` | 263,487 | 99,119 | 62.4% |
| `tokenwise-runner-measurement` | 234,038 | 156,117 | 33.3% |
| `tokenwise-review-runner` | 699,190 | 765,062 | -9.4% |

Median paired savings: **33.3%**.

Both variants succeeded on all three tasks.

## Interpretation

There is now limited paired evidence that the Tokenwise variant can save tokens
on orientation and measurement-explanation tasks.

This is not enough for a public claim yet:

- only 3 task pairs were run
- no CodeGraph variant was measured
- the Tokenwise skill was not installed as a first-class Codex skill for every
  run, so this mainly measures the lighter Tokenwise variant instructions and
  task discipline
- review work regressed: Tokenwise used 9.4% more tokens on the review task

Current internal read: promising, but not proven. The next valid claim gate is
at least 5 task types with repeatable paired runs and no success regression.

## What the Comparison Actually Measured

The six runs did not compare Tokenwise-skill vs Superpowers-skill.

The superpowers variant had the full Superpowers plugin auto-loaded from a
global Codex install — hence `skill_words_loaded: 1,455` on every run.

The tokenwise variant had no skill injected. The prompt contained only the
six-bullet behavioral description from `evals/variants/tokenwise.md`.
The Tokenwise SKILL.md was not in scope for any run.

Evidence: the `tokenwise-runner-measurement` tokenwise run shows
`skill_words_loaded: 0` and `tool_calls: 14` (vs superpowers' 7). An active
router would have classified the task and stopped earlier. The
`skill_words_loaded: 454` on the orientation run is the agent reading SKILL.md
to answer "explain how the router works" — not the skill being active.

**Actual comparison:** full Superpowers plugin (~1,455 words always loaded)
vs six-bullet behavioral guidelines (0 extra words).

**What the data still shows:** reducing forced skill scaffolding saves tokens.
That is a real directional signal. It does not validate Tokenwise routing
behavior. Valid paired measurements require rerunning with the variant fix.

## Variant Fix Applied

`evals/variants/tokenwise.md` now embeds the full SKILL.md router. Future runs
will have the actual routing instructions in scope, making the comparison valid.
Rerun with `--clean` to produce new results.

## Measurement Fix

`scripts/summarize-results.mjs` now excludes failed zero-token runs from savings
calculations. Failed usage-limit runs no longer produce fake 100% savings.

## Raw Second-Attempt Results

```json
[
  {
    "task_id": "tokenwise-router-orientation",
    "variant": "superpowers",
    "success": true,
    "total_tokens": 263487,
    "tool_calls": 7,
    "file_reads": 10,
    "grep_calls": 3,
    "skill_words_loaded": 1455
  },
  {
    "task_id": "tokenwise-router-orientation",
    "variant": "tokenwise",
    "success": true,
    "total_tokens": 99119,
    "tool_calls": 5,
    "file_reads": 2,
    "grep_calls": 2,
    "skill_words_loaded": 454
  },
  {
    "task_id": "tokenwise-runner-measurement",
    "variant": "superpowers",
    "success": true,
    "total_tokens": 234038,
    "tool_calls": 7,
    "file_reads": 11,
    "grep_calls": 1,
    "skill_words_loaded": 1455
  },
  {
    "task_id": "tokenwise-runner-measurement",
    "variant": "tokenwise",
    "success": true,
    "total_tokens": 156117,
    "tool_calls": 14,
    "file_reads": 8,
    "grep_calls": 3,
    "skill_words_loaded": 0
  },
  {
    "task_id": "tokenwise-review-runner",
    "variant": "superpowers",
    "success": true,
    "total_tokens": 699190,
    "tool_calls": 33,
    "file_reads": 25,
    "grep_calls": 7,
    "skill_words_loaded": 1644
  },
  {
    "task_id": "tokenwise-review-runner",
    "variant": "tokenwise",
    "success": true,
    "total_tokens": 765062,
    "tool_calls": 16,
    "file_reads": 18,
    "grep_calls": 4,
    "skill_words_loaded": 1074
  }
]
```
