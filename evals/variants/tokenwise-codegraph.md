# Tokenwise + CodeGraph Variant

Run the task with Tokenwise active and CodeGraph initialized.

Expected behavior:

- classify task and budget first
- use CodeGraph for structural lookup
- use rg for literal lookup
- avoid broad exploration subagents
- load only one Tokenwise reference unless escalation is justified
- verify according to risk

This is the primary candidate workflow for token-savings claims.

