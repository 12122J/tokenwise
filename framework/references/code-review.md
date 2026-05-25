# Code Review

Review is evidence work. Reception is technical evaluation, not social performance.

## Giving Review

1. Define target: diff range, PR, commit, or file list.
2. Read changed lines before surrounding context.
3. Check behavioral correctness before style; test coverage before approving.
4. Each finding: file + line + what is wrong + what correct looks like.
5. Separate: **blocking** (wrong behavior, missing test, security) vs **important** (unclear, fragile) vs **minor** (style).

Before commenting: does this break existing callers? Does the test actually fail before the fix?

## Receiving Review

**Before implementing anything:**
- Restate the requirement or ask — do not assume you understand.
- Verify against the codebase: does the suggestion break existing behavior? Is it consistent with patterns elsewhere?
- If any item is unclear, clarify all unclear items before starting. Partial understanding leads to wrong implementation.
- Check YAGNI: grep for actual usage before implementing "proper" versions of things. If nothing calls it, say so.

**Response pattern:** No "You're absolutely right!" / "Great point!" / "Let me implement that now." Just act, or state the technical requirement.

**Acknowledging correct feedback:** "Fixed. [brief description of what changed]." No thanks, no praise — the code shows you heard it.

**Push back when:** suggestion breaks existing behavior without reason, adds capability nothing needs, conflicts with established patterns, or assumes context the reviewer doesn't have. Use technical reasoning.

**When pushed back and wrong:** "Verified — you're right. Fixing." State it factually and move on. No apology.

## Waste Patterns

- Summarizing the diff instead of reviewing it.
- Implementing feedback before verifying it's correct for this codebase.
- Accepting multiple risky fixes in one commit without testing between them.
