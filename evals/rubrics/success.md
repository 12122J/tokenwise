# Success Rubric

Mark a run successful only when the task outcome is correct, not merely when the
agent reports confidence.

## Pass

- requested behavior is implemented or answered correctly
- relevant tests/checks pass or residual risk is clearly reported
- no unrelated destructive changes
- no unresolved blocker hidden as completion

## Partial

- core direction is correct but verification is incomplete
- answer is useful but misses a relevant edge
- implementation works for the obvious path but lacks required coverage

## Fail

- wrong answer or broken implementation
- changes unrelated files without reason
- claims verification that did not happen
- gives up without a clear blocker

