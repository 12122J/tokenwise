# Debugging

No fix before root cause. Symptom fixes mask the problem and waste time. This applies even when under time pressure — systematic is faster than thrashing.

## Four Phases (complete each before moving to the next)

**1. Root cause investigation — required before any fix**
- Read the full error: message, file, line, stack trace. Not a summary.
- Check recent changes: `git log --oneline -10`. Most regressions are recent.
- Reproduce consistently before touching code.
- In multi-component systems: add diagnostics at each boundary, run once to see where it breaks, then investigate that specific layer.
- Trace the bad value or call path backward to its source. Fix at the source.

**2. Find the pattern**
- Locate similar working code in the same codebase.
- List every difference between working and broken, however small.

**3. Hypothesis and test**
- State it clearly: "I think X is the root cause because Y."
- Make the smallest change that can falsify it — one variable at a time.

**4. Fix**
- Fix the root cause. One change. No bundled refactoring.
- If fix fails: return to Phase 1, don't add more fixes on top.
- After three failed fixes: stop. The architecture is wrong — discuss before attempting more.

## Token-Saving Moves

- Read the stack trace before any search.
- Add diagnostics at component boundaries, not inside functions you already suspect.
- Run the narrowest test that covers the fix. Widen only if the change surface is large.

## Waste Patterns

- Changing code before reproducing the failure.
- Running the full suite to confirm a single-function fix.
- Reading files downstream of the error source.
