# Dialogue Working-Set Validation

## Scope

- surface 1: turn-by-turn shadow replay
- surface 2: baseline-vs-shadow answer A/B
- surface 3: adversarial real-LLM decision replay
- runtime status: current production path unchanged; all validation is still isolated / shadow-first

## Summary

- shadow replay checkpoints passed: `9/9`
- shadow replay average raw reduction ratio: `0.5722`
- shadow replay average shadow-package reduction ratio: `0.2275`
- answer A/B baseline passed: `5/5`
- answer A/B shadow passed: `5/5`
- answer A/B both pass: `5`
- answer A/B shadow only: `0`
- answer A/B baseline only: `0`
- answer A/B average estimated prompt reduction ratio: `0.0636`
- adversarial cases passed: `7/7`
- adversarial aggregate reduction ratio: `0.3088`

## Interpretation

- The direction is strong enough to move into runtime shadow integration.
- The evidence still does not justify a full production cutover.
- The next safe step is instrumentation on the real runtime, not replacing the current prompt path.

## Recommendation

1. Start a minimal runtime shadow integration that records `relation / evict / pins / reduction ratio` but does not alter the final prompt.
2. Keep answer-level regression measurement attached to that shadow path.
3. Do not promote working-set pruning into active prompt assembly until shadow telemetry stays green on real sessions.

## Source Reports

- [dialogue-working-set-shadow-replay-2026-04-16.md](dialogue-working-set-shadow-replay-2026-04-16.md)
- [dialogue-working-set-answer-ab-2026-04-16.md](dialogue-working-set-answer-ab-2026-04-16.md)
- [dialogue-working-set-adversarial-2026-04-16.md](dialogue-working-set-adversarial-2026-04-16.md)
- [dialogue-working-set-pruning-feasibility-2026-04-16.md](dialogue-working-set-pruning-feasibility-2026-04-16.md)

