# M3 Eval Runner

M3 adds a real paired-run harness. It does not run paid agents by default; it
executes whatever command you provide, captures prompts/logs, extracts a
`TOKENWISE_RESULT` marker, and appends normalized JSONL.

## Smoke Test

```bash
npm run eval:smoke -- --clean
node scripts/summarize-results.mjs results/smoke-runs.jsonl
```

The smoke agent is deterministic and synthetic. Its output proves the pipeline
works; it is not evidence for public token-savings claims.

## Real Run Shape

```bash
node scripts/run-eval.mjs \
  --tasks bugfix-known-failure \
  --variants superpowers,tokenwise-codegraph \
  --command '<your agent command>' \
  --out results/runs.jsonl \
  --logs-dir results/logs \
  --prompts-dir results/prompts
```

The command receives these environment variables:

- `TOKENWISE_TASK_ID`
- `TOKENWISE_VARIANT`
- `TOKENWISE_RUN_ID`
- `TOKENWISE_PROMPT_FILE`
- `TOKENWISE_LOG_FILE`

The generated prompt asks the agent to emit one final line:

```text
TOKENWISE_RESULT {"success":true,"total_tokens":0,"tool_calls":0,"file_reads":0,"grep_calls":0,"codegraph_calls":0,"skill_words_loaded":0,"notes":"brief"}
```

## Command Templates

The runner also replaces placeholders in the command:

- `{prompt_file}`
- `{log_file}`
- `{task_id}`
- `{variant}`
- `{run_id}`

Example:

```bash
node scripts/run-eval.mjs \
  --tasks bugfix-known-failure \
  --variants superpowers,tokenwise-codegraph \
  --command 'node scripts/mock-agent.mjs {prompt_file}'
```

## Output

- `results/runs.jsonl`: normalized results, one line per run
- `results/logs/*.log`: command, stdout, stderr
- `results/prompts/*.md`: exact prompt given to each run

Summarize:

```bash
node scripts/summarize-results.mjs results/runs.jsonl
```

## Claim Discipline

Do not publish token-savings claims from smoke results. Public claims require
paired real-agent runs across at least five task types with equal or better
success rate.

