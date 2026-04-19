# Stage 11 `Context Minor GC And Codex Integration` 收口报告

[English](stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.md) | [中文](stage11-context-minor-gc-and-codex-integration-closeout-2026-04-18.zh-CN.md)

## 目标

按最终关闭标准，正式收口 `Stage 11`：

- 整个 `Context Minor GC` 已经可用，不再只是 OpenClaw 单宿主里的实验能力
- OpenClaw 用户端已经有明确可见的收益，而不是只有 shadow telemetry
- rollback boundary 仍然清楚，不通过隐式放量来“伪收口”

## Stage 11 的完成标准

| 标准 | 收口要求 | 当前结果 |
| --- | --- | --- |
| GC 可用 | OpenClaw 与 Codex 两侧都能跑通同一套 decision contract / shadow / guarded seam | 已满足 |
| 用户收益 | OpenClaw 正例上出现明确 prompt/context 缩减，而且在更长多轮对话里不依赖 `compact` 也能看到 thread 变薄 | 已满足 |
| 边界清楚 | `default-off` / opt-in only 继续成立，不把 guarded path 偷偷扩大成默认路径 | 已满足 |

## 当前证据

### OpenClaw 侧

- [Stage 7 / Step 108 收口报告](stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
  - hermetic gateway `5 / 5 captured`
  - 本机 service smoke `3 / 3 captured`
- [Stage 7 `Context Minor GC` 收口报告](stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)
  - harder live matrix `6 / 6`
  - average raw reduction ratio `0.6556`
  - average package reduction ratio `0.4657`
- [Stage 9 收口报告](stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)
  - baseline `4 / 4`
  - guarded `4 / 4`
  - guarded applied `2 / 4`
  - activation matched `4 / 4`
  - false activations `0`
  - missed activations `0`
- [OpenClaw Guarded Session Probe `stress` Docker 报告](openclaw-guarded-session-probe-stress-docker-2026-04-19.md)
  - `baseline peakBeforeSwitch = 14054`
  - `guarded peakBeforeSwitch = 14264`
  - `baseline postSwitchMin = 14155`
  - `guarded postSwitchMin = 12458`
  - `guarded rollbackRatio = 0.1266`
  - `guarded postSwitch savings vs baseline = 0.1199`
  - 不使用 `compact`
  - checkpoint `2 / 2`

### Codex 侧

- [Codex Context Minor GC Live Matrix](codex-context-minor-gc-live-2026-04-18/report.md)
  - baseline passed `4 / 4`
  - minor-gc passed `4 / 4`
  - guarded applied `2`
  - activation matched `4 / 4`
  - false activations `0`
  - missed activations `0`
  - average prompt reduction ratio `0.1469`
  - applied-only prompt reduction ratio `0.2939`
  - applied-only package reduction ratio `0.3553`

## 用户视角解释

`Stage 11` 关闭，不代表“默认所有路径都已经自动变轻”，而是代表：

1. `Context Minor GC` 已经不是只能在 OpenClaw 里看的研究路径。
2. 同一套 bounded decision contract 现在已经能进 OpenClaw 和 Codex 两条消费路径。
3. OpenClaw 正例上用户已经能看到明确收益：
   - OpenClaw harder live matrix 平均 package reduction ratio `0.4657`
   - OpenClaw Docker `stress` 长会话里，切题窗口 `guarded postSwitch savings vs baseline = 0.1199`
   - OpenClaw Docker `stress` 长会话里，不依赖 `compact` 也能看到 `rollbackRatio = 0.1266`
4. Codex 侧当前保留为 capability / maintenance 路径，但不再作为 Stage 11 收口 blocker。
5. 负例没有误激活，说明它不是“为了缩而缩”。

## 明确决策

`Stage 11` 现在可以关闭。

关闭后的明确结论是：

- `Context Minor GC` 已经是一条**可用能力**，不是 shadow-only 研究线
- “整个 GC 可用；OpenClaw 用户端有明显收益”这个标准现在已经满足
- guarded seam 继续保持 `default-off` / opt-in only
- 不会因为 `Stage 11` 关闭，就把默认 active path 隐式放量

## 没有包含在 Stage 11 里的事

这些不是 `Stage 11` 的未完成项：

- Codex host-visible closeout
- 更宽的默认 rollout
- 更激进的 `Stage 0 Router`
- 更深的 task-state ledger 结构化
- ordinary conversation / `memory_intent` 的下一轮产品化

它们应该进入新的后续阶段，而不是继续挂在 `Stage 11` 名下。

## 下一阶段

`Stage 11` 关闭后，仓库当前切到：

- `Stage 12: Realtime Memory Intent Productization`

也就是：

- 继续保持 `Context Minor GC` 为绿
- 但真正新的主线，转到 realtime governed memory intake 的产品化与 operator 面
