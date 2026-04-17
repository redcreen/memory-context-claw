# Dialogue Working-Set Stage 7 And Stage 9

## Scope

- Stage 7 closes the scorecard and operator surface for per-turn context loading optimization.
- Stage 9 lands a guarded opt-in path that reuses the same LLM decision and keeps rollback configuration-only.

## Stage 7 Scorecard

- captured events: `16/16`
- guarded applied: `0`
- average raw reduction ratio: `0.4191`
- average package reduction ratio: `0.1151`
- average candidate-load elapsed ms: `0.0625`
- average decision elapsed ms: `15969.875`
- relation counts: `{"switch":7,"branch":5,"continue":3,"resolve":1}`

## Stage 9 Guarded Answer A/B

- baseline passed: `5/5`
- shadow passed: `5/5`
- guarded passed: `5/5`
- guarded applied: `2`
- guarded only: `0`
- guarded vs shadow wins: `0`
- average shadow prompt reduction ratio: `0.0587`
- average guarded prompt reduction ratio: `0.0424`

## Decision

- Stage 7 is strong enough to keep as the new operator-facing scorecard surface.
- Stage 9 guarded activation is now real, but remains opt-in and configuration-only.
- Broader promotion should still wait for the separate ordinary-conversation realtime-write latency closure.

