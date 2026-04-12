# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-12`

## Current Phase

`stage transition / Stage 3 closed, Stage 4 unlocked`

## Active Slice

`unlock-stage4-policy-adaptation-contract`

## Done

- 项目主链已完成：抓记忆 -> 提炼 fact/card -> 检索与 assembly -> 回归与治理
- `memory search` A-E phases 已完成，当前 plugin-side governance refresh 仍维持 `30/30`
- self-learning baseline 之上的 Stage 3 生命周期基线已在 `2026-04-12` 收口：
  - learning candidate promotion rules
  - weak / stale signal decay and expiry rules
  - learned-artifact conflict detection
  - promoted learning artifact stable-registry update rules
  - learning-specific audit / repair / replay / time-window comparison surfaces
  - OpenClaw consumption validation for promoted learning artifacts
  - local `observation -> stable governed loop` runtime / CLI / script path
  - registry / governance / runtime / OpenClaw regression coverage
- standalone runtime / CLI 现已支持：
  - `learn lifecycle-run`
  - `govern audit-learning`
  - `govern compare-learning`
  - `govern repair-learning`
  - `govern replay-learning`
  - `scripts/run-learning-lifecycle.js`
- 最新验证已完成：
  - focused Stage 3 suite: `42/42`
  - full repo `npm test`: `323/323`

## In Progress

- 保持 Stage 3 lifecycle baseline 可读、可回放、可验证
- 为 Stage 4 打开 `policy-input artifact` 合同定义
- 继续观察 host-neutral registry root 的 live adoption / cutover 条件

## Blockers / Open Decisions

- `policy-input artifact` 的 shape、reversibility 和 consumer boundary 还未命名收口
- canonical root 何时从 legacy fallback 正式切到 `~/.unified-memory-core/registry`，仍需明确窗口
- 是否把 registry-root consistency 升成独立强门禁，仍待决定

## Next 3 Actions

1. 定义 `Step 31` 的 `policy-input artifact` contract，并明确 Projection / OpenClaw / Codex 边界
2. 决定 Stage 4 的第一条 consumer path 先从 OpenClaw retrieval/assembly 还是 Codex task-side consumption 开始
3. 保持 Stage 3 regression、learning audit 和 OpenClaw consumption validation 持续稳定

## Architecture Supervision

- Signal: `yellow`
- Signal Basis: Stage 3 已收口，但 Stage 4 contract 还未固定
- Root Cause Hypothesis: 如果下一阶段只做 consumer 侧局部改动而不先冻结 policy-input contract，repo 会回到 adapter-local fixes
- Correct Layer: contracts, projection outputs, validation, and control surface
- Escalation Gate: raise but continue

## Current Escalation State

- Current Gate: raise but continue
- Reason: 方向已清楚，但下一阶段的 contract 仍需可见监督
- Next Review Trigger: `policy-input artifact` 被命名、Stage 4 首个 slice 打开、或 host-neutral root gate 变化

## Current Execution Line

- Objective: 收口 Stage 3 self-learning lifecycle baseline，并为 Stage 4 解锁明确入口
- Plan Link: `close-stage3-self-learning-lifecycle-baseline`
- Runway: one long slice covering Step `21-30`, validation, and state refresh
- Progress: `10 / 10` tasks complete
- Stop Conditions:
  - blocker requires human direction
  - validation fails and changes the direction
  - Stage 4 contract choice changes product behavior expectations

## Execution Tasks

- [x] EL-1 map Step `21-30` onto Reflection / Registry / Governance / Projection / OpenClaw surfaces
- [x] EL-2 implement explicit learning-candidate promotion review rules
- [x] EL-3 implement weak / stale signal decay and expiry handling
- [x] EL-4 implement learned-artifact conflict detection plus stable-registry update rules
- [x] EL-5 add learning-specific audit / repair / replay / time-window comparison reports
- [x] EL-6 add standalone runtime / CLI / script entry for one local governed lifecycle loop
- [x] EL-7 validate OpenClaw consumption of promoted learning artifacts
- [x] EL-8 add regression coverage for registry / governance / runtime / OpenClaw paths
- [x] EL-9 run focused Stage 3 validation and full `npm test`
- [x] EL-10 refresh roadmap / development-plan / module control surface and capture devlog

## Development Log Capture

- Trigger Level: high
- Pending Capture: no
- Last Entry: `docs/devlog/2026-04-12-close-stage3-self-learning-lifecycle-baseline.md`
