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
| Overall Progress | all defined numbered stages complete |
| Current Phase | `post-stage12-product-maintenance` |
| Active Slice | `n/a` |
| Current Objective | keep Stage 5 / 10 / 11 / 12 proof surfaces, the release path, and Minor GC optimization evidence green |
| Active Slice Exit Signal | n/a |
| Clear Next Move | hold the maintenance / release / operator-proof baseline; only open a new stage for a new explicit product goal |
| Next Candidate Slice | `n/a` |

## Current Position

| Item | Current Value | Meaning |
| --- | --- | --- |
| Current Phase | `post-stage12-product-maintenance` | Current maintainer-facing phase |
| Active Slice | `n/a` | Stage 11 is closed |
| Current Execution Line | All defined numbered stages are complete; the repo is now in maintenance, holding Stage 5 / 10 / 11 / 12 proof surfaces plus the release/operator baseline while `Context Minor GC` continues as one long-running optimization track | What the repo is trying to keep true now |
| Validation | `npm run umc:stage12`, OpenClaw ordinary-conversation strict closeout, accepted-action host canary, OpenClaw guarded session probe / threshold Docker A/B, Stage 10 adoption/shared-foundation proof | The checks that must stay true in maintenance mode |

## Execution Task Progress

| Order | Task | Status |\n| --- | --- | --- |

## Milestone Overview

| Milestone | Status | Goal | Depends On | Exit Criteria |\n| --- | --- | --- | --- | --- |

## Ordered Execution Queue

| Order | Slice | Status | Objective | Validation |
| --- | --- | --- | --- | --- |
| 1 | `build-openclaw-cli-100-case-benchmark` | recorded | 把当前 `20` 案例扩展成 `100+` OpenClaw CLI benchmark，覆盖稳定事实、普通检索、当前态覆盖、负向拒答、冲突事实、连续更新和跨来源归因 | 100+` 案例定义文档、机器可读结果、人工可读报告、可重复运行入口 |
| 2 | `plan-200-case-benchmark-and-main-path-performance` | recorded | 把当前 `187` case 评测面 review 成更全面的 `200` case 计划，并为 retrieval / assembly / answer-level 主链路建立性能专项计划 | roadmap / development plan / control surface 同步，明确中文案例 `>= 50%`、coverage review 方法、主链路 perf baseline 入口 |
| 3 | `execute-200-case-benchmark-and-answer-path-triage` | recorded | 把 benchmark 从 `187` 扩成 coverage-first 的 `200+` case，真正把中文做到 `50%`，并把 answer-level host path red line 与 transport watchlist 变成正式门禁 | 200+` case 定义、中文案例实际占比统计、answer-level gate 报告、transport watchlist 报告、main-path perf baseline refresh |
| 4 | `expand-answer-level-formal-gate-after-natural-zh-hardening` | recorded | 在自然中文覆盖、raw transport watchlist 和 main-path perf baseline 已重新稳定的前提下，把 isolated local answer-level formal gate 从 `6` 条代表性样本继续扩成更大的稳定矩阵 | 更大的 isolated local answer-level gate 报告、与 raw transport watchlist 分离的归因、中文 answer-level 子矩阵持续为绿、main-path perf baseline 重跑 |
| 5 | `deepen-answer-level-gate-beyond-12-case-baseline` | recorded | 在 `12 / 12` isolated local answer-level formal gate 已稳定的基础上，继续补强 cross-source、conflict、multi-step history 和更深的自然中文 answer-level coverage | 更深 answer-level gate 报告、control-surface 更新、与 transport watchlist 分离的结论、main-path perf baseline refresh |
| 6 | `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains` | recorded | shared-fail history cleanup 已完成；下一步把更多 harder cases 推成 Memory Core 独占胜场 | builtin-only regression fix、shared-fail history closure、下一轮 live A/B 设计、full regression / perf / A/B rerun |
| 7 | `finish-context-loading-optimization-first` | recorded | docs-first review 已完成；当前先完成 `轻快 / context loading optimization` 的 closeout；Stage 9 已收口但继续保持 `default-off` / opt-in only；ordinary-conversation hermetic A/B 已经收口为默认 Docker 基线，之后再收 `轻快 / install | roadmap / development plan / architecture docs / `.codex/*` 对齐；Stage 7 context-optimization scorecard、operator metrics 和 rollback boundary 被写成 durable docs |
| 8 | `design-harder-context-minor-gc-matrix` | recorded | Step 108 和 Stage 9 都已关闭；当前把 `Context Minor GC` 的 harder eval matrix 补成正式执行面 | 104` harder eval matrix、同一套 operator scorecard 重跑、Stage 7 closeout 报告 |
| 9 | `prepare-stage10-adoption-simplification-and-shared-foundation-proof` | recorded | Stage 7 / 8 / 9 已全部收口；当前转入 Stage 10，收 install / bootstrap / verify，并补齐 Codex / 多实例 shared-foundation product proof | Stage 10 plan steps `121-126`、short-path install proof、package/startup/first-run metrics、Codex / multi-instance evidence |
| 10 | `hold-stage10-adoption-proof-stable` | recorded | 保持 Stage 10 最短接入路径、package/startup/first-run 证据面，以及 Codex / 多实例 shared-foundation proof 持续为绿 | npm run umc:stage10 -- --format markdown`、README / roadmap / development plan / `.codex/*`、Stage 10 closeout reports |
| 11 | `formalize-realtime-memory-intent-ingestion` | recorded | 把“主回复 + `memory_extraction`”从局部 runtime seam 收口成正式产品契约，补上 ordinary conversation rule 的实时 governed ingest 入口 | replay suite、Codex adapter tests、architecture docs、development plan、control-surface state |
| 12 | `attribute-memory-capability-sources` | recorded | 对同一批核心案例做 `legacy / unified / bootstrap / retrieval` 对照，明确答案来源和扩展增益边界 | A/B 对照报告、关键案例证据、来源分类说明 |
| 13 | `turn-failures-into-algorithm-iterations` | recorded | 把 benchmark 失败案例转成 retrieval / assembly / policy 算法问题清单，并按轮次修复、复测、提交 | 每轮失败清单、对应修复、复测结果、GitHub commit |
| 14 | `close-stage5-product-hardening-and-independent-operation` | recorded | 一口气收掉 `Step 39-46`，把 source hardening、maintenance、reproducibility、release-boundary、split rehearsal、independent review 全部接到 CLI-first 证据面 | Stage 5 targeted tests、`npm run umc:stage5`、`npm run umc:cli -- maintenance run`、`npm run umc:cli -- export reproducibility`、`npm run umc:cli -- review split-rehearsal |
| 15 | `hold-stage5-product-hardening-stable` | recorded | 保持 Stage 5 acceptance、maintenance、reproducibility、split rehearsal 证据面持续稳定 | npm run umc:stage5`、`npm run umc:acceptance`、`npm run umc:openclaw-itest`、full `npm test |
| 16 | `close-release-preflight-cli-and-deployment-verification` | recorded | 把真实 bundle install、deployment verification、release-preflight 一键门禁全部 CLI 化，并把仓库状态推进到“只等人类验收” | npm run umc:build-bundle`、`npm run umc:openclaw-install-verify`、`npm run umc:release-preflight`、`npm run umc:cli -- verify openclaw-install |
| 17 | `hold-release-preflight-evidence-stable` | recorded | 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿 | npm run umc:release-preflight`、`npm run umc:openclaw-install-verify`、`npm run umc:openclaw-itest`、`npm run umc:stage5 |
| 18 | `close-host-neutral-root-cutover-gate-policy` | recorded | 基于 live topology、migration recommendation 和 split rehearsal，把 canonical root cutover 与 gate rule 写成显式 operator policy | npm run umc:cli -- registry inspect --format markdown`、`npm run umc:cli -- registry migrate --format markdown`、`npm run umc:cli -- review split-rehearsal --format markdown |
| 19 | `hold-host-neutral-root-policy-stable` | recorded | 保持 canonical root adoption 规则稳定，不让 later changes 把 legacy divergence 重新包装成 hard gate | npm run umc:cli -- registry inspect --format markdown`、configuration docs、control-surface status |
| 20 | `hold-post-stage5-roadmap-state-aligned` | recorded | 保持 project/workstream roadmap 摘要、Stage 5 closeout 证据和 later-phase gate 在同一条 operator baseline 上 | npm run smoke:eval -- --format markdown`、`npm run smoke:eval:critical -- --format markdown`、`npm run eval:memory-search:cases -- --skip-builtin --format json`、project/workstream roadmap、control-surface status |
| 21 | `define-deeper-accepted-action-extraction-todo` | recorded | 把 accepted-action 的更深抽取规则、分层准入、负向路径和治理覆盖明确写成 deferred enhancement queue，而不是继续隐含在聊天里 | self-learning architecture / roadmap / development plan 与 `.codex/*` 对齐；TODO 只定义后续实现，不误报成当前 baseline 已完成 |
| 22 | `implement-step47-field-aware-accepted-action-extraction` | recorded | 落地 deferred queue 的 Step 47，让 accepted_action 基于结构化字段拆出 `target_fact`、显式 `operating_rule`、`outcome_artifact` 候选，而不是继续只产出一条保守摘要 | accepted_action source/reflection/CLI tests、`npm test`、`npm run verify`、`npm run umc:cli -- reflect run ... --source-type accepted_action`、`npm run umc:cli -- learn lifecycle-run ... --source-type accepted_action |
| 23 | `hook-openclaw-after-tool-call-into-accepted-action-learning` | recorded | 把 OpenClaw 侧真正可用的异步 runtime seam 接上 governed accepted-action intake，让显式结构化 tool result 能直接进入 source -> reflection -> promotion 闭环 | OpenClaw hook regression tests、full `npm test`、`npm run verify`、本机部署后宿主侧 after_tool_call 模拟 |

## Milestone Details

No milestone drill-down could be derived from the roadmap yet.

## Current Next Step

| Next Move | Why |
| --- | --- |
| Hold the maintenance / release / operator-proof baseline. | All numbered stages are complete, so the repo should now stay stable and verifiable instead of opening another slice implicitly. |

## Stage 12 Realtime Memory Intent Productization

### Group 12A contract-and-replay-hold

- Status: `completed`
- Result:
  - the shared `memory_intent` / `memory_extraction` / accepted-action contract is fixed
  - replay suite, runtime tests, and governance tests are now one formal gate under `npm run verify:memory-intent`
  - architecture / development plan / control surface now use one aligned vocabulary

### Group 12B ordinary-conversation-runtime-ingest

- Status: `completed`
- Result:
  - ordinary-conversation realtime ingest is no longer just a contract design; it has a strict Docker hermetic closeout
  - closeout result: current `40 / 40`, legacy `15 / 40`, `UMC-only = 25`, `both-fail = 0`
  - report:
    - [openclaw-ordinary-conversation-memory-intent-closeout-2026-04-17.md](../../../reports/generated/openclaw-ordinary-conversation-memory-intent-closeout-2026-04-17.md)

### Group 12C operator-surface-and-rollout

- Status: `completed`
- Result:
  - `npm run umc:stage12` is now the formal maintainer proof entrypoint for Stage 12
  - the accepted-action host canary proves the real OpenClaw `after_tool_call` governed intake path
  - Stage 12 closeout report:
    - [stage12-realtime-memory-intent-productization-closeout-2026-04-19.md](../../../reports/generated/stage12-realtime-memory-intent-productization-closeout-2026-04-19.md)

## Ongoing Optimization Note

Even though `Stage 11` is closed, `Context Minor GC` does not stop here.

It now continues as one of the long-running optimization tracks, focused on:

1. prompt thickness control in longer sessions
2. real prompt rollback after topic switches
3. answer latency on switch turns and high-pressure windows
4. operator/debug clarity and maintenance cost

The main question for this line is no longer “can it close out?” but “does it keep getting thinner, steadier, faster, and easier to operate?”
