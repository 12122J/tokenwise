# Debugging Policy

Debugging spends tokens well when it narrows uncertainty. It wastes tokens when
it tries fixes before locating the break.

## Minimal Debug Loop

1. Capture the exact failure: command, error, file, line, observed behavior.
2. Reproduce or identify why reproduction is blocked.
3. Trace the failing value or call path backward to the source.
4. State one hypothesis.
5. Make the smallest test or diagnostic that can falsify it.
6. Fix the root cause, not the symptom.
7. Run the narrowest regression check, then widen if risk warrants.

## Token-Saving Moves

- read the stack trace before searching
- inspect recent diffs before scanning the repo
- use callers/callees/impact before walking files manually
- add temporary diagnostics only at component boundaries
- stop after three failed fix attempts and question the architecture

