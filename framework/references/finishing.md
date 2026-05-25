# Finishing a Branch

Verify tests → detect environment → present options → execute → clean up.

## Before Presenting Options

Run the test suite. If tests fail: show failures, stop. Do not offer merge or PR until tests pass.

## Present Exactly These Options

```
Implementation complete. What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work
```

For detached HEAD: options 2, 3, 4 only (no local merge).

## Executing Each Option

**Merge:** checkout base, pull, merge, verify tests on result, then clean up worktree, then delete branch. Order matters.

**PR:** push, `gh pr create` with summary and test plan. Do NOT clean up worktree — it's needed for PR iteration.

**Keep:** report the path, leave everything intact.

**Discard:** require typed `discard` confirmation first. Then clean up.

## Worktree Cleanup

Only clean up worktrees you created (path under `.worktrees/` or `worktrees/`). Always `cd` to main repo root before `git worktree remove`. Run `git worktree prune` after.

## Never

Merge with failing tests. Delete work without confirmation. Force-push without an explicit request.
