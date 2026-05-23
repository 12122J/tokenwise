# Tokenwise Adapter for opencode

Tokenwise is a compact workflow router. Use it when codebase context, tool
calls, or skill loading may dominate the task cost.

## Policy

1. Classify task.
2. Choose budget.
3. Use the cheapest reliable evidence source.
4. Load one workflow reference only if it changes the next action.
5. Stop exploration when the next edit, command, answer, or blocker is clear.
6. Verify by risk.

Prefer CodeGraph/indexed tools for structural lookup and native search for
literal strings.

