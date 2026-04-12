# Plan

## Current Phase

`stage transition / Stage 5 unlocked`

## Slices

- Slice: `close-stage4-policy-adaptation-and-multi-consumer-use`
  - Objective: 一口气收掉 `Step 31-38`，把 governed learning outputs 真正接到 OpenClaw / Codex consumer 行为，并保持可回退、可治理、可验证
  - Dependencies: `policy-adaptation.js`、`projection-system.js`、OpenClaw / Codex adapters、`governance-system.js`、`standalone-runtime.js`、CLI / scripts
  - Risks: 如果 contract 不先冻结，Stage 4 会退化成 adapter-local heuristics；如果没有 rollback / compatibility audit，consumer policy 会失去治理边界
  - Validation: focused Stage 4 suite、`govern audit-policy`、`learn policy-loop`、`scripts/run-policy-adaptation-loop.js`、full `npm test`
  - Exit Condition: `Step 31-38` 全部有真实实现、回归、CLI/runtime entry 和本地可复现 loop
  - Status: `completed`

- Slice: `hold-stage4-policy-loop-stable`
  - Objective: 保持 policy inputs、OpenClaw/Codex consumption、policy audit 和 policy loop 在后续改动中稳定
  - Dependencies: `test/unified-memory-core/policy-adaptation.test.js`、adapter tests、governance tests、standalone runtime tests
  - Risks: 后续 hardening 如果绕过 governed policy exports，会让 Stage 4 退回成隐式行为
  - Validation: targeted Stage 4 suite、full `npm test`
  - Exit Condition: Stage 5 首个 slice 不破坏 Stage 4 baseline
  - Status: `ongoing`

- Slice: `unlock-stage5-product-hardening-baseline`
  - Objective: 定义 Stage 5 的 source-adapter / maintenance / release-boundary / reproducibility 执行顺序
  - Dependencies: `docs/reference/unified-memory-core/development-plan.md`、`docs/roadmap.md`、`.codex/module-dashboard.md`
  - Risks: 如果没有先定顺序，Stage 5 会变成零散 hardening 而不是一条产品收口线
  - Validation: updated development plan、clear step pointer、明确 regression / rollback evidence surface
  - Exit Condition: `Step 39` 被命名并有明确 first slice
  - Status: `next`

- Slice: `decide-host-neutral-root-cutover-gate`
  - Objective: 明确 canonical registry root 的正式 adoption 窗口，并决定 `registry-root consistency` 是否升成独立强门禁
  - Dependencies: `.codex/subprojects/host-neutral-memory.md`、registry topology / migration outputs、governance cycle
  - Risks: shared-root 合同长期停在“兼容存在，但 operator policy 未固定”
  - Validation: topology inspect、migration report、governance findings
  - Exit Condition: cutover window 和 gate level 被明确
  - Status: `pending`

## Execution Order

1. 保持刚完成的 Stage 4 policy loop 稳定
2. 打开 `unlock-stage5-product-hardening-baseline`
3. 再决定 host-neutral root 的正式 cutover / hard-gate 方案

## Architecture Supervision

- Signal: `yellow`
- Signal Basis: Stage 4 已完成，但 Stage 5 入口还没有冻结
- Problem Class: operational hardening order and operator policy
- Root Cause Hypothesis: 如果不先定义 maintenance / reproducibility / release-boundary 顺序，Stage 5 会重新散开成独立 checklist
- Correct Layer: source adapters, release boundary, reproducibility, control surface
- Rejected Shortcut: 直接零散补 release checks，不先冻结 Stage 5 slice
- Escalation Gate: raise but continue

## Current Execution Line

- Objective: 定义 Stage 5 的第一个 hardening slice，并把 Stage 4 policy loop 固定成后续阶段的回归证据面
- Plan Link: `unlock-stage5-product-hardening-baseline`
- Runway: one slice covering Step `39` naming、execution order、validation surface、release-boundary framing
- Progress: `0 / 5` tasks complete
- Stop Conditions:
  - Stage 5 order changes user-visible product direction
  - root cutover policy changes operational assumptions
  - validation reveals a missing hardening prerequisite
- Validation: updated development plan、updated roadmap、module dashboard refresh、targeted regression evidence mapping

## Execution Tasks

- [ ] EL-1 define the Stage 5 first slice and exact `Step 39` ownership
- [ ] EL-2 decide how source-adapter hardening, maintenance workflow, and release-boundary checks should be ordered
- [ ] EL-3 carry Stage 4 policy loop forward as a required regression surface
- [ ] EL-4 refresh roadmap / development-plan / module control surface for Stage 5 entry
- [ ] EL-5 lock the next validation set before implementation starts

## Development Log Capture

- Trigger Level: high
- Auto-Capture When:
  - `Step 39` is named
  - release-boundary checks become executable
  - maintenance / reproducibility workflow is frozen
- Skip When:
  - the change stays inside Stage 4 maintenance
  - only wording or dashboard sync changes

## Escalation Model

- Continue Automatically: Stage 5 planning stays inside the current product direction
- Raise But Continue: pressure appears to bypass shared hardening evidence or weaken rollback / reproducibility
- Require User Decision: the chosen Stage 5 first slice materially changes operator workflow expectations
