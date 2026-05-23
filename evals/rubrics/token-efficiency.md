# Token Efficiency Rubric

Token efficiency is measured, not vibes.

## Primary Metrics

- total tokens
- input tokens
- output tokens
- cost
- file reads
- grep/search calls
- CodeGraph calls
- skill words loaded
- total tool calls

## Qualitative Waste Flags

- read whole file for known symbol
- repeated search synonyms without new evidence
- loaded multiple workflow references speculatively
- delegated broad exploration that duplicated indexed lookup
- continued exploring after next edit was clear

## Claim Threshold

Tokenwise must preserve success while reducing median total tokens versus
Superpowers. Initial target: 30% median reduction across at least five task
types.

