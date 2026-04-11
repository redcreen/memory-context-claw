# Subproject Status

## Parent Phase / Milestone

`large project / governed execution / core-product`

## Goal

把 `src/unified-memory-core/` 这条产品主干维持成可扩展的共享记忆核心，而不是只服务当前 OpenClaw 适配层。

## Boundary

`core-product` 不是单独指 `self-learning`。

这里说的 `core-product`，指的是 `src/unified-memory-core/` 这一整条产品主干，包括：

- Source System
- Reflection System
- Memory Registry
- Projection System
- Governance System

关系是：

- `plugin-runtime` = OpenClaw 侧当前运行时行为
- `core-product` = 统一记忆核心产品主干
- `self-learning` = `core-product` 里最可能优先开启的下一增强方向之一，主要落在 Reflection / Registry / Projection / Governance 这几块

所以：

- `core-product` 不等于 `self-learning`
- `self-learning` 只是 `core-product` 后续 phase 的候选主线

## Current Slice

`baseline complete; waiting for next enhancement-phase planning`

## Done

- contracts / source / registry / projection / governance baseline 已完成
- standalone runtime / CLI / daily reflection / independent execution 基线已落地
- 模块视角控制面已建立

## In Progress

- 准备下一阶段增强入口，但还没有开启新的产品 phase

## Blockers / Open Decisions

- 下一阶段优先做 self-learning policy，还是继续扩 projection / governance，还未正式立项

## Exit Condition

- 下一增强 phase 被明确命名，并有单独的切片与验证方式

## Next 3 Actions

1. 把下一增强 phase 的目标从旧 baseline 文档中剥离出来
2. 明确下一阶段是“self-learning deeper policy”还是“projection/governance hardening”
3. 保持当前基线测试持续通过
