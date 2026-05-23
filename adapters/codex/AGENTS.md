# Tokenwise Adapter for Codex

Use Tokenwise when repository exploration, workflow selection, or skill loading
could become expensive.

## Operating Policy

- Start with task type and budget: `S`, `M`, `L`, or `XL`.
- Prefer indexed/semantic lookup for structure; prefer `rg` for literal text.
- Read only the ranges needed for the next edit or answer.
- Load one Tokenwise reference at a time.
- Use subagents only for independent, scoped work that saves main-context effort.
- Record verification and skipped checks in the final response.

## Measurement

When running evals, capture:

- total tokens
- tool calls
- file reads
- grep calls
- codegraph calls
- skill words loaded
- success

