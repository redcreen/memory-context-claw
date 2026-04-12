# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-11`

## Current Phase

`governed execution / module-view active`

## Active Slice

`bootstrap host-neutral-memory subproject and define canonical storage decoupling slices`

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

## In Progress

- 启动 `host-neutral-memory` 子项目，把 canonical storage 从 OpenClaw 宿主语义里解耦
- 为 OpenClaw / Codex 共享同一 registry root 定义实现边界和迁移路径
- 按模块视角继续推进 `openclaw-adapter`
- 保持 `governance-system` 作为常规治理面运行
- 把 self-learning 文档口径与当前实现状态重新对齐
- 为 `reflection-system` / `projection-system` / `codex-adapter` 明确下一增强入口

## Blockers / Open Decisions

- `todo.md` 当前仍是用户自留短记，不应与 `.codex/status.md` 重叠承担当前状态职责
- 是否要把 `reports/` 下部分高频专题文档再进一步按 `durable` / `generated` 分层，目前尚未执行
- host-neutral registry 的默认根目录、compat fallback 和迁移策略尚未锁定

## Next 3 Actions

1. 定义 host-neutral registry root resolution contract 与 fallback 顺序
2. 让 OpenClaw / Codex 收敛到同一 canonical registry root
3. 再继续推进 `openclaw-adapter` 的稳定事实 / 稳定规则扩面
