# Tokenwise

Tokenwise is a token-aware workflow layer for coding agents. It integrates
Superpowers-style engineering discipline with CodeGraph-style indexed code
intelligence, then measures whether the workflow actually saves tokens.

The project goal is not "use fewer tokens" as a vague instruction. The goal is a
measured claim:

> Tokenwise + indexed code context should reduce median total tokens versus
> Superpowers-only workflows while preserving task success.

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

## M1 Scope

This repo currently targets a first milestone:

- scaffold a portable skill/adapters repo
- define the knowledge taxonomy
- seed initial knowledge cards
- draft the Tokenwise runtime skill
- define benchmark task specs
- add measurement scripts

No token-savings claim should be made until repeatable eval results exist.

## Local Checks

```bash
npm run check
```

## Install Sketch

For Claude Code, copy `skills/tokenwise/` into `.claude/skills/tokenwise/`.

For Codex, copy `adapters/codex/AGENTS.md` into the target agent instructions
surface and keep `skills/tokenwise/` available as a skill folder.

The adapters are intentionally small; the runtime skill loads references only
when the task needs them.

