# Debugging

Debugging spends tokens well when it narrows uncertainty. It wastes tokens when
it tries fixes before locating the break.

## Minimal Debug Loop

1. Read the exact error — full message, file, line, stack trace. Not a summary of it.
2. Check recent changes first: `git log --oneline -10 <file>`. Most regressions are recent.
3. Reproduce with the narrowest possible case before touching code.
4. Trace the failing value or call path backward to where it diverges from expected.
5. Form one hypothesis. Make the smallest diagnostic that can falsify it.
6. Fix the root cause, not the symptom.
7. Run the narrowest test that covers the fix. Widen only if the change surface is large.

## Token-Saving Moves

- Read the stack trace before running any search.
- Use callers/callees/impact queries before walking files manually.
- Add diagnostics only at component boundaries — not inside functions you already suspect.
- Stop after three failed hypotheses and re-examine the architecture. The mental model is wrong.

## Waste Patterns

- Changing code before reproducing the failure.
- Running the full test suite to confirm a single-function fix.
- Reading files that are downstream of the error source.

