# Subproject Status

## Parent Phase / Milestone

`large project / stage closeout / core-product`

## Goal

把 `src/unified-memory-core/` 维持成可扩展的共享记忆核心，并在 Stage 5 收口后保持 CLI-first acceptance、release-preflight 和 host-neutral root policy 持续稳定。

## Boundary

`core-product` 不是单独指 `self-learning`，而是：

- Source System
- Reflection System
- Memory Registry
- Projection System
- Governance System

当前边界已经从“推进到 Stage 5”转成“守住已经完成的 release-grade 产品面”，重点是：

- source adapters / maintenance / reproducibility / split rehearsal 的 Stage 5 证据面
- release bundle、真实 OpenClaw install verify、host smoke、release-preflight
- canonical-root operator policy 在 CLI、公开文档和控制面中的一致性

## Current Slice

`Stage 5 complete; keep release-grade evidence and root policy stable`

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
- Stage 5 product hardening 与 independent operation 已完成：
  - standalone `file / directory / url / image` source adapters 已加固
  - maintenance workflow 已有 runtime / CLI / 文档入口
  - export reproducibility audit、split rehearsal、independent execution review 已落地
  - `npm run umc:stage5` 已成为一键 acceptance 入口
- release-grade CLI / deployment verification 已完成：
  - `npm run umc:build-bundle` 可构建干净的 OpenClaw release bundle
  - `npm run umc:openclaw-install-verify` 可在隔离 profile 中走真实安装验证
  - `npm run umc:release-preflight` 已成为“只等人类验收”的一键门禁
  - release-preflight 中的 memory-search 门禁已收口为 plugin 侧 signal regression；更重的 builtin 对照继续保留在独立 eval 路径
- host-neutral root operator policy 已显式化：
  - `~/.unified-memory-core/registry` 是默认 canonical root
  - runtime 已解析到 canonical root 时，cutover 视为 adopted
  - `legacy_fallback` 或 canonical root 缺失才是 block 条件
  - legacy divergence 在 canonical active 时只保留 advisory 语义

## In Progress

- 保持 Stage 5 acceptance、release-preflight、bundle install、host smoke 持续为绿
- 保持 canonical-root operator policy 在 CLI、公开文档和 `.codex/*` 中持续一致

## Blockers / Open Decisions

- implementation blocker：none
- human acceptance / release timing 仍由 operator 决定
- legacy root 旧副本是否以及何时 archive / cleanup，仍属于 operator 选择

## Exit Condition

- later phase work 不再威胁当前 Stage 5 contract、release-preflight 证据面和 canonical-root operator policy

## Next 3 Actions

1. 保持 `umc:release-preflight`、`umc:openclaw-install-verify`、`umc:openclaw-itest`、`umc:stage5` 持续为绿
2. 保持 `umc registry inspect` 的 `operatorPolicy` 不回退到 `migrate_to_canonical_root`
3. 仅在 operator 明确需要时，再决定 legacy root archive / cleanup 窗口
