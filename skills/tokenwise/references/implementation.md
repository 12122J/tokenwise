# Implementation Policy

Use Superpowers-style discipline with smaller activation surfaces.

## Behavior Changes

For new behavior, bug fixes, and meaningful refactors:

1. Identify the observable behavior.
2. Write or update the narrowest failing test.
3. Run it and confirm the failure is meaningful.
4. Implement the minimum code to pass.
5. Run targeted tests.
6. Run broader checks only when the changed surface justifies it.

## When TDD Can Be Deferred

Ask before deferring tests for throwaway prototypes, generated files, config-only
changes, or exploratory spikes. If a spike becomes production code, backfill the
test before final verification.

## Context Boundaries

Before editing, name:

- exact files to touch
- symbols involved
- likely affected callers/tests
- verification command

If you cannot name those, return to exploration instead of editing.

