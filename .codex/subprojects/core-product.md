# Subproject Status

## Parent Phase / Milestone

`large project / stage transition / core-product`

## Goal

把 `src/unified-memory-core/` 维持成可扩展的共享记忆核心，在 Stage 4 policy adaptation 收口后，为 Stage 5 product hardening 打开明确执行入口。

## Boundary

`core-product` 不是单独指 `self-learning`，而是：

- Source System
- Reflection System
- Memory Registry
- Projection System
- Governance System

这轮完成的工作是把 `self-learning` 这条增强主线，从“生命周期已显式”推进到“policy adaptation 与多消费者使用已显式收口”。

## Current Slice

`Stage 4 policy adaptation complete; Stage 5 hardening next`

## Done

- contracts / source / registry / projection / governance baseline 已完成
- standalone runtime / CLI / daily reflection / independent execution 基线已落地
- Stage 3 self-learning lifecycle baseline 已完成
- Stage 4 policy adaptation 与多消费者使用已完成：
  - `policy-input artifact` contract
  - governed policy projections for `generic / openclaw / codex`
  - OpenClaw retrieval / assembly policy context
  - Codex task-side `policy_block / task_defaults`
  - rollback / compatibility / namespace / visibility audit
  - local reproducible `policy-loop`

## In Progress

- 把 Stage 4 policy loop 作为后续 hardening 的固定证据面
- 为 Stage 5 product hardening 冻结第一个执行 slice

## Blockers / Open Decisions

- Stage 5 应该先从 source adapters、maintenance workflow 还是 release-boundary checks 开始，仍待决定
- canonical root cutover 与 `registry-root consistency` gate 仍需明确

## Exit Condition

- Stage 5 的首个 hardening slice 被明确命名，并进入正式执行线

## Next 3 Actions

1. 定义 `Step 39` 的 ownership、范围和验证面
2. 决定 Stage 5 的第一条 hardening path
3. 继续让 Stage 4 policy audit / policy loop 作为后续工作的硬证据面
