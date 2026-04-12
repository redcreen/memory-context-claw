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

`migration/reporting hardening implemented; move to cutover decision and live adoption tracking`

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

## In Progress

- 观察 live topology，决定 canonical root 的正式 adoption 窗口
- 确认是否把 registry-root consistency 从 governance cycle 提升为独立 governance gate

## Blockers / Open Decisions

- canonical registry 默认根目录最终放在哪里：
  - `~/.unified-memory-core/registry`
  - 还是继续 env/config 驱动
- 过渡阶段是否需要：
  - 只读兼容旧 `~/.openclaw/...`
  - 或双写 / 一次性迁移
- shared / agent / session 三层里，哪些数据允许长期沉淀，哪些只该停留在短期层
- Codex 信号应该通过：
  - nightly collector 扫描 registry write-back
  - 单独的 Codex daily reflection
  - 还是统一 host-neutral ingestion service

## Exit Condition

- host-neutral registry 的目标边界、迁移路径、首批实现切片和验证方式都已明确
- 相关工作正式进入开发序列，不再只是架构讨论

## Next 3 Actions

1. 决定是否把 registry-root consistency 升成独立强门禁
2. 持续观察 canonical / legacy 是否保持 mirrored 或完全收敛
3. 把下一执行重心切回 recall quality 主线
