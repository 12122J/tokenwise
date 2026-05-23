# Subagent Economics

Subagents save context only when their scope is narrow and their output is
compact. They waste context when used as generic explorers.

## Use A Subagent When

- tasks are independent and can run in parallel
- the subagent owns a clear file/module scope
- the prompt includes enough context without full session history
- the expected output is a decision, patch, or concise finding list

## Avoid A Subagent When

- the main task is blocked on the result immediately
- the task is broad codebase orientation
- indexed lookup can answer in a few calls
- the prompt would need most of the current context to succeed

## Prompt Contract

Give subagents:

- goal
- owned files/modules
- constraints
- verification command
- output format

Do not give them the whole conversation unless required.

