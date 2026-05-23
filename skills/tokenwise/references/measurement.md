# Measurement Policy

Tokenwise does not claim savings without data.

## Required Metrics

- `input_tokens`
- `output_tokens`
- `total_tokens`
- `cost_usd`
- `duration_ms`
- `tool_calls`
- `file_reads`
- `grep_calls`
- `codegraph_calls`
- `skill_words_loaded`
- `success`

## Savings Formula

```text
token_savings_pct =
  (baseline_total_tokens - variant_total_tokens) / baseline_total_tokens * 100
```

## Comparisons

Primary comparisons:

- Superpowers vs Tokenwise
- Superpowers vs Tokenwise + CodeGraph

Secondary comparisons:

- Control vs Tokenwise
- CodeGraph vs Tokenwise + CodeGraph

## Claim Gate

Do not publish a savings claim until at least five task types have repeatable
results and Tokenwise preserves task success.

