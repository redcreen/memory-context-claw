# OpenClaw Adapter Roadmap

[English](#english) | [中文](#中文)

## English

## Goal

Move the current repo shape onto the formal OpenClaw adapter boundary.

Current status:

- `step-8 design package complete`
- implementation is the next phase

## Phases

### Phase 1. Boundary and namespace

- OpenClaw namespace mapping
- adapter consumption contract
- export-loading rules
- local-first multi-agent rules

### Phase 2. Runtime integration

- retrieval integration
- scoring / assembly integration
- adapter compatibility checks
- shared-workspace-safe export consumption

### Phase 3. Hardening

- regression protection
- host-compatibility audits
- migration cleanup from legacy naming and paths
- future shared-registry readiness checks

## Exit Criteria

- OpenClaw consumes product exports only through the adapter boundary
- adapter behavior stays regression-covered
- legacy runtime confusion is removed
- local-first and shared-workspace behavior stay explicit and governed

## 中文

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
