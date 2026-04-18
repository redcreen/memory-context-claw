# Roadmap

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## Scope

This page is the stable roadmap wrapper for the repo. It answers:

- where the current mainline actually landed
- how to read `Context Minor GC` in order
- what remains after Minor GC closeout

Live execution state still belongs to:

- [../.codex/status.md](../.codex/status.md)
- [../.codex/plan.md](../.codex/plan.md)

Detailed queues live here:

- [reference/unified-memory-core/development-plan.md](reference/unified-memory-core/development-plan.md)

## Current Truth

| Item | Current State |
| --- | --- |
| `Context Minor GC` | closed; no longer the current blocker |
| Stage 7 / Step 108 | completed: the plugin-owned decision runner landed without modifying OpenClaw core |
| Stage 7 / `104` harder eval matrix | completed: live matrix `6 / 6` |
| Stage 9 guarded smart path | completed: live A/B baseline `4 / 4`, guarded `4 / 4`, while staying `default-off` / opt-in only |
| Current phase | `post-stage10-adoption-closeout` |
| Active slice | `hold-stage10-adoption-proof-stable` |
| Current objective | keep Docker hermetic baseline, Stage 10 shortest-path / shared-foundation proof, and the `Context Minor GC` operator scorecard green |
| Next candidate slice | `formalize-realtime-memory-intent-ingestion` |

Short version:

`Minor GC` is already past capability closeout. What remains is not “can it run?” but “keep it stable, keep the guarded boundary intact, and move to the next product slice.”

## If You Only Care About Minor GC, Read In This Order

1. [Context Minor GC architecture page](reference/unified-memory-core/architecture/context-minor-gc.md)
   - concept boundaries, what is done, and what remains
2. [Stage 7 / Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
   - how the decision transport was untied without modifying OpenClaw core
3. [Stage 7 `Context Minor GC` closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
   - why Stage 7 is formally closed
4. [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
   - why guarded smart path is closed while still remaining `default-off`
5. [Development plan](reference/unified-memory-core/development-plan.md)
   - what is actually next after Minor GC

## Context Minor GC Status

- Stage 6 `dialogue working-set shadow`: completed, still `default-off` + shadow-only
- Stage 7 scorecard: captured `16 / 16`
- Stage 7 average raw reduction ratio: `0.4191`
- Stage 7 / Step 108: completed
  - hermetic gateway captured `5 / 5`
  - local service smoke captured `3 / 3`
- Stage 7 / `104` harder live matrix: `6 / 6`
  - captured `6 / 6`
  - relation `6 / 6`
  - reduction `6 / 6`
- Stage 9 guarded live A/B: completed
  - baseline `4 / 4`
  - guarded `4 / 4`
  - guarded applied `2 / 4`
  - activation matched `4 / 4`
  - false activations `0`
  - missed activations `0`

Interpretation:

- the Minor GC capability loop is closed
- it was not widened into a default active path
- that is a deliberate product boundary, not an unfinished closeout

## Current / Next / Later

| Time Horizon | Focus | Exit Signal |
| --- | --- | --- |
| Current | maintenance mode: keep Docker hermetic baseline, Stage 10 shortest-path adoption, shared-foundation proof, and `Context Minor GC` scorecard green | new changes do not regress Stage 7 / 9 / 10 evidence |
| Next | turn “main reply + `memory_extraction`” into a formal product contract and add a governed realtime ingest path for ordinary-conversation rules | replay gates, admission routing, adapter tests, and docs all align |
| Later | run `legacy / unified / bootstrap / retrieval` attribution on the same core case set | users can clearly see which gains come from native behavior, which from the extension, and which from bootstrap inputs |

## Current Review Verdict

- Done:
  - Stage 7 `Context Minor GC` is closed
  - Step 108 is closed
  - Stage 9 guarded smart path is closed
  - Stage 10 adoption / shared-foundation proof is closed
- Keep steady:
  - `Context Minor GC` operator scorecard stays green
  - Docker remains the default hermetic A/B surface
  - guarded seam remains `default-off` / opt-in only
- Not being pursued right now:
  - widening guarded path into default active prompt mutation
  - changing OpenClaw builtin memory behavior
  - reopening “can Minor GC run at all?”

## Three User-Facing Promises And Current Milestones

| Promise | Already Landed | Current Evidence Surface | What Actually Remains |
| --- | --- | --- | --- |
| `Light and fast` | fact-first assembly, runtime shadow, `Context Minor GC` closeout, Docker hermetic eval | Stage 7 closeout, harder matrix `6 / 6`, Stage 9 live A/B | keep “light and fast” green instead of reopening Stage 7; any broader default-path rollout must be a new explicit product decision |
| `Smart` | realtime / nightly learning, working-set pruning, guarded smart path | ordinary-conversation strict closeout, Stage 9 closeout | the real next work is `memory_extraction` / governed ingest, not backfilling Minor GC basics |
| `Reassuring` | `umc` CLI, inspect / audit / replay / rollback, shared foundation | Stage 10 closeout, release-preflight, Docker hermetic baseline | keep the operator surface readable, runnable, and replayable |
