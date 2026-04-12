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

`bootstrap host-neutral canonical storage workstream and define the first implementation slices`

## Done

- 已确认当前长期目标不应依赖 OpenClaw 宿主目录
- 已明确 `namespace != physical storage`
- OpenClaw 侧已经支持：
  - shared workspace namespace
  - optional agent sub namespace
- nightly self-learning 已能按 agent sub namespace 写入
- OpenClaw live 配置已经开启 `agentNamespace.enabled`

## In Progress

- 建立 `host-neutral-memory` 子项目控制面
- 把 durable 架构文档、roadmap、开发序列接进主控制面
- 收口 canonical registry root、compat fallback、迁移策略

## Blockers / Open Decisions

- canonical registry 默认根目录最终放在哪里：
  - `~/.unified-memory-core/registry`
  - 还是继续 env/config 驱动
- 过渡阶段是否需要：
  - 只读兼容旧 `~/.openclaw/...`
  - 或双写 / 一次性迁移
- shared / agent / session 三层里，哪些数据允许长期沉淀，哪些只该停留在短期层

## Exit Condition

- host-neutral registry 的目标边界、迁移路径、首批实现切片和验证方式都已明确
- 相关工作正式进入开发序列，不再只是架构讨论

## Next 3 Actions

1. 定义 host-neutral registry root resolution contract 与 fallback 顺序
2. 先把 OpenClaw / Codex registry path 对齐到同一 canonical root
3. 增加迁移报告与兼容验证，避免现有 live registry 被静默打断
