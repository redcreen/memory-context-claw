# OpenClaw Adapter Roadmap

[English](openclaw-adapter.md) | [中文](openclaw-adapter.zh-CN.md)

## 目标

把当前仓库形态正式收口到 `OpenClaw Adapter` 边界。

当前状态：

- `step-8 设计包已完成`
- 下一阶段进入实现

## 分阶段计划

### Phase 1. 边界与 namespace

- OpenClaw namespace mapping
- adapter consumption contract
- export-loading rules
- local-first 的多 agent 规则

### Phase 2. 运行时集成

- retrieval integration
- scoring / assembly integration
- adapter compatibility checks
- shared-workspace-safe 的 export consumption

### Phase 3. 加固

- regression protection
- host-compatibility audits
- 清理 legacy naming / path 残留
- 面向 future shared-registry 的 readiness checks

## 退出标准

- OpenClaw 只通过 adapter boundary 消费产品 exports
- adapter 行为持续有 regression 保护
- legacy runtime confusion 被清理
- local-first 与 shared-workspace 行为保持显式且受治理
