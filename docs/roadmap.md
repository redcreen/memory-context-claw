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


Detailed execution queue:

- [unified-memory-core/development-plan.md](reference/unified-memory-core/development-plan.md)

## Current One-Line Truth

The repo has now also formally closed `Stage 12`. All defined numbered stages are complete, and the repo is operating in post-Stage-12 maintenance.

- `Stage 11` is completed
- `Stage 12` is completed
- the current operating phase is now: `post-stage12-product-maintenance`
- `Context Minor GC` remains one of the long-running optimization tracks even after closeout

What that means:

- `Context Minor GC` is now usable across both OpenClaw and Codex
- the OpenClaw-side user-visible closeout evidence is now covered
- the OpenClaw guarded seam is now on by default while shadow remains `default-off`
- the product mainline is now maintenance / release / operator-proof hold rather than a new numbered stage

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
| Stage 9 | completed | guarded smart-path promotion | bounded active path closed; in maintenance it now ships default-on for OpenClaw |
| Stage 10 | completed | adoption simplification and shared-foundation proof | shortest adoption path and Codex / multi-instance shared proof |
| Stage 11 | completed | Context Minor GC and Codex integration | the full capability is usable and the OpenClaw-side host-visible closeout is now covered |
| Stage 12 | completed | realtime memory intent productization | realtime governed memory intake is now a formal product and operator surface |

## Stage 11: Context Minor GC And Codex Integration

`Stage 11` is now completed.

Its completion bar is no longer “can Minor GC run at all?” but:

- the full `Context Minor GC` path is usable
- users can feel a real benefit
- rollback boundaries remain explicit

### Stage 11 Completion Bar And Result

| Bar | Requirement | Result |
| --- | --- | --- |
| GC is usable | OpenClaw + Codex both consume the same decision contract / shadow / guarded seam | satisfied |
| User benefit is visible | positive cases show real prompt/context reduction, and the OpenClaw long-session threshold A/B proves that guarded can pull prompt size back below a practical compact danger line without manual `compact` | satisfied |
| Boundaries stay explicit | shadow stays `default-off`; guarded is default-on but still bounded by narrow relation / reduction / eviction checks | satisfied |

### Stage 11 Final Group State

| Group | Status | Goal | Detailed Plan |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | completed | regroup Stage 6 / 7 / 9 Minor GC history into one readable stage narrative | [Plan: 11A](reference/unified-memory-core/development-plan.md#group-11a-foundation-reframe) |
| 11B `openclaw-baseline-hold` | completed | keep the OpenClaw-side `Context Minor GC` scorecard, harder matrix, and guarded boundary green and close the baseline formally | [Plan: 11B](reference/unified-memory-core/development-plan.md#group-11b-openclaw-baseline-hold) |
| 11C `codex-context-bridge` | completed | bring the same context decision / shadow / guarded / scorecard model into the Codex adapter | [Plan: 11C](reference/unified-memory-core/development-plan.md#group-11c-codex-context-bridge) |
| 11D `cross-host-rollout-decision` | completed but interpretation corrected | make the explicit cross-host decision: the capability is usable while the earlier user-visible conclusion is rolled back | [Plan: 11D](reference/unified-memory-core/development-plan.md#group-11d-cross-host-rollout-decision) |
| 11E `growth-source-control` | completed | stop active-thread growth from diagnostics and long outputs | [Plan: 11E](reference/unified-memory-core/development-plan.md#group-11e-growth-source-control) |
| 11F `summary-first-carry-forward` | completed | move project-layer carry-forward to summary-first task-state | [Plan: 11F](reference/unified-memory-core/development-plan.md#group-11f-summary-first-carry-forward) |
| 11G `host-visible-validation-and-closeout` | completed | finish a corrected closeout around user-visible experience | [Plan: 11G](reference/unified-memory-core/development-plan.md#group-11g-host-visible-validation-and-closeout) |

### Stage 11 Closeout Evidence

- [Stage 7 / Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
- [Stage 7 `Context Minor GC` closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
- [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
- [Codex Context Minor GC Live Matrix](../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md)
- [Stage 11 closeout report](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)
- [OpenClaw Near-Compaction Threshold Docker A/B](../reports/generated/openclaw-guarded-session-probe-threshold-docker-2026-04-19.md)

## If You Only Want To Know “What Remains For Minor GC”

The shortest answer is:

- the core Minor GC capability is already complete
- both the OpenClaw and Codex capability paths are already proven
- the Stage 11 user-visible bar is now met on the OpenClaw closeout surface
- Minor GC still continues as an optimization line, but it no longer blocks Stage 12

## Stage 12: Realtime Memory Intent Productization

`Stage 12` is now completed. Its closeout bar was:

- realtime `memory_intent` / `memory_extraction` / accepted-action can no longer remain scattered capabilities
- contract, replay, ordinary-conversation runtime ingest, and accepted-action host proof have to land as one product line
- maintainers need one explicit proof entrypoint instead of stitching together old commands and reports

At the same time, one long-running constraint remains true:

- `Context Minor GC` is already closed as a stage, but it remains one of the ongoing optimization tracks for prompt thickness, rollback after topic switches, answer latency, and operator simplicity

| Group | Status | Goal | Detailed Plan |
| --- | --- | --- | --- |
| 12A `contract-and-replay-hold` | completed | consolidate the realtime `memory_intent` / `memory_extraction` / accepted-action contract, replay surface, and docs | [Plan: 12A](reference/unified-memory-core/development-plan.md#group-12a-contract-and-replay-hold) |
| 12B `ordinary-conversation-runtime-ingest` | completed | bring ordinary-conversation and runtime rule ingestion onto the same governed realtime path | [Plan: 12B](reference/unified-memory-core/development-plan.md#group-12b-ordinary-conversation-runtime-ingest) |
| 12C `operator-surface-and-rollout` | completed | turn inspect / audit / replay / rollback plus rollout boundaries into an explicit operator surface | [Plan: 12C](reference/unified-memory-core/development-plan.md#group-12c-operator-surface-and-rollout) |

### Stage 12 Closeout Evidence

- [Stage 12 closeout report](../reports/generated/stage12-realtime-memory-intent-productization-closeout-2026-04-19.md)
- [OpenClaw Ordinary-Conversation Strict Closeout](../reports/generated/openclaw-ordinary-conversation-memory-intent-closeout-2026-04-17.md)
- [OpenClaw Accepted-Action Host Canary](../reports/generated/openclaw-accepted-action-canary-2026-04-15.md)

## Reading Order

If you want to read in order, do not bounce between old reports first:

1. read this page and confirm that `Stage 12` is also closed and the repo is now in maintenance
2. if you care about `Minor GC`, read the [Stage 11 closeout report](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)
3. then read the [Context Minor GC architecture page](reference/unified-memory-core/architecture/context-minor-gc.md)
4. then read the [Stage 11 detailed plan](reference/unified-memory-core/development-plan.md#stage-11-context-minor-gc-and-codex-integration)
5. then read the [Stage 12 detailed plan](reference/unified-memory-core/development-plan.md#stage-12-realtime-memory-intent-productization)
6. then read the [Stage 12 closeout report](../reports/generated/stage12-realtime-memory-intent-productization-closeout-2026-04-19.md)
7. only then drop into historical reports when needed:
   - [Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
   - [Stage 7 closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
   - [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)

## Overall Progress
| Item | Current Value |
| --- | --- |
| Overall Progress | all defined numbered stages complete |
| Current Phase | `post-stage12-product-maintenance` |
| Active Slice | `n/a` |
| Current Objective | keep Stage 5 / 10 / 11 / 12 proof surfaces, release path, and Minor GC optimization evidence green |
| Active Slice Exit Signal | n/a |
| Clear Next Move | hold maintenance / release / operator-proof baseline; only open a new stage for a new explicit product goal |
| Next Candidate Slice | `n/a` |

See the detailed execution plan: [project-assistant/development-plan.md](reference/project-assistant/development-plan.md)

## Current / Next / Later
| Horizon | Focus | Exit Signal |
| --- | --- | --- |
| Current | Keep Stage 5 / 10 / 11 / 12 proof surfaces and the release path green | current product state remains stable and reproducible |
| Next | Keep improving Minor GC prompt thickness, rollback after switches, latency, and operator simplicity as an optimization track | refreshed scorecards, threshold probes, and host-visible evidence stay green |
| Later | Open a new numbered stage only under a new explicit product goal | explicit goal, rollout boundary, and matching evidence |

## Milestone Rules
- one milestone = one clear theme-level goal
- `done` means the milestone is actually complete
- do not split the same work theme across multiple top-level milestones
- put sub-steps in the development plan, not in overlapping roadmap rows
