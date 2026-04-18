# unified-memory-core Development Plan

[English](development-plan.md) | [中文](development-plan.zh-CN.md)

## Purpose

This document is the durable maintainer-facing execution plan that sits below `docs/roadmap.md` and above the AI control surfaces.

It answers one practical question:

`what should happen next, where should maintainers resume, and what detail sits underneath each roadmap milestone?`

## Related Documents

- [../../roadmap.md](../../roadmap.md)
- [../../architecture.md](../../architecture.md)
- [../../test-plan.md](../../test-plan.md)

## How To Use This Plan

1. Read the roadmap first to understand overall progress and the next stage.
2. Read `Overall Progress`, `Execution Task Progress`, and `Ordered Execution Queue` here to know where to resume.
3. Only drop into the internal control docs when you are maintaining the automation itself.

This document follows the same rule as the roadmap:

- a roadmap stage marked `completed` is actually closed
- the development plan does not continue the same theme under another top-level stage
- if work remains, it moves into a new umbrella stage with an explicit boundary against the historical stages

## Overall Progress

| Item | Current Value |
| --- | --- |
| Current Umbrella Stage | `stage12-realtime-memory-intent-productization` |
| Current Group | `group-12a-contract-and-replay-hold` |
| Stage Progress | `0 / 3` groups completed |
| Current Objective | turn realtime governed memory intake from a baseline capability into a clear product and operator surface |
| Current Constraint | `Context Minor GC` is already closed; keep the guarded seam `default-off` / opt-in only and do not change OpenClaw builtin memory behavior |
| Stage Transition Signal | the realtime contract, runtime ingest path, and operator surface all converge into one product-facing line |
| Next Group | `group-12b-ordinary-conversation-runtime-ingest` |

## Current Position

| Item | Current Value | Meaning |
| --- | --- | --- |
| Current Phase | `Stage 12` | Current umbrella stage |
| Current Group | `12A contract-and-replay-hold` | The group that is active now |
| Current Execution Line | consolidate the realtime `memory_intent` / `memory_extraction` / accepted-action contract, replay surface, and operator language while keeping `Context Minor GC` evidence green | What the repo is actually doing now |
| Validation | Stage 11 closeout, memory-intent replay suite, OpenClaw / Codex adapters, Docker hermetic baseline, and Stage 10 shortest-path/shared-foundation proof | The evidence that must remain true |

## Minor GC Quick Truth

If you only care about `Context Minor GC`, keep these four facts in mind:

1. `Stage 11` is closed.
2. The OpenClaw live matrix is `6 / 6`, and the Codex live matrix is `4 / 4`.
3. Positive cases already show clear prompt/context reduction while guarded remains `default-off` / opt-in only.
4. `Minor GC` is no longer the current development stage; the new work is `Stage 12` realtime memory intent productization.

Recommended reading order:

1. [../../roadmap.md](../../roadmap.md)
2. [architecture/context-minor-gc.md](architecture/context-minor-gc.md)
3. [../../../../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md](../../../../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.md)
4. [../../../../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md](../../../../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.md)
5. [../../../../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md](../../../../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.md)
6. [../../../../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md](../../../../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md)
7. [../../../../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md](../../../../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md)

## Stage 11 Final Group State

| Group | Status | Goal | Validation |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | completed | regroup Stage 6 / 7 / 9 Minor GC history into one readable umbrella-stage narrative | roadmap / development plan / minor-gc docs aligned |
| 11B `openclaw-baseline-hold` | completed | keep the OpenClaw-side `Context Minor GC` scorecard, harder matrix, and guarded live A/B green and close the baseline formally | Stage 7 scorecard, Step 108, `104` harder matrix, Stage 9 live A/B |
| 11C `codex-context-bridge` | completed | connect the same decision contract / shadow / guarded / scorecard model to the Codex adapter | Codex adapter tests, live matrix, cross-host report |
| 11D `cross-host-rollout-decision` | completed | make the explicit cross-host decision: GC is usable and beneficial, while guarded stays `default-off` / opt-in only | Stage 11 closeout report, rollback boundary, operator decision |

## Stage 12 Group Progress

| Group | Status | Goal | Validation |
| --- | --- | --- | --- |
| 12A `contract-and-replay-hold` | current | consolidate the realtime `memory_intent` / `memory_extraction` / accepted-action contract, replay surface, and product language | replay suite, architecture docs, adapter tests, operator wording |
| 12B `ordinary-conversation-runtime-ingest` | next | bring ordinary-conversation and runtime rule ingestion onto the same governed realtime path | live A/B, runtime hooks, ordinary-conversation regression |
| 12C `operator-surface-and-rollout` | later | turn inspect / audit / replay / rollback plus rollout boundaries into an explicit operator surface | CLI surface, docs, rollout report |

## Milestone Overview

| Milestone | Status | Goal | Depends On | Exit Criteria |
| --- | --- | --- | --- | --- |
| Stage 1: design baseline | completed | freeze product naming, boundaries, and document stack | none | architecture, module boundaries, and testing surfaces are aligned |
| Stage 2: local-first baseline | completed | ship one governed local-first end-to-end baseline | Stage 1 | core modules, adapters, standalone CLI, and governance all run |
| Stage 3: self-learning lifecycle baseline | completed | turn the already-implemented reflection baseline into an explicit lifecycle with promotion, decay, and learning-specific governance | Stage 2 | promotion / decay expectations, learning governance, OpenClaw validation, and local governed loop are all implemented and regression-protected |
| Stage 4: policy adaptation | completed | let governed learning outputs influence consumer behavior | Stage 3 | one reversible policy-adaptation loop is proven |
| Stage 5: product hardening | completed | validate split-ready and independent-product operation | Stage 4 | release boundary, reproducibility, maintenance workflows, and split rehearsal are all CLI-verifiable |
| Stage 6: dialogue working-set shadow integration | completed | validate and instrument hot-session working-set pruning in runtime shadow mode before any active prompt cutover | Stage 5 | runtime shadow telemetry is now landed default-off, replayable exports exist, and answer-level replay stays green enough to keep the feature shadow-only |
| Stage 7: context loading optimization closure | completed | make per-turn context loading optimization a formal mainline and formal gate instead of leaving it at shadow findings | Stage 6 | the context-optimization scorecard is stable, harder replay / Docker / local evidence align, and rollout/rollback boundaries are clear |
| Stage 8: ordinary-conversation realtime-write latency closure | completed | recover the clean Docker write-side answer path into a trustworthy ordinary-conversation strict A/B surface | Stage 7 | the ordinary-conversation hermetic strict closeout now reports `40 / 40 vs 15 / 40` with `preCaseResetFailed = 0` |
| Stage 9: guarded smart-path promotion | completed | start turning context optimization into real user-facing value without breaking rollback safety | Stage 8 | the bounded opt-in path now has live A/B evidence, an operable rollback path, and remains `default-off` / opt-in only |
| Stage 10: adoption simplification and shared-foundation proof | completed | lift adoption experience and cross-host product proof to the same level as core capability | Stage 9 | `npm run umc:stage10 -- --format markdown` is the shortest maintainer path and Codex / multi-instance shared proof is public and reproducible |
| Stage 11: Context Minor GC and Codex integration | completed | close `Context Minor GC` across OpenClaw + Codex under a single readable stage | Stage 10 | the full GC path is usable, the user can feel the gain, and rollout boundaries stay explicit |
| Stage 12: realtime memory intent productization | current umbrella stage | turn realtime governed memory intake into a clearer product and operator surface | Stage 11 | the realtime contract, runtime path, and operator surface all converge into one product-facing line |

## Stage 11: Context Minor GC And Codex Integration

`Stage 11` is now closed. Three ideas define it:

1. Stage 6 / 7 / 9 Minor GC history remains preserved, and each of those stages keeps its own completed historical meaning.
2. `Stage 11` gathered the OpenClaw baseline, the Codex bridge, and the cross-host decision into one readable theme and closed it.
3. Default-path widening did not happen implicitly; the explicit decision is still to keep guarded `default-off` / opt-in only.

### Group 11A: Foundation Reframe

- Status: completed
- Goal: turn the previously scattered Minor GC work into one readable umbrella-stage narrative
- Done:
  - roadmap / development plan / minor-gc docs now point to the same reading order
  - `Context Minor GC` is now documented as “closed core capability + later cross-host expansion”
- Exit criteria: maintainers no longer need to guess current state from old reports

### Group 11B: OpenClaw Baseline Hold

- Status: completed
- Goal: keep the OpenClaw-side `Context Minor GC` baseline green
- Evidence:
  - Stage 7 scorecard
  - Step 108 closeout
  - Stage 7 / `104` harder live matrix
  - Stage 9 guarded live A/B
- Exit criteria: satisfied

### Group 11C: Codex Context Bridge

- Status: completed
- Goal: bring the OpenClaw-proven context decision contract into the Codex adapter
- Scope:
  - Codex-side shadow / guarded / scorecard contract
  - mapping between Codex transcript/task boundaries and `Context Minor GC`
  - cross-host comparison report
- Validation:
  - adapter tests
  - live matrix `4 / 4`
  - cross-host closeout report
- Exit criteria: satisfied

### Group 11D: Cross-Host Rollout Decision

- Status: completed
- Goal: make the explicit cross-host decision once the OpenClaw + Codex evidence exists
- Decision:
  - `Context Minor GC` is now treated as a usable capability
  - Stage 11 closes
  - the guarded seam remains `default-off` / opt-in only
- Exit criteria: satisfied

## Stage 12: Realtime Memory Intent Productization

This is the current umbrella stage. It owns one theme only:

- turn realtime governed memory intake from a baseline capability into a clearer product and operator surface

### Group 12A: Contract And Replay Hold

- Status: current
- Goal: consolidate the realtime `memory_intent` / `memory_extraction` / accepted-action contract, replay surface, and operator language into one product line
- Validation:
  - replay suite
  - architecture docs
  - adapter tests
  - clear operator wording

### Group 12B: Ordinary Conversation Runtime Ingest

- Status: next
- Goal: bring ordinary-conversation and runtime rule ingestion onto the same governed realtime path
- Validation:
  - ordinary-conversation live A/B
  - runtime hook regression
  - governed ingest report

### Group 12C: Operator Surface And Rollout

- Status: later
- Goal: turn inspect / audit / replay / rollback plus rollout boundaries into an explicit operator surface
- Validation:
  - CLI surface
  - docs
  - rollout report

## Historical Slices And Backlog

The long queue below is preserved as history and backlog. It is no longer the best place for a human to start reading.
The best place to resume is now `Stage 12`, plus the `Stage 11` closeout result.

## Ordered Execution Queue

| Order | Slice | Status | Objective | Validation |
| --- | --- | --- | --- | --- |
| 1 | `build-openclaw-cli-100-case-benchmark` | earlier slice | 把当前 `20` 案例扩展成 `100+` OpenClaw CLI benchmark，覆盖稳定事实、普通检索、当前态覆盖、负向拒答、冲突事实、连续更新和跨来源归因 | 100+` 案例定义文档、机器可读结果、人工可读报告、可重复运行入口 |
| 2 | `plan-200-case-benchmark-and-main-path-performance` | earlier slice | 把当前 `187` case 评测面 review 成更全面的 `200` case 计划，并为 retrieval / assembly / answer-level 主链路建立性能专项计划 | roadmap / development plan / control surface 同步，明确中文案例 `>= 50%`、coverage review 方法、主链路 perf baseline 入口 |
| 3 | `execute-200-case-benchmark-and-answer-path-triage` | earlier slice | 把 benchmark 从 `187` 扩成 coverage-first 的 `200+` case，真正把中文做到 `50%`，并把 answer-level host path red line 与 transport watchlist 变成正式门禁 | 200+` case 定义、中文案例实际占比统计、answer-level gate 报告、transport watchlist 报告、main-path perf baseline refresh |
| 4 | `expand-answer-level-formal-gate-after-natural-zh-hardening` | earlier slice | 在自然中文覆盖、raw transport watchlist 和 main-path perf baseline 已重新稳定的前提下，把 isolated local answer-level formal gate 从 `6` 条代表性样本继续扩成更大的稳定矩阵 | 更大的 isolated local answer-level gate 报告、与 raw transport watchlist 分离的归因、中文 answer-level 子矩阵持续为绿、main-path perf baseline 重跑 |
| 5 | `deepen-answer-level-gate-beyond-12-case-baseline` | earlier slice | 在 `12 / 12` isolated local answer-level formal gate 已稳定的基础上，继续补强 cross-source、conflict、multi-step history 和更深的自然中文 answer-level coverage | 更深 answer-level gate 报告、control-surface 更新、与 transport watchlist 分离的结论、main-path perf baseline refresh |
| 6 | `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains` | earlier slice | shared-fail history cleanup 已完成；下一步把更多 harder cases 推成 Memory Core 独占胜场 | builtin-only regression fix、shared-fail history closure、下一轮 live A/B 设计、full regression / perf / A/B rerun |
| 7 | `finish-context-loading-optimization-first` | historical closed slice | historical slice: finish the `light and fast / context loading optimization` closeout and write Stage 7 scorecard, operator metrics, and rollback boundary into durable docs | Stage 7 scorecard, Stage 7 closeout report, roadmap / development plan / architecture docs aligned |
| 8 | `design-harder-context-minor-gc-matrix` | historical closed slice | historical slice: complete the `Context Minor GC` harder eval matrix and formally close Stage 7 | `104` harder eval matrix, rerun the same operator scorecard, Stage 7 closeout report |
| 9 | `prepare-stage10-adoption-simplification-and-shared-foundation-proof` | historical closed slice | historical slice: complete Stage 10 adoption / bootstrap / verify / shared-foundation proof | Stage 10 plan steps `121-126`, shortest-path install proof, package/startup/first-run metrics, Codex / multi-instance evidence |
| 10 | `hold-stage10-adoption-proof-stable` | historical maintenance slice | keep the Stage 10 shortest operator path, package/startup/first-run evidence, and Codex / multi-instance shared-foundation proof green; also keep `Context Minor GC` and guarded seam evidence from regressing | `npm run umc:stage10 -- --format markdown`, README / roadmap / development plan / `.codex/*`, Stage 10 closeout reports |
| 11 | `formalize-realtime-memory-intent-ingestion` | historical precursor to the current Stage 12 theme | turn “main reply + `memory_extraction`” into a formal product contract and add governed realtime ingest for ordinary-conversation rules | replay suite, Codex adapter tests, architecture docs, development plan, control-surface state |
| 12 | `attribute-memory-capability-sources` | next / queued | 对同一批核心案例做 `legacy / unified / bootstrap / retrieval` 对照，明确答案来源和扩展增益边界 | A/B 对照报告、关键案例证据、来源分类说明 |
| 13 | `turn-failures-into-algorithm-iterations` | next / queued | 把 benchmark 失败案例转成 retrieval / assembly / policy 算法问题清单，并按轮次修复、复测、提交 | 每轮失败清单、对应修复、复测结果、GitHub commit |
| 14 | `close-stage5-product-hardening-and-independent-operation` | next / queued | 一口气收掉 `Step 39-46`，把 source hardening、maintenance、reproducibility、release-boundary、split rehearsal、independent review 全部接到 CLI-first 证据面 | Stage 5 targeted tests、`npm run umc:stage5`、`npm run umc:cli -- maintenance run`、`npm run umc:cli -- export reproducibility`、`npm run umc:cli -- review split-rehearsal |
| 15 | `hold-stage5-product-hardening-stable` | next / queued | 保持 Stage 5 acceptance、maintenance、reproducibility、split rehearsal 证据面持续稳定 | npm run umc:stage5`、`npm run umc:acceptance`、`npm run umc:openclaw-itest`、full `npm test |
| 16 | `close-release-preflight-cli-and-deployment-verification` | next / queued | 把真实 bundle install、deployment verification、release-preflight 一键门禁全部 CLI 化，并把仓库状态推进到“只等人类验收” | npm run umc:build-bundle`、`npm run umc:openclaw-install-verify`、`npm run umc:release-preflight`、`npm run umc:cli -- verify openclaw-install |
| 17 | `hold-release-preflight-evidence-stable` | next / queued | 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿 | npm run umc:release-preflight`、`npm run umc:openclaw-install-verify`、`npm run umc:openclaw-itest`、`npm run umc:stage5 |
| 18 | `close-host-neutral-root-cutover-gate-policy` | next / queued | 基于 live topology、migration recommendation 和 split rehearsal，把 canonical root cutover 与 gate rule 写成显式 operator policy | npm run umc:cli -- registry inspect --format markdown`、`npm run umc:cli -- registry migrate --format markdown`、`npm run umc:cli -- review split-rehearsal --format markdown |
| 19 | `hold-host-neutral-root-policy-stable` | next / queued | 保持 canonical root adoption 规则稳定，不让 later changes 把 legacy divergence 重新包装成 hard gate | npm run umc:cli -- registry inspect --format markdown`、configuration docs、control-surface status |
| 20 | `hold-post-stage5-roadmap-state-aligned` | next / queued | 保持 project/workstream roadmap 摘要、Stage 5 closeout 证据和 later-phase gate 在同一条 operator baseline 上 | npm run smoke:eval -- --format markdown`、`npm run smoke:eval:critical -- --format markdown`、`npm run eval:memory-search:cases -- --skip-builtin --format json`、project/workstream roadmap、control-surface status |
| 21 | `define-deeper-accepted-action-extraction-todo` | next / queued | 把 accepted-action 的更深抽取规则、分层准入、负向路径和治理覆盖明确写成 deferred enhancement queue，而不是继续隐含在聊天里 | self-learning architecture / roadmap / development plan 与 `.codex/*` 对齐；TODO 只定义后续实现，不误报成当前 baseline 已完成 |
| 22 | `implement-step47-field-aware-accepted-action-extraction` | next / queued | 落地 deferred queue 的 Step 47，让 accepted_action 基于结构化字段拆出 `target_fact`、显式 `operating_rule`、`outcome_artifact` 候选，而不是继续只产出一条保守摘要 | accepted_action source/reflection/CLI tests、`npm test`、`npm run verify`、`npm run umc:cli -- reflect run ... --source-type accepted_action`、`npm run umc:cli -- learn lifecycle-run ... --source-type accepted_action |
| 23 | `hook-openclaw-after-tool-call-into-accepted-action-learning` | next / queued | 把 OpenClaw 侧真正可用的异步 runtime seam 接上 governed accepted-action intake，让显式结构化 tool result 能直接进入 source -> reflection -> promotion 闭环 | OpenClaw hook regression tests、full `npm test`、`npm run verify`、本机部署后宿主侧 after_tool_call 模拟 |

## Milestone Details

### Stage 1: design baseline

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | freeze product naming, boundaries, and document stack |
| Depends On | none |
| Exit Criteria | architecture, module boundaries, and testing surfaces are aligned |

### Stage 2: local-first baseline

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | ship one governed local-first end-to-end baseline |
| Depends On | Stage 1 |
| Exit Criteria | core modules, adapters, standalone CLI, and governance all run |

### Stage 3: self-learning lifecycle baseline

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | turn the already-implemented reflection baseline into an explicit lifecycle with promotion, decay, and learning-specific governance |
| Depends On | Stage 2 |
| Exit Criteria | promotion / decay expectations, learning governance, OpenClaw validation, and local governed loop are all implemented and regression-protected |

### Stage 4: policy adaptation

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | let governed learning outputs influence consumer behavior |
| Depends On | Stage 3 |
| Exit Criteria | one reversible policy-adaptation loop is proven |

### Stage 5: product hardening

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | validate split-ready and independent-product operation |
| Depends On | Stage 4 |
| Exit Criteria | release boundary, reproducibility, maintenance workflows, and split rehearsal are all CLI-verifiable |

### Stage 6: dialogue working-set shadow integration

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | validate and instrument hot-session working-set pruning in runtime shadow mode before any active prompt cutover |
| Depends On | Stage 5 |
| Exit Criteria | runtime shadow telemetry is now landed default-off, replayable exports exist, and answer-level replay stays green enough to keep the feature shadow-only |

### Stage 7: context loading optimization closure

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | make per-turn context loading optimization a formal mainline and formal gate instead of leaving it at shadow findings |
| Depends On | Stage 6 |
| Exit Criteria | the context-optimization scorecard is stable, harder replay / Docker / local evidence align, and rollout/rollback boundaries are clear |

### Stage 8: ordinary-conversation realtime-write latency closure

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | recover the clean Docker write-side answer path into a trustworthy ordinary-conversation strict A/B surface |
| Depends On | Stage 7 |
| Exit Criteria | the ordinary-conversation hermetic strict closeout now reports `40 / 40 vs 15 / 40` with `preCaseResetFailed = 0` |

### Stage 9: guarded smart-path promotion

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | start turning context optimization into real user-facing value without breaking rollback safety |
| Depends On | Stage 8 |
| Exit Criteria | the bounded opt-in path now has live A/B evidence, an operable rollback path, and remains `default-off` / opt-in only |

### Stage 10: adoption simplification and shared-foundation proof

| Item | Current Value |
| --- | --- |
| Status | completed |
| Goal | lift adoption experience and cross-host product proof to the same level as core capability |
| Depends On | Stage 9 |
| Exit Criteria | `npm run umc:stage10 -- --format markdown` is the shortest maintainer path and Codex / multi-instance shared proof is public and reproducible |

## Current Next Step

| Next Move | Why |
| --- | --- |
| Continue `Stage 12 / Group 12A` and prepare the docs-first closeout for `12B` ordinary-conversation runtime ingest | Because `Stage 11` is closed; the genuinely new theme is now realtime governed memory-intent productization rather than “finish Minor GC”. |
