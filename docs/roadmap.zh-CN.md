# 路线图

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## 这页怎么读

这页只做 3 件事：

1. 保留完整阶段顺序，不删除历史阶段
2. 明确告诉你“当前最新的大阶段是什么”
3. 把当前阶段直接链接到 [development plan](reference/unified-memory-core/development-plan.zh-CN.md) 的具体计划

这里的状态语义固定不变：

- `已完成` = 这一项真的已经完整关闭，不会再把同一项工作拆到别的顶层 Stage 继续做
- `当前大阶段` = 当前所有剩余工作都应当挂在这里，而不是分散到多个大项

如果你现在最关心的是 `Context Minor GC`，先看：

- [Stage 11: Context Minor GC And Codex Integration](#stage-11-context-minor-gc-and-codex-integration)
- [Stage 11 收口报告](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)
- [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)

## 当前一句话

仓库当前已经把 `Stage 12` 也正式收口；目前所有已定义的 numbered stages 都已完成，仓库进入 post-Stage-12 maintenance。

- `Stage 11` 已完成
- `Stage 12` 已完成
- 当前运行状态是：`post-stage12-product-maintenance`
- `Codex` 侧 host-visible gap 保留为后续独立优化，不再阻塞 `Stage 11`

这句话的意思是：

- `Context Minor GC` 现在已经在 OpenClaw + Codex 两侧可用
- OpenClaw 侧“用户明显有体感”的 closeout 证据已经补齐
- OpenClaw guarded seam 现已默认开启；shadow 继续保持 `default-off`
- 当前真正主线，不再是新 numbered stage，而是 maintenance / release / operator proof 维持
- 同时，`Context Minor GC` 不会在 Stage 11 关闭后停止，而会继续作为长期优化主线之一

## 北极星目标

> 装得简单，用得顺手，跑得轻快，记得聪明，维护省心。

路线图和后续优化都继续围绕 3 个对外卖点组织：

- `轻快`
- `聪明`
- `省心`

当前已经实现的能力，对应关系简表：

- `轻快`
  事实优先组装、`Context Minor GC`、更少依赖 `compact`、更短安装与验证路径
- `聪明`
  realtime `memory_intent` / `accepted_action`、nightly self-learning、promotion / decay、规则/偏好/事实的受治理进入
- `省心`
  `umc` CLI、audit / replay / repair / rollback、Docker hermetic 验证、release-preflight、跨宿主共享契约

## 阶段时间线

| 阶段 | 状态 | 主题 | 说明 |
| --- | --- | --- | --- |
| Stage 1 | 已完成 | design baseline | 定义产品边界、文档结构、测试面 |
| Stage 2 | 已完成 | local-first baseline | 跑通 governed local-first baseline |
| Stage 3 | 已完成 | self-learning lifecycle baseline | promotion / decay / learning governance 收口 |
| Stage 4 | 已完成 | policy adaptation | 让 governed learning 影响消费行为 |
| Stage 5 | 已完成 | product hardening | independent operation / split / reproducibility / release boundary 收口 |
| Stage 6 | 已完成 | dialogue working-set shadow integration | runtime shadow measurement 面落地 |
| Stage 7 | 已完成 | context loading optimization closure | `Context Minor GC` 正式进入主线并收口 |
| Stage 8 | 已完成 | ordinary-conversation realtime-write latency closure | ordinary-conversation strict Docker A/B 收口 |
| Stage 9 | 已完成 | guarded smart-path promotion | bounded active path 收口；maintenance 中已切到 OpenClaw 默认开启 |
| Stage 10 | 已完成 | adoption simplification and shared-foundation proof | 最短接入路径、Codex / 多实例 shared proof 收口 |
| Stage 11 | 已完成 | Context Minor GC and Codex integration | OpenClaw 侧 host-visible closeout 已补齐；Codex host-visible gap 不再阻塞 Stage 11 关闭 |
| Stage 12 | 已完成 | realtime memory intent productization | realtime governed memory intake 已收成正式产品面与 operator 面 |

## Stage 11: Context Minor GC And Codex Integration

`Stage 11` 现在已经完成。

最终关闭标准不是“Minor GC 能不能跑”，而是：

- 整个 `Context Minor GC` 已经可用
- OpenClaw 用户端已经有明显收益
- rollback boundary 仍然清楚

### Stage 11 完成标准与结果

| 标准 | 收口要求 | 结果 |
| --- | --- | --- |
| GC 可用 | OpenClaw + Codex 都能消费同一套 decision contract / shadow / guarded seam | 已满足 |
| 用户收益 | OpenClaw 正例上有明确 prompt/context 缩减，而且在更长多轮对话里不依赖 `compact` 也能看到 thread 更薄 | 已满足 |
| 边界清楚 | shadow 继续 `default-off`；guarded 默认开启但仍保持窄 relation / reduction / eviction 边界 | 已满足 |

### Stage 11 分组最终状态

| 分组 | 状态 | 目标 | 具体计划 |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | 已完成 | 把 Stage 6 / 7 / 9 的 `Minor GC` 历史成果收成一个可读的大阶段叙事 | [Plan: 11A](reference/unified-memory-core/development-plan.zh-CN.md#group-11a-foundation-reframe) |
| 11B `openclaw-baseline-hold` | 已完成 | 保持 OpenClaw 侧 `Context Minor GC` scorecard、harder matrix、guarded 边界为绿，并补齐 closeout 证据 | [Plan: 11B](reference/unified-memory-core/development-plan.zh-CN.md#group-11b-openclaw-baseline-hold) |
| 11C `codex-context-bridge` | 已完成 | 把同一套 context decision / shadow / guarded / scorecard 接到 Codex adapter | [Plan: 11C](reference/unified-memory-core/development-plan.zh-CN.md#group-11c-codex-context-bridge) |
| 11D `cross-host-rollout-decision` | 已完成但结论回退 | 明确跨宿主决策：能力已可用，但“用户已有明显体感”的旧结论作废 | [Plan: 11D](reference/unified-memory-core/development-plan.zh-CN.md#group-11d-cross-host-rollout-decision) |
| 11E `growth-source-control` | 已完成 | 先控宿主线程增长源，不再让重型诊断和长输出继续污染当前线程 | [Plan: 11E](reference/unified-memory-core/development-plan.zh-CN.md#group-11e-growth-source-control) |
| 11F `summary-first-carry-forward` | 已完成 | 把 project 层 carry-forward 推到 summary-first task-state | [Plan: 11F](reference/unified-memory-core/development-plan.zh-CN.md#group-11f-summary-first-carry-forward) |
| 11G `host-visible-validation-and-closeout` | 已完成 | 以 OpenClaw 用户体感为核心完成 corrected closeout；Codex host-visible gap 另行处理，不再阻塞 Stage 11 | [Plan: 11G](reference/unified-memory-core/development-plan.zh-CN.md#group-11g-host-visible-validation-and-closeout) |

### Stage 11 收口证据

- [Stage 7 / Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- [Stage 7 `Context Minor GC` 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)
- [Codex Context Minor GC Live Matrix](../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md)
- [Stage 11 收口报告](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)
- [OpenClaw Guarded Session Probe `stress` Docker 报告](../reports/generated/openclaw-guarded-session-probe-stress-docker-2026-04-19.md)
- [OpenClaw Near-Compaction Threshold Docker A/B](../reports/generated/openclaw-guarded-session-probe-threshold-docker-2026-04-19.md)

## 如果你只想知道“Minor GC 还剩什么”

最短答案：

- `Minor GC` 的核心能力已经完成
- OpenClaw + Codex 两侧的能力链路已经跑通
- OpenClaw 用户体感 closeout 已补齐；Stage 11 不再阻塞 Stage 12
- 但 `Context Minor GC` 仍继续作为长期优化主线之一推进

## Stage 12: Realtime Memory Intent Productization

`Stage 12` 现在已经完成。它关闭的标准是：

- realtime `memory_intent` / `memory_extraction` / accepted-action 不再只是零散能力
- contract、replay、ordinary-conversation runtime ingest、accepted-action host proof 已收成同一条产品线
- 维护者已经有一条正式 proof 入口，而不是靠散落命令和旧报告拼接

同时保留一个长期约束：

- `Context Minor GC` 已收口，但会继续作为持续优化主线之一存在，重点继续压更长对话下的 prompt thickness、切题回落、answer latency 和 operator/debug 简洁度

| 分组 | 状态 | 目标 | 具体计划 |
| --- | --- | --- | --- |
| 12A `contract-and-replay-hold` | 已完成 | 把 `memory_intent` / `memory_extraction` / accepted-action 的实时入口、回放和文档契约收成同一条产品线 | [Plan: 12A](reference/unified-memory-core/development-plan.zh-CN.md#group-12a-contract-and-replay-hold) |
| 12B `ordinary-conversation-runtime-ingest` | 已完成 | 把普通对话与运行时 rule ingestion 接到同一套 governed realtime path | [Plan: 12B](reference/unified-memory-core/development-plan.zh-CN.md#group-12b-ordinary-conversation-runtime-ingest) |
| 12C `operator-surface-and-rollout` | 已完成 | 把 inspect / audit / replay / rollback 与 rollout boundary 收成正式 operator 面 | [Plan: 12C](reference/unified-memory-core/development-plan.zh-CN.md#group-12c-operator-surface-and-rollout) |

### Stage 12 收口证据

- [Stage 12 收口报告](../reports/generated/stage12-realtime-memory-intent-productization-closeout-2026-04-19.zh-CN.md)
- [OpenClaw Ordinary-Conversation Strict Closeout](../reports/generated/openclaw-ordinary-conversation-memory-intent-closeout-2026-04-17.md)
- [OpenClaw Accepted-Action Host Canary](../reports/generated/openclaw-accepted-action-canary-2026-04-15.md)

## 阅读顺序

如果你现在要顺着看，不要再在旧报告之间跳：

1. 先看当前这页，确认 `Stage 12` 也已经关闭，仓库当前进入 maintenance
2. 如果你关心 `Minor GC`，先看 [Stage 11 收口报告](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)
3. 再看 [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)
4. 再看 [Stage 11 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-11-context-minor-gc-and-codex-integration)
5. 再看 [Stage 12 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-12-realtime-memory-intent-productization)
6. 再看 [Stage 12 收口报告](../reports/generated/stage12-realtime-memory-intent-productization-closeout-2026-04-19.zh-CN.md)
7. 需要核对历史证据时，再看：
   - [Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 7 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)

## 总体进展
| 项目 | 当前值 |
| --- | --- |
| 总体进度 | 所有已定义 numbered stages 已完成 |
| 当前阶段 | `post-stage12-product-maintenance` |
| 当前切片 | `n/a` |
| 当前目标 | 保持 Stage 5 / 10 / 11 / 12 proof surfaces、release 路径和 Minor GC 优化证据持续为绿 |
| 当前切片退出条件 | n/a |
| 明确下一步动作 | 维持 maintenance / release / operator proof 基线；只有新明确产品目标出现时才开启新阶段 |
| 下一候选切片 | `n/a` |

查看详细执行计划：[project-assistant/development-plan.zh-CN.md](reference/project-assistant/development-plan.zh-CN.md)


详细执行队列看这里：

- [unified-memory-core/development-plan.zh-CN.md](reference/unified-memory-core/development-plan.zh-CN.md)

## 当前 / 下一步 / 更后面
| 时间层级 | 重点 | 退出信号 |
| --- | --- | --- |
| 当前 | 保持 Stage 5 / 10 / 11 / 12 的 proof surfaces 与 release 路径为绿 | 证明当前产品态稳定可维护 |
| 下一步 | 继续把 Minor GC 当成长期优化主线之一，持续压更长对话下的 prompt thickness、切题回落、时延和 operator/debug 简洁度 | refreshed scorecards、threshold probes 和 host-visible evidence 持续为绿 |
| 更后面 | 只有在新的明确产品目标下，才打开新的 numbered stage | 新阶段目标、边界和 closeout 证据面同时明确 |

## 里程碑规则
- 一个里程碑只对应一个清晰的主题目标
- 标成 `done` / `已完成` 就表示这一项真的已经完整完成
- 不要把同一条工作主题拆到多个顶层里程碑里
- 细分步骤放进 development plan，不要塞进彼此重叠的 roadmap 顶层行
