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

- Slice: `close-host-neutral-root-cutover-gate-policy`
  - Objective: 基于 live topology、migration recommendation 和 split rehearsal，把 canonical root cutover 与 gate rule 写成显式 operator policy
  - Dependencies: `.codex/subprojects/host-neutral-memory.md`、registry topology / migration outputs、Stage 5 split rehearsal evidence
  - Risks: 如果继续把 legacy divergence 当成强门禁，operator 会在 cutover 已完成后仍然误判为“未切换”
  - Validation: `npm run umc:cli -- registry inspect --format markdown`、`npm run umc:cli -- registry migrate --format markdown`、`npm run umc:cli -- review split-rehearsal --format markdown`
  - Exit Condition: canonical root 的 adoption 规则和独立 block 条件都变成 CLI / docs / control-surface 的显式结论
  - Status: `completed`

- Slice: `hold-host-neutral-root-policy-stable`
  - Objective: 保持 canonical root adoption 规则稳定，不让 later changes 把 legacy divergence 重新包装成 hard gate
  - Dependencies: registry topology output、configuration docs、host-neutral workstream docs、control surface
  - Risks: later maintenance 如果重新模糊 cutover rule，会让 operator policy 漂移
  - Validation: `npm run umc:cli -- registry inspect --format markdown`、configuration docs、control-surface status
  - Exit Condition: later phase work no longer threatens the explicit operator policy
  - Status: `ongoing`

- Slice: `hold-post-stage5-roadmap-state-aligned`
  - Objective: 保持 project/workstream roadmap 摘要、Stage 5 closeout 证据和 later-phase gate 在同一条 operator baseline 上
  - Dependencies: `docs/workstreams/project/roadmap.md`、`docs/workstreams/project/roadmap.zh-CN.md`、`docs/roadmap.md`、development plan、release-preflight docs、host-neutral roadmap、当前 smoke / memory-search eval 基线
  - Risks: stale roadmap text 或旧质量指标会让维护者误判当前阶段，过早重开 enhancement planning
  - Validation: `npm run smoke:eval -- --format markdown`、`npm run smoke:eval:critical -- --format markdown`、`npm run eval:memory-search:cases -- --format json`、project/workstream roadmap、control-surface status
  - Exit Condition: later-phase planning 只会从稳定的 operator baseline 打开，project roadmap 不再和 live control docs 冲突
  - Status: `ongoing`

- Slice: `define-deeper-accepted-action-extraction-todo`
  - Objective: 把 accepted-action 的更深抽取规则、分层准入、负向路径和治理覆盖明确写成 deferred enhancement queue，而不是继续隐含在聊天里
  - Dependencies: `docs/workstreams/self-learning/architecture*.md`、`docs/workstreams/self-learning/roadmap*.md`、`docs/reference/unified-memory-core/development-plan*.md`、accepted_action source intake baseline、current Stage 5 operator baseline
  - Risks: 如果 TODO 不显式化，下一轮实现容易退回业务特判；如果现在直接开做，会把当前 closeout baseline 和 later enhancement slice 混在一起
  - Validation: self-learning architecture / roadmap / development plan 与 `.codex/*` 对齐；TODO 只定义后续实现，不误报成当前 baseline 已完成
  - Exit Condition: 更深 accepted-action extraction 已经有明确 TODO、前置条件、验收方向和恢复点
  - Status: `completed`

- Slice: `implement-step47-field-aware-accepted-action-extraction`
  - Objective: 落地 deferred queue 的 Step 47，让 accepted_action 基于结构化字段拆出 `target_fact`、显式 `operating_rule`、`outcome_artifact` 候选，而不是继续只产出一条保守摘要
  - Dependencies: `src/unified-memory-core/source-system.js`、`src/unified-memory-core/reflection-system.js`、CLI/runtime reflect & lifecycle path、self-learning docs / development plan、accepted_action baseline tests
  - Risks: 如果继续把 accepted_action 压成单条摘要，后续 stable recall 会再次混淆“可复用 target”和“一次性 outcome”；如果一次性过做 Step 48-51，会把准入、负向路径、冲突治理一起并进当前实现
  - Validation: accepted_action source/reflection/CLI tests、`npm test`、`npm run verify`、`npm run umc:cli -- reflect run ... --source-type accepted_action`、`npm run umc:cli -- learn lifecycle-run ... --source-type accepted_action`
  - Exit Condition: successful accepted_action 至少能拆出 field-aware target / outcome candidates，CLI 与 lifecycle 能证明可复用 target promote、一次性 outcome 保持 observation，且 Step 48-52 继续维持 deferred
  - Status: `completed`

- Slice: `hook-openclaw-after-tool-call-into-accepted-action-learning`
  - Objective: 把 OpenClaw 侧真正可用的异步 runtime seam 接上 governed accepted-action intake，让显式结构化 tool result 能直接进入 source -> reflection -> promotion 闭环
  - Dependencies: `src/plugin/index.js`、OpenClaw typed hooks、host-neutral namespace mapping、accepted_action source/reflection baseline、deployment verification
  - Risks: 如果把 registry 写入接到同步 `tool_result_persist`，会违反宿主 hook 约束；如果对任意成功 tool result 做隐式推断，会把 Step 48-52 的 deeper policy 偷渡进当前实现
  - Validation: OpenClaw hook regression tests、full `npm test`、`npm run verify`、本机部署后宿主侧 after_tool_call 模拟
  - Exit Condition: OpenClaw async `after_tool_call` 在显式 structured payload 存在时，能把 accepted_action 发入与 Codex/CLI 相同的 governed intake surface，且文档/配置/宿主验证同步完成
  - Status: `completed`

## Execution Order

1. 保持 release-preflight / bundle install / host smoke / Stage 5 evidence 稳定
2. 保持 host-neutral root operator policy 可见且不回退
3. 保持 project/workstream roadmap 摘要与当前 Stage 5 closeout 基线持续一致
4. 保持 accepted-action deeper queue 的 Step 48-52 仍然显式 deferred，不把 admission / negative-path / conflict work 偷渡进当前实现
5. 保持 Codex `writeAfterTask(...)` 与 OpenClaw async `after_tool_call` 这两条 runtime intake surface 继续对齐同一条 governed loop
6. 只有在 runtime API prerequisites 持续为绿后，才开启新的 enhancement planning 或讨论 legacy root cleanup 窗口

## Architecture Supervision
- Signal: `yellow`
- Signal Basis: open blockers or architectural risks are still recorded
- Problem Class: post-stage maintenance, human acceptance, and operator policy
- Root Cause Hypothesis: 后续真正的风险不再是“cutover 未决”，而是 evidence / roadmap drift 让维护者误判当前阶段，或在 Step 47 已完成后继续把 Step 48-52 过早并进当前 closeout baseline
- Correct Layer: release preflight evidence, governance evidence, registry-root operator policy, project/workstream roadmap, control surface
- Rejected Shortcut: 跳过 Stage 5 证据面和当前 operator baseline，直接讨论 runtime API / service mode
- Automatic Review Trigger: no automatic trigger is currently active
- Escalation Gate: raise but continue

## Current Execution Line

- Objective: 保持 root-cutover operator policy、project/workstream roadmap 摘要和 release-preflight 证据面同时稳定
- Plan Link: `hold-post-stage5-roadmap-state-aligned`
- Runway: one stable-maintenance slice covering roadmap summary、smoke baselines、memory-search governance snapshot、registry inspect、release-preflight、state refresh
- Progress: `3 / 4` tasks complete
- Stop Conditions:
  - Stage 5 evidence regresses
  - registry inspect regresses to `legacy_fallback` or `migrate_to_canonical_root`
  - later service-mode discussion pressures the repo to bypass current evidence or reopen the next phase early
- Validation: `npm run umc:release-preflight`、`npm run umc:cli -- registry inspect --format markdown`、`npm run umc:openclaw-itest`、`npm run umc:stage5`、`npm run smoke:eval -- --format markdown`、`npm run eval:memory-search:cases -- --format json`

## Execution Tasks

- [x] EL-1 align project/workstream roadmap summaries with the current Stage 5 closeout baseline
- [x] EL-2 refresh smoke and memory-search governance snapshots in the visible project state
- [x] EL-3 keep public docs, `registry inspect`, and `.codex/*` state aligned with the operator baseline
- [x] EL-4 define deeper accepted-action extraction as a deferred enhancement queue instead of an implicit next-step assumption
- [x] EL-5 implement Step 47 field-aware accepted-action extraction without reopening the rest of the deferred queue
- [ ] EL-6 keep later enhancement planning gated behind stable runtime API prerequisites instead of reopening the next phase early

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

- Continue Automatically: normal post-stage regression, roadmap alignment, and operator evidence maintenance
- Raise But Continue: Stage 5 evidence stays green but root-cutover policy or project/workstream roadmap starts drifting in docs or CLI
- Require User Decision: a later phase would bypass or weaken the current Stage 5 contract or open enhancement planning before prerequisites stay green
