---
name: tokenwise
description: Use when coding in unfamiliar or large repositories, when context or tool usage may be expensive, when multiple workflow skills could apply, when using CodeGraph or indexed code lookup, or when measuring token savings.
---

# Tokenwise

Spend context only when it changes the next action.

## Runtime Router

1. Classify the task: `answer`, `locate`, `debug`, `implement`, `review`, or `plan`.
2. Pick a budget:
   - `S`: known file, direct answer, tiny edit
   - `M`: normal bugfix or small feature
   - `L`: cross-module behavior, refactor, ambiguous impact
   - `XL`: architecture, migration, broad investigation
3. Choose the cheapest reliable evidence:
   - structural code question: indexed graph lookup first
   - literal text question: `rg`
   - known file: read the smallest useful range
   - unknown area without an index: search before reading
4. Load at most one reference unless the task proves it needs more:
   - exploration: `references/exploration.md`
   - routing: `references/workflow-routing.md`
   - debugging: `references/debugging.md`
   - implementation: `references/implementation.md`
   - subagents: `references/subagents.md`
   - review: `references/review.md`
   - verification: `references/verification.md`
   - measurement: `references/measurement.md`
5. Stop expanding context once you can name the next edit, command, answer, or blocker.
6. Verify with the cheapest check that can catch the likely failure.

## Guardrails

- Do not load multiple heavy workflow skills speculatively.
- Do not read whole files for orientation when symbol/index lookup can answer.
- Do not spawn broad exploration agents when indexed lookup can answer directly.
- Do not re-check indexed structural facts with grep unless stale, ambiguous, or contradicted.
- Do not make token-savings claims without eval data.

## Output

When the task is non-trivial, report the budget, evidence path, and verification used.
