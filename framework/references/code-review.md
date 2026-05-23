# Code Review

Review is evidence work. Every finding must be grounded in a specific file, line, or behavior.

## Review Loop

1. Define the target: diff range, PR, commit, or file list.
2. Read the changed lines before any surrounding context.
3. Check behavioral correctness before style.
4. Check test coverage before approving.
5. Separate: **blocking** (wrong behavior, missing test, security risk) vs **important** (unclear, fragile) vs **minor** (style, naming).
6. For each finding, state: file + line + what is wrong + what correct looks like.

## What to Verify Before Commenting

- Does this break existing callers? (Check usages, not just the changed file.)
- Does the test actually fail before the fix? (Not just "there is a test.")
- Is the suggested change consistent with how the rest of the codebase does it?

## Pushback Rules

Push back on review feedback when it:
- Breaks existing behavior without a stated reason.
- Adds capability nothing currently needs.
- Conflicts with a pattern established elsewhere in the codebase.
- Assumes context the reviewer likely doesn't have — ask first.

## Waste Patterns

- Summarizing the diff instead of reviewing it.
- Reading unrelated files before the changed surface.
- Accepting suggestions without checking existing usages.
- Implementing multiple risky review fixes in one commit without testing between them.
