# Tokenwise Adapter for Claude Code

Use Tokenwise as the workflow router when work may involve expensive context,
large repositories, CodeGraph, or multiple possible workflow skills.

## Rules

- Classify task and budget before loading heavy skills.
- Use CodeGraph/indexed lookup first for structural code questions.
- Use `Grep`/`rg` for literal text.
- Read targeted ranges before whole files.
- Load only the Tokenwise reference needed for the current route.
- Do not make token-savings claims without eval data.

## Skill

Install `skills/tokenwise/` as `.claude/skills/tokenwise/`.

