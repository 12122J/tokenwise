# Workflow Routing

Route by risk, not by habit.

## Task Routes

| Task | Primary workflow | Load more when |
| --- | --- | --- |
| Answer | exploration | sources are ambiguous |
| Locate | exploration | symbol and literal search disagree |
| Debug | debugging | root cause is unknown |
| Implement | implementation | behavior changes or tests are needed |
| Review | verification | the diff has user-facing or shared behavior |
| Plan | implementation + verification | scope is L/XL or dependencies are unclear |

## Skill Loading Rule

Load the narrowest workflow that changes behavior. A workflow skill earns its
tokens when it prevents a known failure mode: guessing, coding without tests,
reviewing without evidence, or broad reading without a stop condition.

## Budget Heuristics

- `S`: no plan unless asked; use direct evidence and one verification.
- `M`: short plan in the response; targeted tests.
- `L`: written mini-plan; impact analysis before edits.
- `XL`: design/spec before implementation; run eval-style measurement if the
  point is token savings.

