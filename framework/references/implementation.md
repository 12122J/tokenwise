# Implementation

Write the minimum code that makes the next observable behavior correct.

## Before You Edit

Name these before touching any file:
- Which files change and why.
- Which symbols are involved.
- Which callers or tests are affected.
- The verification command that will confirm the change is correct.

If you cannot name all four, return to exploration.

## Behavior Changes

For new behavior, bug fixes, and meaningful refactors:

1. Write or update the narrowest failing test for the intended behavior.
2. Run it and confirm the failure is meaningful (not a setup error or wrong assertion).
3. Implement the minimum code to pass.
4. Run targeted tests. Widen only when the changed surface justifies it.

## Constraints

- Do not add error handling for scenarios that cannot happen in practice.
- Do not design for hypothetical future requirements (YAGNI).
- Do not add abstractions until the same logic appears in three places.
- Do not refactor while also making a behavior change — split the commits.

## Deferred Tests

Acceptable to defer tests for: throwaway spikes, generated files, config-only changes.
If a spike becomes production code, backfill the test before marking the task done.

## Waste Patterns

- Editing callers before confirming the implementation is correct.
- Running the full suite after a change isolated to one module.
- Adding logging or instrumentation beyond what the task requires.
