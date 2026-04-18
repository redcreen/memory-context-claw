# Roadmap

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## How To Read This Page

This page does only three jobs:

1. preserve the full stage order instead of deleting older stages
2. state which large stage is current now
3. link the latest stage directly to the concrete [development plan](reference/unified-memory-core/development-plan.md)

The status meaning is fixed:

- `completed` = that stage is actually closed and the same work is not continued under another top-level stage
- `current large stage` = all remaining work for the current theme belongs here instead of being scattered across multiple umbrellas

If you only care about `Context Minor GC`, start here:

- [Stage 11: Context Minor GC And Codex Integration](#stage-11-context-minor-gc-and-codex-integration)
- [Stage 11 detailed plan](reference/unified-memory-core/development-plan.md#stage-11-context-minor-gc-and-codex-integration)
- [Context Minor GC architecture page](reference/unified-memory-core/architecture/context-minor-gc.md)

## Current One-Line Truth

The repo is no longer in a “Stage 7 / 9 closeout” state. It has moved into a new umbrella stage:

- `Stage 11: Context Minor GC And Codex Integration`

That does not mean Stage 7 / 9 failed to close. It means:

- the already-finished Stage 7 / 9 themes remain preserved as historical stages
- all remaining Minor GC work is now grouped under one readable large stage
- the same context-decision / scorecard / rollback model now needs to be brought to Codex
- broader default-path rollout remains deferred until cross-host evidence is complete

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
| Stage 11 | current umbrella stage | Context Minor GC and Codex integration | all remaining Minor GC work is regrouped here and Codex integration becomes part of the formal plan |

## Stage 11: Context Minor GC And Codex Integration

Stage 11 is the current large stage. It is split into four groups:

| Group | Status | Goal | Detailed Plan |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | completed | regroup Stage 6 / 7 / 9 Minor GC history into one readable stage narrative | [Plan: 11A](reference/unified-memory-core/development-plan.md#group-11a-foundation-reframe) |
| 11B `openclaw-baseline-hold` | current | keep the OpenClaw-side `Context Minor GC` scorecard, harder matrix, and guarded boundary green over time | [Plan: 11B](reference/unified-memory-core/development-plan.md#group-11b-openclaw-baseline-hold) |
| 11C `codex-context-bridge` | next | bring the same context decision / shadow / guarded / scorecard model into the Codex adapter | [Plan: 11C](reference/unified-memory-core/development-plan.md#group-11c-codex-context-bridge) |
| 11D `cross-host-rollout-decision` | later | discuss broader default-path rollout only after OpenClaw + Codex evidence is both strong enough | [Plan: 11D](reference/unified-memory-core/development-plan.md#group-11d-cross-host-rollout-decision) |

### What Is Already Closed Inside Stage 11

These are no longer blockers:

- Stage 6 runtime shadow integration
- Stage 7 / Step 108
- Stage 7 / `104` harder live matrix
- Stage 9 guarded smart path

Supporting reports:

- [Stage 7 / Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
- [Stage 7 `Context Minor GC` closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
- [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)

### What Stage 11 Is Actually Doing Now

The current focus is no longer “prove Minor GC can run at all”. It is:

1. keep the OpenClaw `Context Minor GC` evidence green
2. move `Codex` integration into the same large stage instead of leaving it buried inside Stage 10 proof
3. keep broader rollout decisions explicitly deferred until cross-host evidence exists

## If You Only Want To Know “What Remains For Minor GC”

The shortest answer is:

- the OpenClaw-side Minor GC capability loop is already complete
- what remains is not “Minor GC itself is unfinished”
- what remains is:
  - Stage 11B: hold the OpenClaw operator baseline
  - Stage 11C: complete the Codex context bridge
  - Stage 11D: make a cross-host rollout decision

## Current / Next / Later

| Horizon | Focus | Exit Signal |
| --- | --- | --- |
| Current | Stage 11B: keep OpenClaw-side `Context Minor GC` and guarded baseline green | scorecard, harder matrix, and guarded live A/B do not regress |
| Next | Stage 11C: connect the Codex bridge to the same decision contract / shadow / guarded / scorecard | Codex adapter replay, tests, and cross-host report all align |
| Later | Stage 11D: decide whether any broader default-path rollout is justified | a formal rollout ADR / report exists instead of implicit widening |

## Reading Order

If you want to read in order, do not bounce between old reports first:

1. read this page and confirm the current umbrella stage is `Stage 11`
2. then read the [Stage 11 detailed plan](reference/unified-memory-core/development-plan.md#stage-11-context-minor-gc-and-codex-integration)
3. then read the [Context Minor GC architecture page](reference/unified-memory-core/architecture/context-minor-gc.md)
4. only then drop into historical reports when needed:
   - [Step 108 closeout](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
   - [Stage 7 closeout](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
   - [Stage 9 closeout](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
