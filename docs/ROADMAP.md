# Tokenwise Roadmap

## M1: Skeleton With Measurable Shape

Status: scaffolded.

Deliverables:

- independent repo structure
- compact runtime skill
- on-demand references
- knowledge taxonomy
- initial knowledge cards
- eval task and variant definitions
- measurement scripts
- Claude, Codex, Cursor, and opencode adapters

Exit criteria:

- card validation passes
- active skill/adapters word count is tracked
- no token-savings claim is published

## M2: Source Mining

Goal: turn existing knowledge into evidence cards.

Status: first source-mining batch complete.

Sources:

- Superpowers skills and prompts
- CodeGraph instructions, eval harness, and benchmark notes
- official skill docs
- public skill packs with progressive-disclosure patterns
- local traces from expensive sessions

Exit criteria:

- 75+ knowledge cards
- each card has source, trigger, rule, metrics, and confidence
- references are regenerated from cards or manually checked against cards

## M3: Eval Runner

Goal: compare workflows on repeatable tasks.

Status: paired-run harness scaffolded with synthetic smoke runner.

Variants:

- control
- superpowers
- codegraph
- tokenwise
- tokenwise-codegraph

Exit criteria:

- JSONL result schema finalized
- at least 5 task types runnable
- summaries compute median token/cost/tool savings

## M4: First Claim

Goal: publish only what the data supports.

Initial claim target:

- 30% median total-token reduction versus Superpowers
- equal or better task success
- fewer broad file reads or grep/read loops

If the data does not support the claim, revise the skill and cards before
publishing.
