# Exploration Policy

Use the cheapest source that can answer the question with enough reliability.

## Evidence Ladder

1. Known symbol or structural relation: indexed graph lookup.
2. Literal string, error text, comment, or log line: `rg`.
3. Known file and area: read a narrow range.
4. Unknown area without an index: `rg --files`, then targeted search.
5. Full file read: only when local context is required for an edit or review.

## Stop Rules

Stop exploring when one of these is true:

- the next edit is clear
- the answer can cite the relevant file/symbol
- the remaining uncertainty is not decision-changing
- verification will answer the question more cheaply than more reading

## Waste Patterns

- reading a file only to find where a symbol is defined
- repeated `rg` queries that differ by synonyms
- reading caller and callee files manually when impact lookup exists
- using a subagent to perform broad exploration already covered by an index

