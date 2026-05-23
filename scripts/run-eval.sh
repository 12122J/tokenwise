#!/usr/bin/env bash
set -euo pipefail

cat <<'USAGE'
Tokenwise eval runner placeholder.

M1 intentionally does not automate paid agent runs yet. The expected flow is:

1. Pick a task from evals/tasks/*.yaml.
2. Run it under each variant from evals/variants/*.md.
3. Save one JSON object per run to results/runs.jsonl.
4. Run:

   node scripts/summarize-results.mjs results/runs.jsonl

Future versions can wire this to claude -p, codex exec, or another runner.
USAGE

