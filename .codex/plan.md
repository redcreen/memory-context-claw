# Plan

## Current Phase

`stage transition / Stage 4 unlocked`

## Slices

- Slice: `close-stage3-self-learning-lifecycle-baseline`
  - Objective: 一口气收掉 `Step 21-30`，把 self-learning 从“baseline 已有”推进到“生命周期显式、可治理、可回放、可验证”
  - Dependencies: `src/unified-memory-core/reflection-system.js`、`memory-registry.js`、`governance-system.js`、`projection-system.js`、`standalone-runtime.js`、OpenClaw adapter
  - Risks: 只补 promotion 而不补 decay/conflict/report，会留下半阶段状态；只补 runtime 不补验证，会让 Stage 3 继续停留在口头完成
  - Validation: focused Stage 3 suite、OpenClaw consumption checks、`scripts/run-learning-lifecycle.js`、full `npm test`
  - Exit Condition: `Step 21-30` 全部有真实实现、回归和可执行 loop
  - Status: `completed`

- Slice: `unlock-stage4-policy-adaptation-contract`
  - Objective: 定义 `policy-input artifact` contract，并明确 Projection / OpenClaw / Codex 的下一阶段输入输出边界
  - Dependencies: `src/unified-memory-core/projection-system.js`、`.codex/modules/projection-system.md`、`docs/roadmap.md`
  - Risks: 如果先做 consumer-local heuristics，不先冻结 artifact contract，Stage 4 会退化成 adapter-specific patches
  - Validation: contract doc、targeted projection tests、明确 rollback / reversibility 约束
  - Exit Condition: `Step 31` 被命名并有首个可验证 slice
  - Status: `next`

- Slice: `hold-stage3-lifecycle-baseline-stable`
  - Objective: 保持 learning lifecycle audit、time-window comparison、repair/replay 和 OpenClaw validation 在后续改动中稳定
  - Dependencies: `test/unified-memory-core/*.test.js`、`test/openclaw-adapter.test.js`
  - Risks: 下一阶段 consumer work 如果绕过 governed exports，会让 Stage 3 验证面失真
  - Validation: targeted Stage 3 suite、full `npm test`
  - Exit Condition: Stage 4 首个 slice 不破坏 Stage 3 baseline
  - Status: `ongoing`

- Slice: `decide-host-neutral-root-cutover-gate`
  - Objective: 明确 canonical registry root 的正式 adoption 窗口，并决定 `registry-root consistency` 是否升成独立强门禁
  - Dependencies: `.codex/subprojects/host-neutral-memory.md`、registry topology / migration outputs、governance cycle
  - Risks: shared-root 合同长期停在“兼容存在，但 operator policy 未固定”
  - Validation: topology inspect、migration report、governance findings
  - Exit Condition: cutover window 和 gate level 被明确
  - Status: `pending`

## Execution Order

1. 保持刚完成的 Stage 3 lifecycle baseline 稳定
2. 打开 `unlock-stage4-policy-adaptation-contract`
3. 再决定 host-neutral root 的正式 cutover / hard-gate 方案

## Architecture Supervision

- Signal: `yellow`
- Signal Basis: Stage 3 已完成，但 Stage 4 contract 还没有冻结
- Problem Class: next-phase contract and projection boundary
- Root Cause Hypothesis: 如果不先定义 policy-input artifact，consumer 侧会回到局部适配而不是共享产品面
- Correct Layer: contracts, projection outputs, validators, control surface
- Rejected Shortcut: 直接在 OpenClaw / Codex 上各自补 policy heuristics
- Escalation Gate: raise but continue

## Current Execution Line

- Objective: 定义 `policy-input artifact` contract，并为 Stage 4 的第一个 consumer path 设定验证面
- Plan Link: `unlock-stage4-policy-adaptation-contract`
- Runway: one slice covering contract naming, output shape, validation, and rollback constraints
- Progress: `0 / 5` tasks complete
- Stop Conditions:
  - contract choice changes consumer behavior expectations
  - validation reveals Stage 3 export shape is insufficient
  - user decides a different first consumer path
- Validation: contract doc、targeted projection tests、targeted OpenClaw/Codex compatibility checks

## Execution Tasks

- [ ] EL-1 define the `policy-input artifact` boundary and relation to current stable learning artifacts
- [ ] EL-2 choose the first consumer path: OpenClaw retrieval/assembly or Codex task-side consumption
- [ ] EL-3 define reversible projection output shape and rollback expectation
- [ ] EL-4 add the first validation slice for the chosen consumer
- [ ] EL-5 refresh roadmap / development-plan / module control surface after the contract is fixed

## Development Log Capture

- Trigger Level: high
- Auto-Capture When:
  - the Stage 4 contract is named
  - a new reversible artifact type is introduced
  - consumer policy starts depending on governed learning outputs
- Skip When:
  - the change stays inside Stage 3 maintenance
  - only test catalog or wording changes

## Escalation Model

- Continue Automatically: contract refinement and validation stay inside the current product direction
- Raise But Continue: pressure appears to bypass shared projection outputs or weaken rollback guarantees
- Require User Decision: the chosen consumer path changes user-visible retrieval/task behavior in a material way
