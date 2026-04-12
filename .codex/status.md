# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-12`

## Current Phase

`governed execution / module-view active`

## Active Slice
`advance-openclaw-adapter-recall-quality`

## Done

- 项目主链已完成：抓记忆 -> 提炼 fact/card -> 检索与 assembly -> 回归与治理
- `memory search` A-E phases 已完成
- `workspace/` 已并入项目
- 主文档体系已建立：
  - `README.md`
  - `configuration.md`
  - `project-roadmap.md`
  - `system-architecture.md`
  - `testsuite.md`
- `memory-search governance` 已有上下文纯度指标：
  - `pluginSingleCard`
  - `pluginMultiCard`
  - `pluginNoisySupporting`
  - `pluginUnexpectedSupportingTotal`
- 最新专项治理状态：
  - `pluginSignalHits = 6/6`
  - `pluginSourceHits = 6/6`
  - `pluginFailures = 0`
  - `pluginSingleCard = 6/6`
  - `pluginMultiCard = 0/6`
  - `pluginNoisySupporting = 0/6`
- `eval:smoke-promotion` 已落地，作为是否升格进 smoke 的建议入口
- self-learning 基线已实现：
  - declared-source ingestion
  - reflection / daily reflection
  - candidate -> stable promotion baseline
  - standalone CLI / runtime
  - export / governance audit surfaces
- 本次整改已补齐 `.codex` 控制面
- 模块视角控制面已补齐：
  - `docs/module-map.md`
  - `.codex/module-dashboard.md`
  - `.codex/modules/*.md`
- README / COMMANDS / 主 roadmap 已接入模块视角入口
- OpenClaw `code` agent 和 Codex 现在已经可以：
  - 共用同一 registry
  - 共用 `code-workspace`
  - 共用 shared workspace + agent sub namespace 双层读写面
- OpenClaw 已支持 `agentWorkspaceIds`，避免全局 `workspaceId` 误伤所有 agent
- Codex task/write-back 信号已纳入 nightly self-learning ingestion
- host-neutral registry root 已支持：
  - explicit `registryDir`
  - `UMC_REGISTRY_DIR`
  - canonical root
  - legacy OpenClaw fallback
- standalone CLI / runtime 已支持 registry-root inspect

## In Progress

- 启动 `host-neutral-memory` 子项目，把 canonical storage 从 OpenClaw 宿主语义里解耦
- 为 OpenClaw / Codex 共享同一 registry root 定义实现边界和迁移路径
- canonical root 现在已有 topology inspect、non-destructive migration 和 operator-visible findings
- registry-root consistency 已进入 governance cycle 输出
- `install-verify` / `workspace-notes-rule` / `pending-rule` 三条自然 query 已补进 memory-search governance case 面
- 文档整改后的 stable card 读取路径已对齐到 `docs/reference/*`
- `workspace-layering` / `lossless-understanding` / `provider-role` / `release-install` / `project-roadmap-nav` 五条自然 query 已补进 memory-search governance case 面
- release/install stable card 提取已兼容当前 README 的 `Stable release` / `Development head` 表述
- generated smoke baseline 报告里的 case 总数已从陈旧的 `24/24` 校正到 `25/25`
- smoke 里的剩余 13 条自然 query 已全部补进 governance；当前 `smoke-cases` 与 `memory-search-cases` 的自然 query 缺口已归零
- 这 13 条新增治理 case 当前结果为 `pluginSignalHits = 13/13`、`pluginSourceHits = 13/13`、`pluginFastPathLikely = 13/13`
- 按模块视角继续推进 `openclaw-adapter`
- 保持 `governance-system` 作为常规治理面运行
- 把 self-learning 文档口径与当前实现状态重新对齐
- 为 `reflection-system` / `projection-system` / `codex-adapter` 明确下一增强入口

## Blockers / Open Decisions

- `todo.md` 当前仍是用户自留短记，不应与 `.codex/status.md` 重叠承担当前状态职责
- 是否要把 `reports/` 下部分高频专题文档再进一步按 `durable` / `generated` 分层，目前尚未执行
- canonical root 何时从 legacy fallback 正式切到 `~/.unified-memory-core/registry`，仍需明确迁移窗口
- 是否还要把 registry-root consistency 升成独立强门禁，目前仍待决定；但它已进入常规 governance cycle

## Next 3 Actions

1. 评估这批新增治理 case 中哪些还值得进入 `eval:smoke-promotion`
2. 继续推进 `openclaw-adapter` 的稳定事实 / 稳定规则扩面
3. 再决定是否把 registry-root consistency 从 governance cycle 提升成独立强门禁

## Architecture Supervision
- Signal: `yellow`
- Signal Basis: open blockers or architectural risks are still recorded
- Root Cause Hypothesis: the repo can drift back to local fixes if the current slice loses a visible architectural checkpoint
- Correct Layer: control surface, validators, and reporting
- Escalation Gate: raise but continue

## Current Escalation State
- Current Gate: raise but continue
- Reason: the current direction can continue, but the supervision state should stay visible
- Next Review Trigger: review again when blockers change, the active slice rolls forward, or release-facing work begins

## Current Execution Line
- Objective: 继续扩稳定事实 / 稳定规则，同时保持 recalled context 干净
- Plan Link: advance-openclaw-adapter-recall-quality
- Runway: one active-slice checkpoint covering implementation, validation, and state refresh
- Progress: 0 / 9 tasks complete
- Stop Conditions:
  - blocker requires human direction
  - validation fails and changes the direction
  - business, compatibility, or cost decision requires user judgment

## Execution Tasks
- [ ] EL-1 confirm the checkpoint and objective for `advance-openclaw-adapter-recall-quality`: 继续扩稳定事实 / 稳定规则，同时保持 recalled context 干净
- [ ] EL-2 verify dependencies and affected boundaries: `.codex/modules/openclaw-adapter.md`、smoke surfaces、promotion helper
- [ ] EL-3 confirm architecture signal, root-cause hypothesis, and correct layer still hold
- [ ] EL-4 implement the highest-value change for `advance-openclaw-adapter-recall-quality`
- [ ] EL-5 address the main execution risk: supporting context 再次变脏，或 smoke 面扩张过快
- [ ] EL-6 update docs, control-surface notes, or contracts touched by this slice
- [ ] EL-7 run validation: `npm run smoke:eval`、相关 targeted tests、`npm run eval:smoke-promotion`
- [ ] EL-8 refresh progress, capabilities, next checkpoint, and next 3 actions
- [ ] EL-9 capture a devlog entry if the root cause, tradeoff, or rejected shortcut changed

## Development Log Capture
- Trigger Level: high
- Pending Capture: no
- Last Entry: docs/devlog/2026-04-12-converge-architecture-retrofit-for-unified-memory-core.md
