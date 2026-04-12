# Subproject Status

## Parent Phase / Milestone

`large project / governed execution / host-neutral-memory`

## Goal

把 `Unified Memory Core` 的 canonical memory 从 OpenClaw 宿主语义里解耦出来，收成一套 host-neutral 的共享记忆底座，让 OpenClaw / Codex 未来都能接到同一个 registry，而不是各自持有一份长期记忆。

## Boundary

这个子项目处理的是：

- canonical storage root
- namespace 和 storage 的解耦
- shared workspace namespace + optional agent sub namespace 的长期语义
- OpenClaw / Codex 通过同一 registry 接入的适配边界
- 兼容迁移与过渡期 fallback

这个子项目不处理的是：

- 远程共享服务化
- 多租户权限系统
- 替换 OpenClaw 的全部 host memory 能力
- 一次性重写现有 retrieval / assembly 主链

## Current Slice

`cutover policy explicit; move to canonical-root monitoring`

## Done

- 已确认当前长期目标不应依赖 OpenClaw 宿主目录
- 已明确 `namespace != physical storage`
- OpenClaw 侧已经支持：
  - shared workspace namespace
  - optional agent sub namespace
- nightly self-learning 已能按 agent sub namespace 写入
- OpenClaw live 配置已经开启 `agentNamespace.enabled`
- OpenClaw 已支持 `agentWorkspaceIds`
- `code` agent 与 Codex 已可对齐到同一 `code-workspace` 和同一 agent sub namespace
- Codex task/write-back 已进入 nightly self-learning ingestion
- canonical registry root 已支持 host-neutral resolution 和 legacy fallback
- standalone runtime / CLI 已能 inspect 当前 registry-root topology
- standalone runtime / CLI 已能做 non-destructive registry migration/adoption
- registry-root findings 现在对 operator 可见
- registry-root consistency 已进入 governance cycle 输出
- canonical root cutover policy 已显式化：
  - `~/.unified-memory-core/registry` 是默认 operator 目标
  - active root 已可稳定解析到 canonical root
  - `legacy_fallback` / canonical 缺失 才是 block 条件
  - legacy divergence 在 canonical active 时只保留 advisory 语义

## In Progress

- 观察 live topology，确保 active root 不回退到 `legacy_fallback`
- 保持 CLI、公开文档和控制面里的 cutover 规则一致

## Blockers / Open Decisions

- 什么时候清理过时的 legacy root 副本，仍属于 operator 选择
- shared / agent / session 三层里，哪些数据允许长期沉淀，哪些只该停留在短期层
- Codex 信号应该通过：
  - nightly collector 扫描 registry write-back
  - 单独的 Codex daily reflection
  - 还是统一 host-neutral ingestion service

## Exit Condition

- host-neutral registry 的目标边界、迁移路径、首批实现切片和验证方式都已明确
- 相关工作正式进入开发序列，不再只是架构讨论

## Next 3 Actions

1. 持续观察 `registry inspect` 是否保持 `operatorPolicy = adopt_canonical_root`
2. 仅在 operator 明确需要时，再决定 legacy root archive / cleanup 窗口
3. 把下一执行重心切回 recall quality 主线
