# Onboarding

Orient in an unfamiliar codebase without reading everything.

## Orientation Sequence

1. Read `README.md`, then `CONTRIBUTING.md` or `AGENTS.md` if they exist.
2. Run the project: `npm install && npm start`, `go run .`, `python -m app`, etc. Seeing it work is worth ten file reads.
3. Find the entry point: `main()`, `index.ts`, `app.py`, `routes/`. Trace one request or operation end-to-end.
4. Read the directory structure — top level only. Name what each folder is responsible for.
5. Look at the last 10 commits: `git log --oneline -10`. Recent activity reveals what's actively changing.

## Targeted Over Broad

Do not read every file to understand a codebase. Instead:
- Use symbol lookup to follow a specific call chain.
- Search for the concept you need (`rg "payment"`, `rg "auth"`) to find the relevant module.
- Read tests — they describe intended behavior more directly than implementation.

## Before Making Your First Edit

- Identify the test command and confirm tests pass in the current state.
- Find the linter/formatter and check it passes.
- Locate the CI config (`.github/workflows/`, `Makefile`). Know what "green" means before touching anything.

## Waste Patterns

- Reading utility files before understanding the core flow.
- Asking the agent to explain the whole codebase before stating a specific question.
- Exploring areas unrelated to the task at hand.
