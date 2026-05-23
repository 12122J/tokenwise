# M2 Source Mining Notes

This pass expands Tokenwise from a thin router into an evidence-card knowledge
base. It mines reusable rules from the local forks of Superpowers and CodeGraph,
then keeps the runtime skill small through progressive disclosure.

## Sources Mined

- `12122J/superpowers`
  - `using-superpowers`: priority and routing discipline
  - `test-driven-development`: red/green/refactor constraints
  - `systematic-debugging`: root-cause investigation and diagnostic loops
  - `requesting-code-review`: review checkpoints and scoped reviewer context
  - `receiving-code-review`: feedback verification and pushback rules
  - `verification-before-completion`: evidence-before-claim gate
  - `dispatching-parallel-agents` and `subagent-driven-development`: delegation economics
  - `writing-skills`: progressive disclosure and skill compression
- `12122J/codegraph`
  - `src/mcp/server-instructions.ts`: graph-first lookup policy
  - `src/installer/instructions-template.ts`: adapter-facing tool selection
  - `.claude/skills/agent-eval/SKILL.md`: measurement fields and A/B framing

## Current Knowledge Base

- 83 cards total
- 8 categories
- Runtime skill body remains under 300 words
- Full skill/adapters active surface remains under 1,700 words

## Category Coverage

- exploration: graph-first lookup, fallback rules, stop conditions
- workflow-routing: task classification, skill loading, priority rules
- debugging: root cause, diagnostics, failed-fix stop rules
- implementation: TDD constraints, minimal implementation, boundaries
- subagents: scope, critical path, ownership, compact outputs
- review: findings-first review, feedback verification, YAGNI checks
- verification: fresh evidence, original symptom, requirements checks
- compression: skill authoring, references, measured claims

## Next Mining Targets

- Run traces from real Tokenwise/Superpowers/CodeGraph tasks
- Other public skill packs with strong progressive disclosure
- Codex/Claude/Cursor/opencode adapter quirks
- Eval runner outputs once M3 starts

