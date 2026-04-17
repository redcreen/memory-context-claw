# Stage 7 `Context Minor GC` 收口报告

[English](stage7-context-minor-gc-closeout-2026-04-18.md) | [中文](stage7-context-minor-gc-closeout-2026-04-18.zh-CN.md)

## 目标

正式关闭 Stage 7 `Context Minor GC / context loading optimization`：

- 不再只停留在 Stage 6 shadow measurement
- 用同一套 operator scorecard 证明更轻的 context package 不伤回答质量
- 让 Docker / hermetic / local evidence 能对齐到同一个 closeout 结论

## 本轮新增证据

- harder live matrix：
  - [openclaw-context-minor-gc-live-2026-04-17.md](openclaw-context-minor-gc-live-2026-04-17.md)
- Step 108 closeout：
  - [stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md](stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)
- Stage 7 shadow replay：
  - [dialogue-working-set-stage7-shadow-2026-04-17.md](dialogue-working-set-stage7-shadow-2026-04-17.md)
- Stage 7 scorecard：
  - [dialogue-working-set-scorecard-2026-04-17.md](dialogue-working-set-scorecard-2026-04-17.md)

## 当前收口证据

### 既有基线

- Stage 7 shadow replay：`15 / 16`
- Stage 7 scorecard：captured `16 / 16`
- average raw reduction ratio：`0.4191`
- average package reduction ratio：`0.1151`
- Step 108 hermetic gateway：`5 / 5` captured
- Step 108 本机 service smoke：`3 / 3` captured

### 本轮 harder live matrix

- total：`6`
- captured：`6 / 6`
- answerPassed：`6 / 6`
- relationPassed：`6 / 6`
- reductionPassed：`6 / 6`
- passed：`6 / 6`
- averagePromptTokens：`13126`
- averageDurationMs：`33616`
- averageRawReductionRatio：`0.5794`
- averagePackageReductionRatio：`0.3643`
- relationCounts：`switch = 5`，`continue = 1`

覆盖的 harder case class：

- `cross-source`
- `conflict / current-state override`
- `multi-step history`
- `open-loop return`
- 高信息密度自然中文多话题切换

## 结论

Stage 7 现在可以正式关闭。

这次 closeout 说明：

1. `Context Minor GC` 不再只是“有 shadow telemetry”，而是有正式 operator scorecard。
2. 插件内自托管 decision runner 已经足够支撑 hermetic / local live evidence，不需要修改 OpenClaw core。
3. harder live matrix 已经证明，更轻的 context package 在更难的 case class 下仍然不伤 answer-level 结果。

## 下一步边界

从这里开始，不再继续追问“Stage 7 有没有站稳”。

下一条主线切到 Stage 10：

1. 收 install / bootstrap / verify 的最短路径
2. 把 package / startup / first-run 成本收进 `轻快` 证据面
3. 为 Codex / 多实例共享底座补更强的产品证据
