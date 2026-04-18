# unified-memory-core 开发计划

[English](development-plan.md) | [中文](development-plan.zh-CN.md)

## 目的

这份文档是给维护者看的 durable 详细执行计划，位置在 `docs/roadmap` 之下、AI 控制面之上。

它回答的不是“今天聊天里说了什么”，而是：

`接下来先做什么、从哪里恢复、每个里程碑下面到底落什么细节。`

## 相关文档

- [../../roadmap.zh-CN.md](../../roadmap.zh-CN.md)
- [../../architecture.zh-CN.md](../../architecture.zh-CN.md)
- [../../test-plan.zh-CN.md](../../test-plan.zh-CN.md)

## 怎么使用这份计划

1. 先看 roadmap，理解总体进展与下一阶段。
2. 再看这里的“总体进展”“执行任务进度”和“顺序执行队列”，理解今天该从哪里恢复。
3. 只有在维护自动化本身时，才需要继续下钻到内部控制文档。

这里和 roadmap 保持同一条规则：

- roadmap 里标 `已完成` 的 Stage，代表那一项主题真的已经关闭
- development plan 不会再把同一主题拆到别的顶层 Stage 里继续执行
- 如果后面还有剩余工作，会放进一个新的总阶段，并明确写出和历史 Stage 的边界

## 总体进展

| 项目 | 当前值 |
| --- | --- |
| 当前总阶段 | `stage11-context-minor-gc-and-codex-integration` |
| 当前分组 | `group-11b-openclaw-baseline-hold` |
| 总阶段进度 | `1 / 4` 分组已完成 |
| 当前目标 | 把所有剩余的 `Context Minor GC` 工作收进一个统一大阶段，并把 Codex 对接纳入正式计划 |
| 当前约束 | 不改 OpenClaw builtin memory 行为；guarded seam 继续保持 `default-off` / opt-in only |
| 当前切换条件 | OpenClaw 侧 baseline 长期为绿，且 Codex bridge 的设计与验证面已明确 |
| 下一分组 | `group-11c-codex-context-bridge` |

## 当前位置

| 项目 | 当前值 | 说明 |
| --- | --- | --- |
| 当前阶段 | `Stage 11` | 当前大阶段 |
| 当前分组 | `11B openclaw-baseline-hold` | 当前真正正在做的组 |
| 当前执行线 | 保持 OpenClaw 侧 `Context Minor GC` scorecard、harder matrix、guarded live A/B 长期为绿，同时为 Codex 对接做 docs-first 设计收口 | 当前真正正在推进的工作 |
| 当前验证 | Stage 7 scorecard、Step 108 closeout、Stage 7 / `104` harder matrix、Stage 9 guarded live A/B、Docker hermetic baseline、Stage 10 shortest-path/shared-foundation proof | 当前执行线必须保持为真的证据面 |

## Minor GC 速览

如果你只关心 `Context Minor GC`，先记住这 4 句：

1. Stage 7 / Step 108 已收口。
2. Stage 7 / `104` harder eval matrix 已收口，live matrix `6 / 6`。
3. Stage 9 guarded smart path 已收口，但继续保持 `default-off` / opt-in only。
4. 当前真正的新工作，是把剩余的 `Minor GC` 工作收进 `Stage 11`，并把 Codex 对接纳入同一套计划。

推荐阅读顺序：

1. [../../roadmap.zh-CN.md](../../roadmap.zh-CN.md)
2. [architecture/context-minor-gc.zh-CN.md](architecture/context-minor-gc.zh-CN.md)
3. [../../../../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md](../../../../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
4. [../../../../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md](../../../../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
5. [../../../../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md](../../../../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)

## Stage 11 分组进度

| 分组 | 状态 | 目标 | 验证 |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | 已完成 | 把 Stage 6 / 7 / 9 的 `Minor GC` 历史成果收成一个统一大阶段，并整理 roadmap / plan / minor-gc docs 的阅读顺序 | roadmap / development plan / minor-gc 架构页对齐 |
| 11B `openclaw-baseline-hold` | 当前进行 | 保持 OpenClaw 侧 `Context Minor GC` scorecard、harder matrix、guarded live A/B 长期为绿 | Stage 7 scorecard、Step 108、`104` harder matrix、Stage 9 live A/B |
| 11C `codex-context-bridge` | 下一步 | 把同一套 decision contract / shadow / guarded / scorecard 接到 Codex adapter | Codex adapter design、replay suite、tests、cross-host report |
| 11D `cross-host-rollout-decision` | 后续 | 只有 OpenClaw + Codex 证据都足够后，才讨论是否扩大默认路径 | rollout ADR / report、rollback boundary、operator decision |

## 阶段总览

| 阶段 | 状态 | 目标 | 依赖 | 退出条件 |
| --- | --- | --- | --- | --- |
| Stage 1 | 已完成 | 设计基线 | 无 | 文档、边界、测试面一致 |
| Stage 2 | 已完成 | local-first baseline | Stage 1 | core / adapter / CLI / governance 可运行 |
| Stage 3 | 已完成 | self-learning lifecycle baseline | Stage 2 | promotion / decay / learning governance 收口 |
| Stage 4 | 已完成 | policy adaptation | Stage 3 | governed learning 能影响消费行为 |
| Stage 5 | 已完成 | product hardening | Stage 4 | release boundary / reproducibility / split rehearsal CLI 化 |
| Stage 6 | 已完成 | dialogue working-set shadow integration | Stage 5 | runtime shadow telemetry 落地并保持 shadow-only |
| Stage 7 | 已完成 | context loading optimization closure | Stage 6 | scorecard、Step 108、harder matrix 收口 |
| Stage 8 | 已完成 | ordinary-conversation realtime-write latency closure | Stage 7 | ordinary-conversation strict Docker A/B 收口 |
| Stage 9 | 已完成 | guarded smart-path promotion | Stage 8 | bounded opt-in active path 收口并保持 `default-off` |
| Stage 10 | 已完成 | adoption simplification and shared-foundation proof | Stage 9 | 最短接入路径与 cross-host proof 收口 |
| Stage 11 | 当前大阶段 | Context Minor GC 与 Codex 对接总阶段 | Stage 10 | OpenClaw baseline 稳定、Codex bridge 明确、跨宿主 rollout 决策显式化 |

## Stage 11: Context Minor GC And Codex Integration

这是当前最新的大阶段。要点只有 3 个：

1. Stage 6 / 7 / 9 的 `Minor GC` 历史成果不删除，但它们继续保持各自“已完成”的历史阶段地位。
2. 当前真正的工作不是继续补 OpenClaw 基础能力，而是把剩余的 `Minor GC` 工作收进一个统一总阶段：保持 OpenClaw baseline，并把 Codex 对接补齐。
3. 默认路径放量不再隐式发生，必须作为 Stage 11D 的单独决策。

### Group 11A: Foundation Reframe

- 状态：已完成
- 目标：把 `Context Minor GC` 相关历史工作收成一个可读的大阶段叙事
- 已完成项：
  - roadmap / development plan / minor-gc docs 阅读顺序对齐
  - `Context Minor GC` 明确写成“已收口基础能力 + 后续跨宿主扩展”的结构
- 退出条件：维护者不再需要在旧报告之间来回猜当前状态

### Group 11B: OpenClaw Baseline Hold

- 状态：当前进行
- 目标：保持 OpenClaw 侧 `Context Minor GC` baseline 长期为绿
- 关键证据：
  - Stage 7 scorecard
  - Step 108 closeout
  - Stage 7 / `104` harder live matrix
  - Stage 9 guarded live A/B
- 退出条件：
  - 新改动不会把上述证据面打回红色
  - `default-off` / opt-in only 边界继续清晰

### Group 11C: Codex Context Bridge

- 状态：下一步
- 目标：把 OpenClaw 侧已经验证过的 context decision contract 接到 Codex adapter
- 范围：
  - Codex 侧 shadow / guarded / scorecard 契约
  - Codex transcript / task 边界与 `Context Minor GC` 的映射
  - cross-host 对照报告
- 验证：
  - Codex adapter design docs
  - replay suite
  - adapter tests
  - cross-host report
- 退出条件：Codex 也能纳入同一套 `Minor GC` 主线，而不是只停留在 shared-foundation 证明里

### Group 11D: Cross-Host Rollout Decision

- 状态：后续
- 目标：只有 OpenClaw + Codex 两侧证据都足够时，才讨论是否扩大默认路径
- 必要条件：
  - OpenClaw baseline 持续为绿
  - Codex bridge 已有正式证据
  - rollback boundary 和 operator decision surface 都清楚
- 退出条件：形成明确 rollout ADR / report，而不是在代码里隐式扩大默认面

## 历史切片与后续 backlog

下面这张长表保留历史规划和 backlog，不再代表“当前人类应该从这里开始看”。
当前应该先看上面的 `Stage 11` 和 4 个分组。

## 顺序执行队列

| 顺序 | 切片 | 当前状态 | 目标 | 验证 |
| --- | --- | --- | --- | --- |
| 1 | `build-openclaw-cli-100-case-benchmark` | 较早切片 | 把当前 `20` 案例扩展成 `100+` OpenClaw CLI benchmark，覆盖稳定事实、普通检索、当前态覆盖、负向拒答、冲突事实、连续更新和跨来源归因 | 100+` 案例定义文档、机器可读结果、人工可读报告、可重复运行入口 |
| 2 | `plan-200-case-benchmark-and-main-path-performance` | 较早切片 | 把当前 `187` case 评测面 review 成更全面的 `200` case 计划，并为 retrieval / assembly / answer-level 主链路建立性能专项计划 | roadmap / development plan / control surface 同步，明确中文案例 `>= 50%`、coverage review 方法、主链路 perf baseline 入口 |
| 3 | `execute-200-case-benchmark-and-answer-path-triage` | 较早切片 | 把 benchmark 从 `187` 扩成 coverage-first 的 `200+` case，真正把中文做到 `50%`，并把 answer-level host path red line 与 transport watchlist 变成正式门禁 | 200+` case 定义、中文案例实际占比统计、answer-level gate 报告、transport watchlist 报告、main-path perf baseline refresh |
| 4 | `expand-answer-level-formal-gate-after-natural-zh-hardening` | 较早切片 | 在自然中文覆盖、raw transport watchlist 和 main-path perf baseline 已重新稳定的前提下，把 isolated local answer-level formal gate 从 `6` 条代表性样本继续扩成更大的稳定矩阵 | 更大的 isolated local answer-level gate 报告、与 raw transport watchlist 分离的归因、中文 answer-level 子矩阵持续为绿、main-path perf baseline 重跑 |
| 5 | `deepen-answer-level-gate-beyond-12-case-baseline` | 较早切片 | 在 `12 / 12` isolated local answer-level formal gate 已稳定的基础上，继续补强 cross-source、conflict、multi-step history 和更深的自然中文 answer-level coverage | 更深 answer-level gate 报告、control-surface 更新、与 transport watchlist 分离的结论、main-path perf baseline refresh |
| 6 | `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains` | 较早切片 | shared-fail history cleanup 已完成；下一步把更多 harder cases 推成 Memory Core 独占胜场 | builtin-only regression fix、shared-fail history closure、下一轮 live A/B 设计、full regression / perf / A/B rerun |
| 7 | `finish-context-loading-optimization-first` | 历史已收口 | 历史切片：完成 `轻快 / context loading optimization` closeout，并把 Stage 7 context-optimization scorecard、operator metrics、rollback boundary 写成 durable docs | Stage 7 scorecard、Stage 7 closeout 报告、roadmap / development plan / architecture docs 对齐 |
| 8 | `design-harder-context-minor-gc-matrix` | 历史已收口 | 历史切片：完成 `Context Minor GC` 的 harder eval matrix，并正式关闭 Stage 7 | `104` harder eval matrix、同一套 operator scorecard 重跑、Stage 7 closeout 报告 |
| 9 | `prepare-stage10-adoption-simplification-and-shared-foundation-proof` | 历史已收口 | 历史切片：完成 Stage 10 adoption / bootstrap / verify / shared-foundation proof | Stage 10 plan steps `121-126`、short-path install proof、package/startup/first-run metrics、Codex / multi-instance evidence |
| 10 | `hold-stage10-adoption-proof-stable` | 历史维护切片 | 保持 Stage 10 最短接入路径、package/startup/first-run 证据面，以及 Codex / 多实例 shared-foundation proof 持续为绿；同时保持 `Context Minor GC` 与 guarded seam 的证据面不回退 | `npm run umc:stage10 -- --format markdown`、README / roadmap / development plan / `.codex/*`、Stage 10 closeout reports |
| 11 | `formalize-realtime-memory-intent-ingestion` | 后续 backlog | 把“主回复 + `memory_extraction`”从局部 runtime seam 收口成正式产品契约，补上 ordinary conversation rule 的实时 governed ingest 入口 | replay suite、Codex adapter tests、architecture docs、development plan、control-surface state |
| 12 | `attribute-memory-capability-sources` | 下一步 / 已排队 | 对同一批核心案例做 `legacy / unified / bootstrap / retrieval` 对照，明确答案来源和扩展增益边界 | A/B 对照报告、关键案例证据、来源分类说明 |
| 13 | `turn-failures-into-algorithm-iterations` | 下一步 / 已排队 | 把 benchmark 失败案例转成 retrieval / assembly / policy 算法问题清单，并按轮次修复、复测、提交 | 每轮失败清单、对应修复、复测结果、GitHub commit |
| 14 | `close-stage5-product-hardening-and-independent-operation` | 下一步 / 已排队 | 一口气收掉 `Step 39-46`，把 source hardening、maintenance、reproducibility、release-boundary、split rehearsal、independent review 全部接到 CLI-first 证据面 | Stage 5 targeted tests、`npm run umc:stage5`、`npm run umc:cli -- maintenance run`、`npm run umc:cli -- export reproducibility`、`npm run umc:cli -- review split-rehearsal |
| 15 | `hold-stage5-product-hardening-stable` | 下一步 / 已排队 | 保持 Stage 5 acceptance、maintenance、reproducibility、split rehearsal 证据面持续稳定 | npm run umc:stage5`、`npm run umc:acceptance`、`npm run umc:openclaw-itest`、full `npm test |
| 16 | `close-release-preflight-cli-and-deployment-verification` | 下一步 / 已排队 | 把真实 bundle install、deployment verification、release-preflight 一键门禁全部 CLI 化，并把仓库状态推进到“只等人类验收” | npm run umc:build-bundle`、`npm run umc:openclaw-install-verify`、`npm run umc:release-preflight`、`npm run umc:cli -- verify openclaw-install |
| 17 | `hold-release-preflight-evidence-stable` | 下一步 / 已排队 | 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿 | npm run umc:release-preflight`、`npm run umc:openclaw-install-verify`、`npm run umc:openclaw-itest`、`npm run umc:stage5 |
| 18 | `close-host-neutral-root-cutover-gate-policy` | 下一步 / 已排队 | 基于 live topology、migration recommendation 和 split rehearsal，把 canonical root cutover 与 gate rule 写成显式 operator policy | npm run umc:cli -- registry inspect --format markdown`、`npm run umc:cli -- registry migrate --format markdown`、`npm run umc:cli -- review split-rehearsal --format markdown |
| 19 | `hold-host-neutral-root-policy-stable` | 下一步 / 已排队 | 保持 canonical root adoption 规则稳定，不让 later changes 把 legacy divergence 重新包装成 hard gate | npm run umc:cli -- registry inspect --format markdown`、configuration docs、control-surface status |
| 20 | `hold-post-stage5-roadmap-state-aligned` | 下一步 / 已排队 | 保持 project/workstream roadmap 摘要、Stage 5 closeout 证据和 later-phase gate 在同一条 operator baseline 上 | npm run smoke:eval -- --format markdown`、`npm run smoke:eval:critical -- --format markdown`、`npm run eval:memory-search:cases -- --skip-builtin --format json`、project/workstream roadmap、control-surface status |
| 21 | `define-deeper-accepted-action-extraction-todo` | 下一步 / 已排队 | 把 accepted-action 的更深抽取规则、分层准入、负向路径和治理覆盖明确写成 deferred enhancement queue，而不是继续隐含在聊天里 | self-learning architecture / roadmap / development plan 与 `.codex/*` 对齐；TODO 只定义后续实现，不误报成当前 baseline 已完成 |
| 22 | `implement-step47-field-aware-accepted-action-extraction` | 下一步 / 已排队 | 落地 deferred queue 的 Step 47，让 accepted_action 基于结构化字段拆出 `target_fact`、显式 `operating_rule`、`outcome_artifact` 候选，而不是继续只产出一条保守摘要 | accepted_action source/reflection/CLI tests、`npm test`、`npm run verify`、`npm run umc:cli -- reflect run ... --source-type accepted_action`、`npm run umc:cli -- learn lifecycle-run ... --source-type accepted_action |
| 23 | `hook-openclaw-after-tool-call-into-accepted-action-learning` | 下一步 / 已排队 | 把 OpenClaw 侧真正可用的异步 runtime seam 接上 governed accepted-action intake，让显式结构化 tool result 能直接进入 source -> reflection -> promotion 闭环 | OpenClaw hook regression tests、full `npm test`、`npm run verify`、本机部署后宿主侧 after_tool_call 模拟 |

## 里程碑细节

当前还没有从 roadmap 里解析出可下钻的里程碑。

## 当前下一步

| 下一步 | 为什么做 |
| --- | --- |
| 继续执行 `Stage 11 / Group 11B`，并开始 `Stage 11 / Group 11C` 的 Codex context bridge 设计与验证 | 因为 `Minor GC` 剩余工作现在已经统一归到 `Stage 11`，下一步不该再回到旧切片，而是按 OpenClaw baseline -> Codex bridge -> rollout decision 的顺序推进。 |
