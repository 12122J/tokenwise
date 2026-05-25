# Subagents

Fresh context per agent. Never inherit session history — construct exactly what the agent needs.

## When to Dispatch

Use when tasks are independent: different subsystems, non-overlapping file sets, no shared state. If fixing one could fix another, investigate together first.

## Prompt Structure

Each agent prompt needs:
- **Scope** — one problem domain, one test file, one subsystem
- **Goal** — what success looks like
- **Constraints** — what not to touch
- **Output** — what to return (summary of root cause and changes)

Paste the actual error messages or test names. "Fix the race condition" is not enough context.

## Parallelism Rules

Agents can run in parallel only when their write sets don't overlap. If two agents would edit the same file, run them sequentially.

Never dispatch agents for exploration that a single `rg` would answer. Subagents cost context — use them for work, not lookups.

## Review Before Integrating

When agents return:
- Read each summary — understand what changed and why.
- Check for conflicts across agents.
- Run the full test suite.
- Spot check: agents can make systematic errors that pass their own scope.

## After All Tasks

Run a final code review pass over the whole implementation before marking work complete.
