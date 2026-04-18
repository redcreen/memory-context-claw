# Roadmap

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## How To Read This Page

This page does only three jobs:

1. preserve the full stage order instead of deleting older stages
2. state which large stage is current now
3. link the current stage directly to the concrete [development plan](reference/unified-memory-core/development-plan.md)

The status meaning is fixed:

- `completed` = that stage is actually closed and the same work is not continued under another top-level stage
- `current large stage` = all remaining work for the current theme belongs here instead of being scattered across multiple umbrellas

If you only care about `Context Minor GC`, start here:

- [Stage 11: Context Minor GC And Codex Integration](#stage-11-context-minor-gc-and-codex-integration)
- [Stage 11 closeout report](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)
- [Context Minor GC architecture page](reference/unified-memory-core/architecture/context-minor-gc.md)

## Current One-Line Truth

The repo is no longer in a `Context Minor GC` closeout state.

- `Stage 11` is complete
- the current umbrella stage is now: `Stage 12: Realtime Memory Intent Productization`

What that means:

- `Context Minor GC` is now usable across both OpenClaw and Codex
- positive cases already show clear user-visible benefit
- the guarded seam remains `default-off` / opt-in only
- the next truly new workstream shifts to productizing realtime governed memory intake

## Stage Timeline

| Stage | Status | Theme | Meaning |
| --- | --- | --- | --- |
| Stage 1 | completed | design baseline | product boundaries, doc stack, and testing surfaces |
| Stage 2 | completed | local-first baseline | governed local-first baseline |
| Stage 3 | completed | self-learning lifecycle baseline | promotion / decay / learning governance |
| Stage 4 | completed | policy adaptation | governed learning starts affecting consumption behavior |
| Stage 5 | completed | product hardening | independent operation / split / reproducibility / release boundary |
| Stage 6 | completed | dialogue working-set shadow integration | runtime shadow measurement surface |
| Stage 7 | completed | context loading optimization closure | `Context Minor GC` formally entered the mainline and closed out |
| Stage 8 | completed | ordinary-conversation realtime-write latency closure | ordinary-conversation strict Docker A/B closed |
| Stage 9 | completed | guarded smart-path promotion | bounded opt-in active path closed while staying `default-off` |
| Stage 10 | completed | adoption simplification and shared-foundation proof | shortest adoption path and Codex / multi-instance shared proof |
| Stage 11 | completed | Context Minor GC and Codex integration | `Context Minor GC` closed across OpenClaw + Codex as a usable capability with clear user-visible gain |
| Stage 12 | current umbrella stage | realtime memory intent productization | turn realtime governed memory intake into a clearer product and operator surface |

## Stage 11: Context Minor GC And Codex Integration

`Stage 11` is now closed.

Its completion bar is no longer “can Minor GC run at all?” but:

- the full `Context Minor GC` path is usable
- users can feel a real benefit
- rollback boundaries remain explicit

### Stage 11 Completion Bar And Result

| Bar | Requirement | Result |
| --- | --- | --- |
| GC is usable | OpenClaw + Codex both consume the same decision contract / shadow / guarded seam | satisfied |
| User benefit is visible | positive cases show real prompt/context reduction without answer regressions | satisfied |
| Boundaries stay explicit | `default-off` / opt-in only remains true and rollout is not widened implicitly | satisfied |

### Stage 11 Final Group State

| Group | Status | Goal | Detailed Plan |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | completed | regroup Stage 6 / 7 / 9 Minor GC history into one readable stage narrative | [Plan: 11A](reference/unified-memory-core/development-plan.md#group-11a-foundation-reframe) |
| 11B `openclaw-baseline-hold` | completed | keep the OpenClaw-side `Context Minor GC` scorecard, harder matrix, and guarded boundary green and close the baseline formally | [Plan: 11B](reference/unified-memory-core/development-plan.md#group-11b-openclaw-baseline-hold) |
| 11C `codex-context-bridge` | completed | bring the same context decision / shadow / guarded / scorecard model into the Codex adapter | [Plan: 11C](reference/unified-memory-core/development-plan.md#group-11c-codex-context-bridge) |
| 11D `cross-host-rollout-decision` | completed | make the explicit cross-host decision: the capability is usable, but guarded remains `default-off` / opt-in only | [Plan: 11D](reference/unified-memory-core/development-plan.md#group-11d-cross-host-rollout-decision) |

### Stage 11 Closeout Evidence

- [Stage 7 / Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
- [Stage 7 `Context Minor GC` closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
- [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
- [Codex Context Minor GC Live Matrix](../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md)
- [Stage 11 closeout report](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)

## If You Only Want To Know “What Remains For Minor GC”

The shortest answer is:

- the Minor GC theme itself is complete
- both the OpenClaw and Codex sides are now closed
- what remains now is not “finish GC” but:
  - keep `Context Minor GC` evidence green
  - move into the next product stage for realtime memory intent productization

## Stage 12: Realtime Memory Intent Productization

`Stage 12` is the current umbrella stage. It owns one theme only:

- turn realtime governed memory intake from a baseline capability into a real product and operator surface

| Group | Status | Goal | Detailed Plan |
| --- | --- | --- | --- |
| 12A `contract-and-replay-hold` | current | consolidate the realtime `memory_intent` / `memory_extraction` / accepted-action contract, replay surface, and docs | [Plan: 12A](reference/unified-memory-core/development-plan.md#group-12a-contract-and-replay-hold) |
| 12B `ordinary-conversation-runtime-ingest` | next | bring ordinary-conversation and runtime rule ingestion onto the same governed realtime path | [Plan: 12B](reference/unified-memory-core/development-plan.md#group-12b-ordinary-conversation-runtime-ingest) |
| 12C `operator-surface-and-rollout` | later | turn inspect / audit / replay / rollback plus rollout boundaries into an explicit operator surface | [Plan: 12C](reference/unified-memory-core/development-plan.md#group-12c-operator-surface-and-rollout) |

## Reading Order

If you want to read in order, do not bounce between old reports first:

1. read this page and confirm that `Stage 11` is complete and `Stage 12` is current
2. if you care about `Minor GC`, read the [Stage 11 closeout report](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)
3. then read the [Context Minor GC architecture page](reference/unified-memory-core/architecture/context-minor-gc.md)
4. then read the [Stage 12 detailed plan](reference/unified-memory-core/development-plan.md#stage-12-realtime-memory-intent-productization)
5. only then drop into historical reports when needed:
   - [Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
   - [Stage 7 closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
   - [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
