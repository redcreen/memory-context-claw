# Subproject Status

## Parent Phase / Milestone

`large project / stage transition / core-product`

## Goal

把 `src/unified-memory-core/` 维持成可扩展的共享记忆核心，并在 Stage 3 收口后，为 Stage 4 的 policy adaptation 打开明确 contract。

## Boundary

`core-product` 不是单独指 `self-learning`，而是：

- Source System
- Reflection System
- Memory Registry
- Projection System
- Governance System

这轮完成的工作是把 `self-learning` 这条最可能优先推进的增强主线，从“已有 baseline”推进到“Stage 3 生命周期显式完成”。

## Current Slice

`Stage 3 lifecycle baseline complete; Stage 4 contract planning next`

## Done

- contracts / source / registry / projection / governance baseline 已完成
- standalone runtime / CLI / daily reflection / independent execution 基线已落地
- Stage 3 self-learning lifecycle baseline 已完成：
  - promotion / decay / conflict / stable-update rules
  - learning-specific audit / repair / replay / time-window comparison
  - OpenClaw consumption validation
  - local `observation -> stable governed loop`
  - regression coverage

## In Progress

- 把 Stage 4 的 `policy-input artifact` contract 命名清楚
- 保持 Stage 3 baseline 的报告、回放路径和验证面稳定

## Blockers / Open Decisions

- Stage 4 应该先从 OpenClaw retrieval/assembly 还是 Codex task-side consumption 开始，仍待决定
- `policy-input artifact` 的 rollback / reversibility 约束仍需明确

## Exit Condition

- Stage 4 的首个 contract 和验证 slice 被明确命名，并进入正式执行线

## Next 3 Actions

1. 定义 `policy-input artifact` 的 shape、来源和 consumer boundary
2. 选择 Stage 4 的第一条 consumer path
3. 继续让 Stage 3 lifecycle regression 作为后续工作的硬证据面
