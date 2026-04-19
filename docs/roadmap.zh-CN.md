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

仓库当前已经把 `Stage 11` 真正收口，当前最新大阶段切到 `Stage 12`。

- `Stage 11` 已完成
- 当前最新的大阶段是：`Stage 12: Realtime Memory Intent Productization`
- `Codex` 侧 host-visible gap 保留为后续独立优化，不再阻塞 `Stage 11`

这句话的意思是：

- `Context Minor GC` 现在已经在 OpenClaw + Codex 两侧可用
- OpenClaw 侧“用户明显有体感”的 closeout 证据已经补齐
- guarded seam 继续保持 `default-off` / opt-in only
- 当前真正主线，已经转入 Stage 12 的产品化工作

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
| Stage 11 | 已完成 | Context Minor GC and Codex integration | OpenClaw 侧 host-visible closeout 已补齐；Codex host-visible gap 不再阻塞 Stage 11 关闭 |
| Stage 12 | 当前大阶段 | realtime memory intent productization | 把 realtime governed memory intake 从 baseline 能力推进成清晰产品面与 operator 面 |

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
| 边界清楚 | `default-off` / opt-in only 继续成立，不隐式放量 | 已满足 |

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

## 如果你只想知道“Minor GC 还剩什么”

最短答案：

- `Minor GC` 的核心能力已经完成
- OpenClaw + Codex 两侧的能力链路已经跑通
- OpenClaw 用户体感 closeout 已补齐；Stage 11 不再阻塞 Stage 12

## Stage 12: Realtime Memory Intent Productization

`Stage 12` 不是当前大阶段，而是下一条独立主题。主题只保留一件事：

- 把 realtime governed memory intake 从“baseline 能力”推进成真正的产品面和 operator 面

| 分组 | 状态 | 目标 | 具体计划 |
| --- | --- | --- | --- |
| 12A `contract-and-replay-hold` | 下一大阶段 | 把 `memory_intent` / `memory_extraction` / accepted-action 的实时入口、回放和文档契约收成同一条产品线 | [Plan: 12A](reference/unified-memory-core/development-plan.zh-CN.md#group-12a-contract-and-replay-hold) |
| 12B `ordinary-conversation-runtime-ingest` | 下一步 | 把普通对话与运行时 rule ingestion 接到同一套 governed realtime path | [Plan: 12B](reference/unified-memory-core/development-plan.zh-CN.md#group-12b-ordinary-conversation-runtime-ingest) |
| 12C `operator-surface-and-rollout` | 后续 | 把 inspect / audit / replay / rollback 与 rollout boundary 收成正式 operator 面 | [Plan: 12C](reference/unified-memory-core/development-plan.zh-CN.md#group-12c-operator-surface-and-rollout) |

## 阅读顺序

如果你现在要顺着看，不要再在旧报告之间跳：

1. 先看当前这页，确认 `Stage 11` 已关闭、当前主线已切到 `Stage 12`
2. 如果你关心 `Minor GC`，先看 [Stage 11 收口报告](../reports/generated/stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)
3. 再看 [Context Minor GC 架构页](reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)
4. 再看 [Stage 11 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-11-context-minor-gc-and-codex-integration)
5. 在确认 Stage 11 真正关闭后，再看 [Stage 12 具体计划](reference/unified-memory-core/development-plan.zh-CN.md#stage-12-realtime-memory-intent-productization)
6. 需要核对历史证据时，再看：
   - [Step 108 收口报告](../reports/generated/stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 7 收口报告](../reports/generated/stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
   - [Stage 9 收口报告](../reports/generated/stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)

## 总体进展
| 项目 | 当前值 |
| --- | --- |
| 总体进度 | 2 / 3 execution tasks 完成 |
| 当前阶段 | `stage11-context-minor-gc-user-visible-closeout-reopened` |
| 当前切片 | `stage11-context-minor-gc-user-visible-closeout-reopened / group-11g-host-visible-validation-and-closeout` |
| 当前目标 | 只解决“用户体感不明显”的问题；先控宿主增长源，再把 carry-forward 收成 summary-first，最后用 host-visible 指标重新判定 closeout |
| 当前切片退出条件 | npm run codex:vscode:gc --silent`、Codex VS Code live telemetry、`test/codex-context-minor-gc.test.js`、`test/codex-vscode-context-minor-gc.test.js`、对比前后 host growth 的真实会话证据 |
| 明确下一步动作 | 当前 execution tasks 已完成，转向下一切片 |
| 下一候选切片 | n/a |

查看详细执行计划：[project-assistant/development-plan.zh-CN.md](reference/project-assistant/development-plan.zh-CN.md)


详细执行队列看这里：

- [unified-memory-core/development-plan.zh-CN.md](reference/unified-memory-core/development-plan.zh-CN.md)

## 当前 / 下一步 / 更后面
| 时间层级 | 重点 | 退出信号 |
| --- | --- | --- |
| 当前 | 只解决“用户体感不明显”的问题；先控宿主增长源，再把 carry-forward 收成 summary-first，最后用 host-visible 指标重新判定 closeout | npm run codex:vscode:gc --silent`、Codex VS Code live telemetry、`test/codex-context-minor-gc.test.js`、`test/codex-vscode-context-minor-gc.test.js`、对比前后 host growth 的真实会话证据 |
| 下一步 | 暂无 | 暂无 |
| 更后面 | 暂无 | 暂无 |

## 里程碑规则
- 一个里程碑只对应一个清晰的主题目标
- 标成 `done` / `已完成` 就表示这一项真的已经完整完成
- 不要把同一条工作主题拆到多个顶层里程碑里
- 细分步骤放进 development plan，不要塞进彼此重叠的 roadmap 顶层行
