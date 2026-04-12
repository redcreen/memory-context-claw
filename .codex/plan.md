# Plan

## Current Phase

`stage closeout / Stage 5 complete`

## Slices

- Slice: `close-stage5-product-hardening-and-independent-operation`
  - Objective: 一口气收掉 `Step 39-46`，把 source hardening、maintenance、reproducibility、release-boundary、split rehearsal、independent review 全部接到 CLI-first 证据面
  - Dependencies: `source-system.js`、`standalone-runtime.js`、CLI / scripts、independent-execution review、testing docs
  - Risks: 如果 Stage 5 只补单点命令而没有统一 acceptance，仓库会回到“功能有了但 operator 无法稳定验证”的状态
  - Validation: Stage 5 targeted tests、`npm run umc:stage5`、`npm run umc:cli -- maintenance run`、`npm run umc:cli -- export reproducibility`、`npm run umc:cli -- review split-rehearsal`
  - Exit Condition: `Step 39-46` 全部有真实实现、文档、CLI 入口和自动化 acceptance
  - Status: `completed`

- Slice: `hold-stage5-product-hardening-stable`
  - Objective: 保持 Stage 5 acceptance、maintenance、reproducibility、split rehearsal 证据面持续稳定
  - Dependencies: Stage 5 tests、`umc:stage5`、host smoke、control-surface docs
  - Risks: 后续改动如果绕开这些证据面，会让 Stage 5 退回成“曾经完成”
  - Validation: `npm run umc:stage5`、`npm run umc:acceptance`、`npm run umc:openclaw-itest`、full `npm test`
  - Exit Condition: later phase discussion does not require reopening Stage 5 contract work
  - Status: `ongoing`

- Slice: `close-release-preflight-cli-and-deployment-verification`
  - Objective: 把真实 bundle install、deployment verification、release-preflight 一键门禁全部 CLI 化，并把仓库状态推进到“只等人类验收”
  - Dependencies: local SQLite retrieval path、release bundle builder、OpenClaw install verify、testing docs、release docs
  - Risks: 如果继续沿用 dev-repo 直接安装，safe-install 风险会让稳定安装路径名义存在、实际不稳
  - Validation: `npm run umc:build-bundle`、`npm run umc:openclaw-install-verify`、`npm run umc:release-preflight`、`npm run umc:cli -- verify openclaw-install`
  - Exit Condition: release bundle、真实安装验证、完整 CLI preflight 都已通过，只剩人类验收
  - Status: `completed`

- Slice: `hold-release-preflight-evidence-stable`
  - Objective: 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿
  - Dependencies: release bundle builder、install verify、host smoke、Stage 5 acceptance、control-surface docs
  - Risks: 如果后续改动绕过 release-preflight，仓库会退回到“功能可用但发版验证靠人工拼接”
  - Validation: `npm run umc:release-preflight`、`npm run umc:openclaw-install-verify`、`npm run umc:openclaw-itest`、`npm run umc:stage5`
  - Exit Condition: human acceptance 完成且 later maintenance 不需要重开 deployment contract work
  - Status: `ongoing`

- Slice: `decide-host-neutral-root-cutover-gate`
  - Objective: 明确 canonical registry root 的 adoption 窗口，并决定 `registry-root consistency` 是否升成独立强门禁
  - Dependencies: `.codex/subprojects/host-neutral-memory.md`、registry topology / migration outputs、Stage 5 split rehearsal evidence
  - Risks: shared-root 合同长期停在“证据存在但 operator policy 未固定”
  - Validation: topology inspect、migration rehearsal、governance findings
  - Exit Condition: cutover window 和 gate level 被明确
  - Status: `pending`

## Execution Order

1. 保持 release-preflight / bundle install / host smoke / Stage 5 evidence 稳定
2. 做人类验收与后续 commit / push / tag 决策
3. 决定 host-neutral root 的正式 cutover / hard-gate 方案

## Architecture Supervision

- Signal: `green`
- Signal Basis: 现在不仅有 Stage 5 evidence，还有 release-preflight / bundle install / host smoke 的真实部署证据
- Problem Class: post-stage maintenance, human acceptance, and operator policy
- Root Cause Hypothesis: 真正的后续风险不在实现本身，而在 preflight 失活、human acceptance 未做、或 root policy 被隐藏处理
- Correct Layer: release preflight evidence, release boundary, registry-root governance, control surface
- Rejected Shortcut: 跳过 Stage 5 证据面直接讨论 runtime API / service mode
- Escalation Gate: continue automatically

## Current Execution Line

- Objective: 保持 release-preflight 刚收口的部署验证证据面持续为绿
- Plan Link: `hold-release-preflight-evidence-stable`
- Runway: one stable-maintenance slice covering preflight、bundle install、host smoke、stage5 acceptance、state refresh
- Progress: `4 / 4` tasks complete
- Stop Conditions:
  - Stage 5 evidence regresses
  - root cutover policy changes operator assumptions materially
  - later service-mode discussion pressures the repo to bypass current evidence
- Validation: `npm run umc:release-preflight`、`npm run umc:openclaw-install-verify`、`npm run umc:openclaw-itest`、`npm run umc:stage5`

## Execution Tasks

- [x] EL-1 keep release-preflight green
- [x] EL-2 keep bundle install / host smoke / Stage 5 surfaces green
- [x] EL-3 keep public docs and `.codex/*` state aligned with actual completion
- [x] EL-4 keep root-cutover follow-up visible instead of hiding it inside later product work

## Development Log Capture

- Trigger Level: high
- Auto-Capture When:
  - Stage 5 closes
  - release-preflight closes deployment verification
  - a later regression reopens Stage 5 evidence
  - root cutover policy changes operator workflow materially
- Skip When:
  - only routine regression runs are repeated without behavior changes

## Escalation Model

- Continue Automatically: normal post-stage regression and operator evidence maintenance
- Raise But Continue: Stage 5 evidence stays green but root cutover policy remains unresolved
- Require User Decision: a later phase would bypass or weaken the current Stage 5 contract
