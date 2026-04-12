# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-12`

## Current Phase

`stage closeout / Stage 5 complete`

## Active Slice

`hold-release-preflight-evidence-stable`

## Done

- 项目主链已完成：抓记忆 -> 提炼 fact/card -> 检索与 assembly -> 治理与回放
- Stage 3 self-learning lifecycle baseline 已收口
- Stage 4 policy adaptation 与多消费者使用已收口
- Stage 5 product hardening 与 independent operation 已收口：
  - standalone `file / directory / url / image` source adapters 已加固
  - CLI 已支持 `--sources-file` 多源输入
  - maintenance workflow 已有 runtime / CLI / 文档入口
  - export reproducibility audit 已落地
  - release-boundary validation 与 split rehearsal 已落地
  - runtime API prerequisites 已文档化
  - `npm run umc:stage5` 已成为一键 acceptance 入口
- 新的 release-grade CLI 面已收口：
  - `retrieval.js` 已切到 local SQLite read path，不再依赖 plugin 内 `child_process`
  - `npm run umc:build-bundle` 可构建干净的 OpenClaw release bundle
  - `npm run umc:openclaw-install-verify` 可在隔离 profile 中走真实 `openclaw plugins install`
  - `npm run umc:release-preflight` 已成为“只等人类验收”的一键 CLI 门禁
- 当前验证已完成：
  - Stage 5 targeted tests：`3/3`
  - release / deployment targeted tests：`71/71`
  - full repo `npm test`：`346/346`
  - `npm run umc:stage5 -- --format markdown`：`pass`
  - `npm run umc:acceptance -- --format markdown`：`pass`
  - `npm run umc:openclaw-itest -- --format markdown`：`pass`
  - `npm run umc:build-bundle -- --format markdown`：`pass`
  - `npm run umc:openclaw-install-verify -- --format markdown`：`pass`
  - `npm run umc:release-preflight -- --format markdown`：`pass`
  - `npm run umc:cli -- release build-bundle --format markdown`：`pass`
  - `npm run umc:cli -- verify openclaw-install --format markdown`：`pass`
  - `npm run smoke:eval`：`28/28`
  - `npm run eval:memory-search:cases`：plugin `30/30`
  - Markdown 链接扫描：`246` files scanned；source docs `issueCount = 0`（忽略 `dist/openclaw-release/` 生成产物）
  - `git diff --check`：`pass`

## In Progress

- 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿
- 只剩人类验收与后续 commit / push / tag 决策
- 继续观察 host-neutral registry root 的 live adoption / cutover 条件

## Blockers / Open Decisions

- canonical root 何时从 legacy fallback 正式切到 `~/.unified-memory-core/registry`，仍需明确窗口
- 是否把 `registry-root consistency` 升成独立强门禁，仍待决定

## Next 3 Actions

1. 做最后一轮人类验收；CLI 侧已经收口。
2. 需要提交时，基于当前 green preflight 做 commit / push。
3. 决定 canonical root cutover 与 `registry-root consistency` gate level。

## Architecture Supervision

- Signal: `green`
- Signal Basis: 现在不仅有 Stage 5 evidence，还有 release bundle install 与 release-preflight 一键门禁
- Root Cause Hypothesis: 后续真正的风险不再是“实现缺口”，而是 operator policy 漂移、human acceptance 未完成、或 root cutover 未显式决策
- Correct Layer: release preflight evidence, governance evidence, registry-root operator policy, control surface
- Escalation Gate: continue automatically

## Current Escalation State

- Current Gate: continue automatically
- Reason: 代码、部署、CLI 验证都已收口；剩余事项属于 human acceptance、operator policy 和稳定性维护
- Next Review Trigger: `umc:release-preflight` 失败、host smoke 回退、bundle install 失败、或 root cutover policy 变化

## Current Execution Line

- Objective: 保持新收口的 release-preflight / deployment verification 证据面稳定，并继续显式跟踪 root cutover policy
- Plan Link: `close-release-preflight-cli-and-deployment-verification`
- Runway: one stable-maintenance slice covering preflight、bundle install、host smoke、stage5 acceptance、control-surface freshness
- Progress: `5 / 5` tasks complete
- Stop Conditions:
  - validation fails and changes product direction materially
  - host-neutral root policy requires a separate operator decision

## Execution Tasks

- [x] EL-1 remove plugin-runtime `child_process` retrieval dependency via local SQLite read path
- [x] EL-2 add clean OpenClaw release bundle builder and safety scan
- [x] EL-3 add isolated OpenClaw bundle install verification through real `plugins install`
- [x] EL-4 add one-command release-preflight CLI gate
- [x] EL-5 refresh testing docs / release docs / control surface and capture devlog

## Development Log Capture

- Trigger Level: high
- Pending Capture: no
- Last Entry: `docs/devlog/2026-04-12-close-release-preflight-cli-and-deployment-verification.md`
