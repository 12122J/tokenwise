# Review Policy

Review is evidence work, not a summary ritual.

## Review Loop

1. Define the review target: diff, commit range, PR, or files.
2. Read changed lines before surrounding context.
3. Check requirements and behavioral risk before style.
4. Ground every finding in a file, line, or symbol.
5. Separate blocking issues, important issues, and minor follow-ups.
6. Verify external feedback against codebase reality before implementing it.

## Pushback Rules

Push back when feedback breaks existing behavior, violates project constraints,
adds unused capability, or assumes context the reviewer does not have.

## Waste Patterns

- summarizing the diff instead of reviewing it
- reading unrelated files before the changed surface
- accepting review feedback without checking usage
- batching many review fixes without testing between risky changes

