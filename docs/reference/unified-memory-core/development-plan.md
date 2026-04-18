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

## Overall Progress

| Item | Current Value |
| --- | --- |
| Overall Progress | 4 / 4 execution tasks complete |
| Current Phase | `post-stage10-adoption-closeout` |
| Active Slice | `hold-stage10-adoption-proof-stable` |
| Current Objective | Stage 7 / 8 / 9 / 10 已全部收口；当前进入维护态，继续保持 Docker 为默认 hermetic A/B 面与 Stage 10 shortest-path/shared-foundation proof 持续为绿 |
| Active Slice Exit Signal | Stage 10 证据面长期稳定，且任何新阶段都不会隐式破坏 shortest-path / shared-foundation proof |
| Clear Next Move | Current execution tasks are complete; move to the next slice |
| Next Candidate Slice | `formalize-realtime-memory-intent-ingestion` |

## Current Position

| Item | Current Value | Meaning |
| --- | --- | --- |
| Current Phase | `post-stage10-adoption-closeout` | Current maintainer-facing phase |
| Active Slice | `hold-stage10-adoption-proof-stable` | The slice tied to the current execution line |
| Current Execution Line | Stage 7 / 8 / 9 / 10 已全部收口；当前进入维护态，继续保持 Docker 为默认 hermetic A/B 面与 Stage 10 shortest-path/shared-foundation proof 持续为绿 | What the repo is trying to finish now |
| Validation | roadmap / development plan / architecture docs、harder-case design note、formal-gate promotion decision、`npm run umc:release-preflight`、full regression、CLI use cases、main-path perf baseline、memory-improvement A/B summary、`npm run umc:cli -- registry inspect --format markdown | The checks that must stay true before moving on |

## Execution Task Progress

| Order | Task | Status |
| --- | --- | --- |
| 1 | EL-1 shorten install / bootstrap / verify into one clear shortest operator path | done |
| 2 | EL-2 add package / startup / first-run cost to the `light and fast` evidence surface | done |
| 3 | EL-3 publish stronger Codex shared-foundation proof | done |
| 4 | EL-4 publish clearer multi-instance shared-memory operator proof | done |

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

## Ordered Execution Queue

| Order | Slice | Status | Objective | Validation |
| --- | --- | --- | --- | --- |
| 1 | `build-openclaw-cli-100-case-benchmark` | earlier slice | 把当前 `20` 案例扩展成 `100+` OpenClaw CLI benchmark，覆盖稳定事实、普通检索、当前态覆盖、负向拒答、冲突事实、连续更新和跨来源归因 | 100+` 案例定义文档、机器可读结果、人工可读报告、可重复运行入口 |
| 2 | `plan-200-case-benchmark-and-main-path-performance` | earlier slice | 把当前 `187` case 评测面 review 成更全面的 `200` case 计划，并为 retrieval / assembly / answer-level 主链路建立性能专项计划 | roadmap / development plan / control surface 同步，明确中文案例 `>= 50%`、coverage review 方法、主链路 perf baseline 入口 |
| 3 | `execute-200-case-benchmark-and-answer-path-triage` | earlier slice | 把 benchmark 从 `187` 扩成 coverage-first 的 `200+` case，真正把中文做到 `50%`，并把 answer-level host path red line 与 transport watchlist 变成正式门禁 | 200+` case 定义、中文案例实际占比统计、answer-level gate 报告、transport watchlist 报告、main-path perf baseline refresh |
| 4 | `expand-answer-level-formal-gate-after-natural-zh-hardening` | earlier slice | 在自然中文覆盖、raw transport watchlist 和 main-path perf baseline 已重新稳定的前提下，把 isolated local answer-level formal gate 从 `6` 条代表性样本继续扩成更大的稳定矩阵 | 更大的 isolated local answer-level gate 报告、与 raw transport watchlist 分离的归因、中文 answer-level 子矩阵持续为绿、main-path perf baseline 重跑 |
| 5 | `deepen-answer-level-gate-beyond-12-case-baseline` | earlier slice | 在 `12 / 12` isolated local answer-level formal gate 已稳定的基础上，继续补强 cross-source、conflict、multi-step history 和更深的自然中文 answer-level coverage | 更深 answer-level gate 报告、control-surface 更新、与 transport watchlist 分离的结论、main-path perf baseline refresh |
| 6 | `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains` | earlier slice | shared-fail history cleanup 已完成；下一步把更多 harder cases 推成 Memory Core 独占胜场 | builtin-only regression fix、shared-fail history closure、下一轮 live A/B 设计、full regression / perf / A/B rerun |
| 7 | `finish-context-loading-optimization-first` | earlier slice | docs-first review 已完成；当前先完成 `轻快 / context loading optimization` 的 closeout；Stage 9 已收口但继续保持 `default-off` / opt-in only；ordinary-conversation hermetic A/B 已经收口为默认 Docker 基线，之后再收 `轻快 / install | roadmap / development plan / architecture docs / `.codex/*` 对齐；Stage 7 context-optimization scorecard、operator metrics 和 rollback boundary 被写成 durable docs |
| 8 | `design-harder-context-minor-gc-matrix` | earlier slice | Step 108 和 Stage 9 都已关闭；当前把 `Context Minor GC` 的 harder eval matrix 补成正式执行面 | 104` harder eval matrix、同一套 operator scorecard 重跑、Stage 7 closeout 报告 |
| 9 | `prepare-stage10-adoption-simplification-and-shared-foundation-proof` | earlier slice | Stage 7 / 8 / 9 已全部收口；当前转入 Stage 10，收 install / bootstrap / verify，并补齐 Codex / 多实例 shared-foundation product proof | Stage 10 plan steps `121-126`、short-path install proof、package/startup/first-run metrics、Codex / multi-instance evidence |
| 10 | `hold-stage10-adoption-proof-stable` | just completed | 保持 Stage 10 最短接入路径、package/startup/first-run 证据面，以及 Codex / 多实例 shared-foundation proof 持续为绿 | npm run umc:stage10 -- --format markdown`、README / roadmap / development plan / `.codex/*`、Stage 10 closeout reports |
| 11 | `formalize-realtime-memory-intent-ingestion` | next / queued | 把“主回复 + `memory_extraction`”从局部 runtime seam 收口成正式产品契约，补上 ordinary conversation rule 的实时 governed ingest 入口 | replay suite、Codex adapter tests、architecture docs、development plan、control-surface state |
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
| Current execution tasks are complete; move to the next slice or release decision | The current execution tasks are complete, so the next move is to enter the next slice or release decision. |
