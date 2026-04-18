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

仓库当前已经不再处于 `Context Minor GC` 收口期。

- `Stage 11` 已完成
- 当前最新的大阶段是：`Stage 12: Realtime Memory Intent Productization`

这句话的意思是：

- `Context Minor GC` 现在已经在 OpenClaw + Codex 两侧可用
- 正例上已经能看到明确用户收益
- guarded seam 继续保持 `default-off` / opt-in only
- 当前真正新的主线，转到 realtime governed memory intake 的产品化与 operator 面

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
| Stage 11 | 已完成 | Context Minor GC and Codex integration | `Context Minor GC` 在 OpenClaw + Codex 两侧收口，可用且有明确用户收益 |
| Stage 12 | 当前大阶段 | realtime memory intent productization | 把 realtime governed memory intake 从 baseline 能力推进成清晰产品面与 operator 面 |

## Stage 11: Context Minor GC And Codex Integration

`Stage 11` 现在已经关闭。

它的完成标准不是“Minor GC 能不能跑”，而是：

- 整个 `Context Minor GC` 已经可用
- 用户端已经有明显收益
- rollback boundary 仍然清楚

### Stage 11 完成标准与结果

| 标准 | 收口要求 | 结果 |
| --- | --- | --- |
| GC 可用 | OpenClaw + Codex 都能消费同一套 decision contract / shadow / guarded seam | 已满足 |
| 用户收益 | 正例上有明确 prompt/context 缩减，且 answer-level 不回退 | 已满足 |
| 边界清楚 | `default-off` / opt-in only 继续成立，不隐式放量 | 已满足 |

### Stage 11 分组最终状态

| 分组 | 状态 | 目标 | 具体计划 |
| --- | --- | --- | --- |
| 11A `foundation-reframe` | 已完成 | 把 Stage 6 / 7 / 9 的 `Minor GC` 历史成果收成一个可读的大阶段叙事 | [Plan: 11A](reference/unified-memory-core/development-plan.zh-CN.md#group-11a-foundation-reframe) |
| 11B `openclaw-baseline-hold` | 已完成 | 保持 OpenClaw 侧 `Context Minor GC` scorecard、harder matrix、guarded 边界为绿，并补齐 closeout 证据 | [Plan: 11B](reference/unified-memory-core/development-plan.zh-CN.md#group-11b-openclaw-baseline-hold) |
| 11C `codex-context-bridge` | 已完成 | 把同一套 context decision / shadow / guarded / scorecard 接到 Codex adapter | [Plan: 11C](reference/unified-memory-core/development-plan.zh-CN.md#group-11c-codex-context-bridge) |
| 11D `cross-host-rollout-decision` | 已完成 | 明确跨宿主决策：能力已可用，但 guarded 继续保持 `default-off` / opt-in only | [Plan: 11D](reference/unified-memory-core/development-plan.zh-CN.md#group-11d-cross-host-rollout-decision) |

### Stage 11 收口证据

- [Stage 7 / Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- [Stage 7 `Context Minor GC` 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)
- [Codex Context Minor GC Live Matrix](../reports/generated/codex-context-minor-gc-live-2026-04-18/report.md)
- [Stage 11 收口报告](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)

## 如果你只想知道“Minor GC 还剩什么”

最短答案：

- `Minor GC` 这条主题本身已经完成
- OpenClaw + Codex 两侧都已经收口
- 当前剩下的不是“把 GC 做完”，而是：
  - 继续保持 `Context Minor GC` 证据面为绿
  - 进入新的产品阶段，处理 realtime memory intent 的产品化

## Stage 12: Realtime Memory Intent Productization

`Stage 12` 是当前最新的大阶段。主题只保留一件事：

- 把 realtime governed memory intake 从“baseline 能力”推进成真正的产品面和 operator 面

| 分组 | 状态 | 目标 | 具体计划 |
| --- | --- | --- | --- |
| 12A `contract-and-replay-hold` | 当前进行 | 把 `memory_intent` / `memory_extraction` / accepted-action 的实时入口、回放和文档契约收成同一条产品线 | [Plan: 12A](reference/unified-memory-core/development-plan.zh-CN.md#group-12a-contract-and-replay-hold) |
| 12B `ordinary-conversation-runtime-ingest` | 下一步 | 把普通对话与运行时 rule ingestion 接到同一套 governed realtime path | [Plan: 12B](reference/unified-memory-core/development-plan.zh-CN.md#group-12b-ordinary-conversation-runtime-ingest) |
| 12C `operator-surface-and-rollout` | 后续 | 把 inspect / audit / replay / rollback 与 rollout boundary 收成正式 operator 面 | [Plan: 12C](reference/unified-memory-core/development-plan.zh-CN.md#group-12c-operator-surface-and-rollout) |

## 阅读顺序

如果你现在要顺着看，不要再在旧报告之间跳：

1. 先看当前这页，确认 `Stage 11` 已完成、当前是 `Stage 12`
2. 如果你关心 `Minor GC`，先看 [Stage 11 收口报告](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)
3. 再看 [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)
4. 再看 [Stage 12 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-12-realtime-memory-intent-productization)
5. 需要核对历史证据时，再看：
   - [Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 7 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)
