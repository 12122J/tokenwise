# Verification Policy

Verification should match risk.

## Cheap-To-Broad Ladder

1. Static check for touched file or package.
2. Narrow unit test for changed behavior.
3. Affected tests from import/impact analysis.
4. Package test suite.
5. Full project suite or browser/manual verification.

## Stop Rules

Stop widening verification when:

- the changed surface is small
- affected-test analysis is clean
- targeted tests cover the behavior
- broader checks are known to be slow/flaky and not decision-changing

Always report what was not run when risk remains.

## Measurement Fields

Record commands, pass/fail, duration when available, and why the verification
level was sufficient.

