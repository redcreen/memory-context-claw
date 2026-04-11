# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-11`

## Current Phase

`retrofit complete / execution resumed`

## Active Slice

`module-view control surface established; next return to governed execution`

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
- 本次整改已补齐 `.codex` 控制面
- 模块视角控制面已补齐：
  - `docs/module-map.md`
  - `.codex/subprojects/core-product.md`
  - `.codex/subprojects/plugin-runtime.md`
  - `.codex/subprojects/memory-governance.md`

## In Progress

- 把后续恢复入口从“全局文档视角”切到“模块 + 子项目状态视角”

## Blockers / Open Decisions

- `todo.md` 当前仍是用户自留短记，不应与 `.codex/status.md` 重叠承担当前状态职责
- 是否要把 `reports/` 下部分高频专题文档再进一步按 `durable` / `generated` 分层，目前尚未执行

## Next 3 Actions

1. 恢复时优先看 `docs/module-map.md` 和 `.codex/subprojects/*.md`
2. 继续扩新的稳定事实 / 稳定规则，并同步 smoke / docs / governance
3. 如果出现新的 memory-search 专项 case，先过 `eval:smoke-promotion`，再决定是否值得升进 smoke
