# Dialogue Working-Set Stage 6

## Scope

- runtime shadow instrumentation landed in `ContextAssemblyEngine.assemble()` and stays `default-off`
- runtime shadow exports now capture `relation / evict / pins / reduction ratio` without mutating the final prompt
- answer-level replay now reuses those runtime exports instead of relying only on isolated helper snapshots

## Runtime Replay

- runtime shadow replay passed: `16/16`
- runtime shadow replay captured: `16`
- runtime shadow replay average reduction ratio: `0.4368`
- runtime shadow replay average elapsed ms: `18728.3`

## Answer A/B

- baseline passed: `5/5`
- shadow passed: `5/5`
- baseline only: `0`
- shadow only: `0`
- average prompt reduction ratio: `0.0114`

## Gate Decision

- Stage 6 runtime shadow integration is strong enough to keep as the new measurement surface.
- Keep the feature `default-off` and `shadow-only` in production-facing configs.
- Do not open any active prompt mutation experiment yet; keep promotion gated behind future real-session soak.
- Resume the previously deferred history cleanup and harder A/B expansion with the new shadow telemetry attached.

## Rollback Boundary

- rollback is configuration-only: set `dialogueWorkingSetShadow.enabled=false`
- shadow exports remain sidecar artifacts under the configured output dir
- current prompt assembly and builtin memory behavior remain unchanged in this stage

## Source Reports

- [dialogue-working-set-runtime-shadow-2026-04-16.md](dialogue-working-set-runtime-shadow-2026-04-16.md)
- [dialogue-working-set-runtime-answer-ab-2026-04-16.md](dialogue-working-set-runtime-answer-ab-2026-04-16.md)
- [dialogue-working-set-runtime-shadow-summary-2026-04-16.md](dialogue-working-set-runtime-shadow-summary-2026-04-16.md)
