# CodeGraph Variant

Run the task with CodeGraph initialized and configured, but without Tokenwise.

Expected behavior:

- use CodeGraph for structural code lookup
- use native search for literal text
- avoid re-reading files when CodeGraph already returned enough source/context

Record CodeGraph calls, file reads, grep calls, and task success.

