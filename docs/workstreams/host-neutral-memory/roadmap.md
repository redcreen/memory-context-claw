# Host-Neutral Memory Workstream Roadmap

[English](#english) | [中文](#中文)

## English

## Purpose

This roadmap turns the host-neutral memory architecture into an implementation sequence.

It answers:

- what gets built first
- how OpenClaw-scoped storage is decoupled safely
- how Codex converges on the same durable registry
- which validations are required before migration is considered complete

## Workstream Goal

Build a host-neutral canonical memory layer for `Unified Memory Core` so that:

- OpenClaw and Codex can share one governed registry
- namespace layering stays logical rather than physical
- current local-first deployments keep working during the transition

## Current Status

- status: `planning-active / development-ready`
- dependency baseline:
  - shared contracts: `ready`
  - registry baseline: `ready`
  - OpenClaw adapter baseline: `ready`
  - Codex adapter baseline: `ready`
  - agent sub namespace baseline: `implemented`

## Phase Map

```mermaid
flowchart LR
    A["Phase 0\nBoundary + Contract"] --> B["Phase 1\nCanonical Root Resolution"]
    B --> C["Phase 2\nAdapter Convergence"]
    C --> D["Phase 3\nMigration + Compatibility"]
    D --> E["Phase 4\nGovernance + Hardening"]
```

## Phase 0: Boundary + Contract

Goal:

Define the stable product boundary for host-neutral canonical storage.

Scope:

- canonical registry ownership
- namespace vs storage rules
- shared / agent / session durability policy
- config and env resolution contract

Validation:

- boundary is documented
- storage rules are explicit
- first implementation slices are named

## Phase 1: Canonical Root Resolution

Goal:

Teach the runtime to resolve a host-neutral canonical registry root.

Scope:

- canonical root default
- config override
- env override
- compatibility fallback for current OpenClaw-scoped root

Validation:

- runtime resolves one canonical root deterministically
- current OpenClaw installs still work
- targeted tests cover resolution and fallback behavior

## Phase 2: Adapter Convergence

Goal:

Make OpenClaw and Codex resolve through the same memory root and namespace semantics.

Scope:

- OpenClaw adapter path alignment
- Codex adapter path alignment
- shared namespace and agent sub namespace parity
- projection compatibility

Validation:

- one workspace can be read by both adapters from the same registry
- agent-specific records remain scoped correctly
- no adapter-local duplicate stable-memory store is introduced

## Phase 3: Migration + Compatibility

Goal:

Move from OpenClaw-scoped storage semantics to host-neutral semantics without silent loss.

Scope:

- migration or adoption strategy
- registry report / inspection output
- live fallback behavior
- cutover rules

Validation:

- existing records remain visible
- migration is reversible or replayable
- governance surfaces still point to the correct root

## Phase 4: Governance + Hardening

Goal:

Harden the new storage boundary for long-term maintenance.

Scope:

- governance checks for root and namespace consistency
- regression coverage
- documentation and operator guidance

Validation:

- docs and runtime behavior match
- regression suite protects the shared-root path
- the new boundary is stable enough for future policy-adaptation work

## Immediate Execution Order

1. define root resolution contract
2. implement host-neutral root with compatibility fallback
3. align OpenClaw and Codex on shared root behavior
4. add migration/reporting and governance checks

Related:

- [architecture.md](architecture.md)
- [README.md](README.md)
- [../../../.codex/plan.md](../../../.codex/plan.md)

## 中文

## 目的

这份路线图把 host-neutral memory 架构收成可执行的实现序列。

它回答的是：

- 先做什么
- 如何安全地从 OpenClaw-scoped storage 解耦
- Codex 如何收敛到同一套 durable registry
- 迁移完成前必须通过哪些验证

## 工作流目标

为 `Unified Memory Core` 建立一套宿主无关的 canonical memory layer，使得：

- OpenClaw 和 Codex 可以共享一套 governed registry
- namespace 分层保持逻辑意义，而不是拆物理存储
- 当前 local-first 部署在过渡期仍然可用

## 当前状态

- 状态：`planning-active / development-ready`
- 依赖基线：
  - shared contracts：`ready`
  - registry baseline：`ready`
  - OpenClaw adapter baseline：`ready`
  - Codex adapter baseline：`ready`
  - agent sub namespace baseline：`implemented`

## Phase Map

```mermaid
flowchart LR
    A["Phase 0<br/>Boundary + Contract"] --> B["Phase 1<br/>Canonical Root Resolution"]
    B --> C["Phase 2<br/>Adapter Convergence"]
    C --> D["Phase 3<br/>Migration + Compatibility"]
    D --> E["Phase 4<br/>Governance + Hardening"]
```

## Phase 0：边界与契约

目标：

定义 host-neutral canonical storage 的稳定产品边界。

范围：

- canonical registry ownership
- namespace 与 storage 规则
- shared / agent / session 的长期性策略
- config / env resolution contract

验证：

- 边界被文档化
- storage 规则明确
- 首批实现切片被命名

## Phase 1：Canonical Root Resolution

目标：

让 runtime 能确定性地解析 host-neutral canonical registry root。

范围：

- canonical root default
- config override
- env override
- 当前 OpenClaw-scoped root 的 compatibility fallback

验证：

- runtime 能确定性解析一个 canonical root
- 当前 OpenClaw 安装仍然可用
- targeted tests 覆盖 resolution 和 fallback 行为

## Phase 2：Adapter Convergence

目标：

让 OpenClaw 和 Codex 通过同一 memory root 和同一套 namespace 语义接入。

范围：

- OpenClaw adapter path 对齐
- Codex adapter path 对齐
- shared namespace 与 agent sub namespace 语义对齐
- projection compatibility

验证：

- 同一 workspace 可被两个 adapter 从同一 registry 读取
- agent-specific records 仍能正确隔离
- 不引入 adapter-local duplicate stable-memory store

## Phase 3：Migration + Compatibility

目标：

在不静默丢失数据的前提下，从 OpenClaw-scoped storage 语义迁移到 host-neutral 语义。

范围：

- migration / adoption 策略
- registry report / inspection 输出
- live fallback 行为
- cutover 规则

验证：

- 已有 records 仍然可见
- 迁移可回退或可 replay
- governance 输出仍指向正确 root

## Phase 4：Governance + Hardening

目标：

把新的 storage boundary 收到可长期维护的状态。

范围：

- root / namespace 一致性的治理检查
- regression coverage
- 文档和运维说明

验证：

- docs 和 runtime 行为一致
- regression suite 能保护 shared-root 路径
- 新边界稳定到足以支撑后续 policy-adaptation work

## 立即执行顺序

1. 先定义 root resolution contract
2. 实现 host-neutral root 与 compatibility fallback
3. 对齐 OpenClaw / Codex shared root 行为
4. 再补 migration/reporting 和 governance checks

相关文档：

- [architecture.md](architecture.md)
- [README.md](README.md)
- [../../../.codex/plan.md](../../../.codex/plan.md)
