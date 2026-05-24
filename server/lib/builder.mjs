export function buildSkill(config) {
  const name = config.name || 'tokenwise';
  const taskTypes = config.task_types || [];
  const budgets = config.budgets || {};

  const refLines = taskTypes
    .map(t => `   - ${t.id}: \`references/${t.reference}.md\``)
    .join('\n');

  const budgetLines = Object.entries(budgets)
    .map(([k, v]) => `   - \`${k}\`: ${v}`)
    .join('\n');

  const displayName = name.charAt(0).toUpperCase() + name.slice(1);

  return `---
name: ${name}
description: Use when coding in unfamiliar or large repositories, when context or tool usage may be expensive, or when multiple workflow skills could apply.
---

# ${displayName}

Spend context only when it changes the next action.

## Runtime Router

1. Classify the task: \`answer\`, \`locate\`, \`debug\`, \`implement\`, \`review\`, \`plan\`, or a custom type.
2. Pick a budget:
${budgetLines}
3. Choose the cheapest reliable evidence:
   - structural code question: indexed graph lookup first
   - literal text question: \`rg\`
   - known file: read the smallest useful range
   - unknown area without an index: search before reading
4. Load at most one reference unless the task proves it needs more:
${refLines}
5. Stop expanding context once you can name the next edit, command, answer, or blocker.
6. Verify with the cheapest check that can catch the likely failure.

## Guardrails

- Do not load multiple heavy workflow skills speculatively.
- Do not read whole files when symbol or index lookup can answer.
- Do not spawn broad exploration agents when a single search can answer.
- Do not make token-savings claims without eval data.

## Output

When the task is non-trivial, report the budget, evidence path, and verification used.
`;
}
