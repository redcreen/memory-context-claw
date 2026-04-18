# 路线图

[English](roadmap.md) | [中文](roadmap.zh-CN.md)

## 这页怎么读

这页只做 3 件事：

1. 保留完整的阶段顺序，不删除历史阶段
2. 明确告诉你“当前最新的大阶段是什么”
3. 把最新阶段直接链接到 [development plan](reference/unified-memory-core/development-plan.zh-CN.md) 的具体执行组

这里的状态语义固定不变：

- `已完成` = 这一项真的已经完整关闭，不会再把同一项工作拆到别的顶层 Stage 继续做
- `当前大阶段` = 当前所有剩余工作都应当挂在这里，而不是分散到多个大项

如果你现在最关心的是 `Context Minor GC`，先看：

- [Stage 11: Context Minor GC And Codex Integration](#stage-11-context-minor-gc-and-codex-integration)
- [Stage 11 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-11-context-minor-gc-and-codex-integration)
- [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)

## 当前一句话

现在仓库不再处于“Stage 7 / 9 收口期”，而是进入了一个新的总阶段：

- `Stage 11: Context Minor GC And Codex Integration`

这个总阶段的意思不是“Stage 7 / 9 没做完”，而是：

- 保留 Stage 7 / 9 这些已经完成的历史主题
- 把 **剩余的 `Minor GC` 工作** 收进一个统一的大阶段
- 把同一套 context decision / scorecard / rollback boundary 正式扩到 Codex
- 在跨宿主证据出来之前，不做默认路径放量

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
| Stage 9 | 已完成 | guarded smart-path promotion | bounded opt-in active path 收口，但继续 `default-off` |
| Stage 10 | 已完成 | adoption simplification and shared-foundation proof | 最短接入路径、Codex / 多实例 shared proof 收口 |
| Stage 11 | 当前大阶段 | Context Minor GC and Codex integration | 把所有剩余的 Minor GC 工作收成统一大阶段，并把 Codex 对接纳入正式计划 |

## Stage 11: Context Minor GC And Codex Integration

Stage 11 是当前最新的大阶段。它下面不是一条线到底，而是 4 个分组：

| 分组 | 状态 | 目标 | 具体计划 |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | 已完成 | 把 Stage 6 / 7 / 9 的 `Minor GC` 历史成果收成一个可读的大阶段叙事 | [Plan: 11A](reference/unified-memory-core/development-plan.zh-CN.md#group-11a-foundation-reframe) |
| 11B `openclaw-baseline-hold` | 当前进行 | 保持 OpenClaw 侧 `Context Minor GC` scorecard、harder matrix、guarded 边界长期为绿 | [Plan: 11B](reference/unified-memory-core/development-plan.zh-CN.md#group-11b-openclaw-baseline-hold) |
| 11C `codex-context-bridge` | 下一步 | 把同一套 context decision / shadow / guarded / scorecard 接到 Codex adapter | [Plan: 11C](reference/unified-memory-core/development-plan.zh-CN.md#group-11c-codex-context-bridge) |
| 11D `cross-host-rollout-decision` | 后续 | 只有 OpenClaw + Codex 两侧证据都够硬后，才讨论是否扩大默认路径 | [Plan: 11D](reference/unified-memory-core/development-plan.zh-CN.md#group-11d-cross-host-rollout-decision) |

### Stage 11 已完成的基础部分

这些已经不是 blocker：

- Stage 6 runtime shadow integration
- Stage 7 / Step 108
- Stage 7 / `104` harder live matrix
- Stage 9 guarded smart path

对应报告：

- [Stage 7 / Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- [Stage 7 `Context Minor GC` 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)

### Stage 11 当前真正正在做什么

当前重点不再是“继续证明 Minor GC 能不能跑通”，而是：

1. 保持 OpenClaw 侧 `Context Minor GC` 证据面长期为绿
2. 把 `Codex` 对接纳入同一个大阶段，而不是继续散落在 Stage 10 证明里
3. 把默认路径放量决策明确延后，直到跨宿主证据完整

## 如果你只想知道“Minor GC 还剩什么”

最短答案：

- `Minor GC` 的 OpenClaw 基础能力闭环已经完成
- 当前还剩下的，不是“Minor GC 本身没做完”
- 当前剩下的是：
  - Stage 11B：保持 OpenClaw 侧 operator baseline
  - Stage 11C：完成 Codex context bridge
  - Stage 11D：做跨宿主 rollout 决策

## 当前 / 下一步 / 更后面

| 时间层级 | 重点 | 退出信号 |
| --- | --- | --- |
| 当前 | Stage 11B：保持 OpenClaw 侧 `Context Minor GC` 与 guarded baseline 长期为绿 | scorecard、harder matrix、guarded live A/B 不回退 |
| 下一步 | Stage 11C：把 Codex context bridge 接进同一套 decision contract / shadow / guarded / scorecard | Codex adapter replay、tests、cross-host report 全部对齐 |
| 更后面 | Stage 11D：是否扩大默认路径，必须在跨宿主证据下单独决策 | 有正式 rollout ADR / report，而不是隐式放量 |

## 阅读顺序

如果你现在要顺着看，不要再在旧报告之间跳：

1. 先看当前这页，确认现在处于 `Stage 11`
2. 再看 [Stage 11 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-11-context-minor-gc-and-codex-integration)
3. 再看 [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)
4. 需要核对历史证据时，再看：
   - [Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 7 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)
