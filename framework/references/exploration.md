# Exploration

Use the cheapest source that can answer the question with enough reliability.

## Evidence Ladder

1. Known symbol or structural relation → indexed graph lookup (`codegraph_search`, `codegraph_context`).
2. Literal string, error text, comment, or log line → `rg "exact text" --type <lang>`.
3. Known file and area → read a targeted line range, not the whole file.
4. Unknown area without an index → `rg --files | grep <pattern>`, then search inside matches.
5. Full file read → only when local context is required for an edit, review, or the file is under ~100 lines.

## Stop Rules

Stop when any of these is true:
- The next edit is clear (you can name the file, line, and change).
- The answer can cite a specific file and symbol.
- The remaining uncertainty is not decision-changing.
- A quick verification will answer the question cheaper than more reading.

## Waste Patterns

- Reading a file to find where a symbol is defined (use symbol search instead).
- Running `rg` twice with synonym queries when the first result was already enough.
- Walking caller/callee chains manually when an impact query exists.
- Reading the same file twice in a session without a stated reason.
- Opening a subagent for exploration that a single `rg` would answer.
