# Tokenwise

Tokenwise is a token-aware workflow layer for coding agents. It integrates
Superpowers-style engineering discipline with CodeGraph-style indexed code
intelligence, then measures whether the workflow actually saves tokens.

The project goal is not "use fewer tokens" as a vague instruction. The goal is a
measured claim:

> Tokenwise + indexed code context should reduce median total tokens versus
> Superpowers-only workflows while preserving task success.

## How it works

```mermaid
flowchart LR
    A([task]) --> B[router\nclassify + budget]
    B -->|exploration| C[exploration.md]
    B -->|debugging| D[debugging.md]
    B -->|implementation| E[implementation.md]
    B -->|review| F[review.md]
    C & D & E & F --> G([execute])
    style B fill:#1c2128,stroke:#6e40c9,color:#e6edf3
    style G fill:#1c2128,stroke:#238636,color:#3fb950
```

The router classifies the task type and budget first, then loads at most one
reference. Superpowers loads its full skill suite on every task; Tokenwise loads
only what the current task requires.

## Architecture

- `skills/tokenwise/` contains the compact runtime skill and on-demand references.
- `knowledge/cards/` stores evidence-backed rules distilled from sources and traces.
- `evals/` defines repeatable tasks, variants, and rubrics.
- `scripts/` measures skill size, validates cards, and summarizes run results.
- `adapters/` provides platform-specific entrypoints for Claude, Codex, Cursor,
  and opencode.

## Measurement First

Tokenwise claims must be earned by evals. Compare these variants:

1. Control: normal agent behavior.
2. Superpowers: current Superpowers workflow.
3. CodeGraph: graph-first navigation only.
4. Tokenwise: workflow router only.
5. Tokenwise + CodeGraph: router plus indexed navigation.

Primary metrics:

- total tokens and cost
- tool calls
- file reads
- grep/search calls
- CodeGraph calls
- skill words loaded
- task success

## Results

First real paired pilot — 6 runs across 3 task types, all succeeded.

```mermaid
xychart-beta
    title "Token usage — Superpowers vs Tokenwise pilot (n=1 each)"
    x-axis ["orientation", "measurement", "review"]
    y-axis "tokens (thousands)" 0 --> 800
    bar [263, 234, 699]
    bar [99, 156, 765]
```

| Task | Superpowers | Tokenwise | Δ |
|---|---:|---:|---:|
| orientation | 263k | 99k | −62% |
| measurement | 234k | 156k | −33% |
| review | 699k | 765k | +9% |

Median: **−33%**. Review task regressed.

**Caveat:** the pilot ran without proper skill injection — the tokenwise variant
received behavioral guidelines only, not the actual SKILL.md router. The
comparison is "full Superpowers plugin vs lightweight prompt guidance." Results
are directional, not definitive. See
[docs/REAL_EVAL_STATUS.md](docs/REAL_EVAL_STATUS.md) for the full analysis and
the variant fix that makes future runs valid.

## Current State

- 91 evidence cards across 8 categories
- Runtime skill body: under 300 words
- Active skill/adapters surface: under 1,700 words
- Real paired pilot: 6/6 runs succeeded; directional token savings observed
  (see [docs/REAL_EVAL_STATUS.md](docs/REAL_EVAL_STATUS.md) for full data and
  caveats — the first pilot ran without proper skill injection and results
  should not be treated as definitive)

## Local Checks

```bash
npm run check
```

## Eval Smoke Test

```bash
npm run eval:smoke -- --clean
node scripts/summarize-results.mjs results/smoke-runs.jsonl
```

Smoke results are synthetic and prove the pipeline only. Use
`scripts/run-eval.mjs` with a real agent command before making savings claims.

## Install

For Claude Code, copy `skills/tokenwise/` into `.claude/skills/tokenwise/`.

For Codex, copy `adapters/codex/AGENTS.md` into the target agent instructions
surface and keep `skills/tokenwise/` available as a skill folder.

The adapters are intentionally small; the runtime skill loads references only
when the task needs them.
