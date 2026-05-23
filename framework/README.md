# Tokenwise Framework

A template for building your team's workflow skill — the set of rules, patterns,
and process knowledge your agents load on-demand instead of carrying everywhere.

## Why This Exists

Most agent workflow tools load everything all the time. A "debug" skill, a "review"
skill, an "implementation" skill — all injected at session start whether the task
needs them or not.

The result: ~1,500 words of context on every task, most of it irrelevant.

The framework approach is different:

- The router (~300 words) classifies the task and budget first.
- Only the relevant reference card loads (~150 words).
- Everything else stays off the context window.
- The reference cards are **yours** — your tools, your process, your standards.

Every engineer on the team installs the same skill. Every agent follows the same
routing discipline and loads the same knowledge. Uniform behavior, minimal overhead.

## What You Customize

```
framework/
├── config.yaml          ← task types, budgets, evidence preferences
└── references/
    ├── debugging.md     ← your debug process (works out of the box)
    ├── exploration.md   ← how to navigate your codebase
    ├── implementation.md ← your implementation standards
    ├── code-review.md   ← your review checklist
    └── onboarding.md    ← how to orient in your repo
```

The reference files ship with solid defaults. They work immediately.
Improve them over time as your team learns what helps.

## Setup

**1. Copy the framework**

```bash
cp -r framework my-team-workflow
cd my-team-workflow
```

**2. Edit `config.yaml`**

Change the `name` field. Add or remove task types to match your team's work.
Point each type at the reference file your team cares about.

**3. Customize reference cards** *(optional — defaults work)*

Open any file in `references/`. Add your team's specific tools, log locations,
escalation paths, or coding standards. Keep each file under 200 words.

**4. Build**

```bash
node ../scripts/build-skill.mjs --config config.yaml
```

This generates `skills/my-team/SKILL.md` plus the reference files.

**5. Deploy**

```bash
# Claude Code
cp -r skills/my-team ~/.claude/skills/my-team

# Cursor — paste SKILL.md content into .cursorrules

# Codex / OpenAI agents — paste SKILL.md into AGENTS.md header
```

Restart your agent. The skill is active.

## Writing Good Reference Cards

Each card is loaded in full when its task type activates. Keep it:

- **Under 200 words** — longer cards defeat the purpose
- **Specific, not generic** — "check Datadog for errors" beats "check your monitoring"
- **Process-first** — describe the loop, not just the principles
- **Honest about waste** — list the patterns that burn tokens on your actual tasks

The reference files in `framework/references/` are working examples.

## Keeping Cards Current

Reference cards improve with use. When your team notices a pattern that saves time
or a waste pattern that keeps appearing:

```bash
# Edit the source card
vim framework/references/debugging.md

# Rebuild and redeploy
node scripts/build-skill.mjs --config framework/config.yaml
cp -r skills/my-team ~/.claude/skills/my-team
```

Commit the updated card to your repo. Everyone gets the improvement on next pull.

## Adding a New Task Type

1. Create `framework/references/my-task.md`
2. Add an entry to `config.yaml`:
   ```yaml
   task_types:
     - id: my-task
       reference: references/my-task.md
   ```
3. Rebuild and redeploy.

## Validation

```bash
node scripts/build-skill.mjs --config framework/config.yaml
```

The build script checks that all referenced files exist and warns if any card
exceeds 200 words.
