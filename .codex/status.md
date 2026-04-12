# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-12`

## Current Phase

`stage closeout / Stage 5 complete`

## Active Slice

`hold-host-neutral-root-policy-stable`

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
- host-neutral registry root policy 已显式收口：
  - canonical root 现在以 `~/.unified-memory-core/registry` 为默认 operator 目标
  - live topology 当前已解析到 canonical root，`cutoverReady = true`
  - `registry-root consistency` 不升成“legacy 必须镜像 canonical”的独立强门禁
  - 独立 block 条件收口为：runtime 回退到 `legacy_fallback`，或 canonical root 缺失
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
  - `npm run umc:cli -- registry inspect --format markdown`：`pass`
  - `npm run umc:cli -- registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown`：`noop / adopt_canonical_root`
  - `npm run umc:cli -- review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split-rehearsal --format markdown`：`pass`
  - `npm run smoke:eval`：`28/28`
  - `npm run eval:memory-search:cases`：plugin `30/30`
  - Markdown 链接扫描：`246` files scanned；source docs `issueCount = 0`（忽略 `dist/openclaw-release/` 生成产物）
  - `git diff --check`：`pass`

## In Progress

- 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿
- 保持 host-neutral root policy 在 CLI、公开文档和控制面里持续一致
- 继续观察 legacy root 是否只停留在兼容回退窗口，而不是重新变成 active root

## Blockers / Open Decisions

- none at the implementation layer
- operator follow-up 只剩：什么时候清理过时的 legacy root 副本，是否需要额外发布说明

## Next 3 Actions

1. 保持 `umc:release-preflight`、`umc:openclaw-install-verify`、`umc:openclaw-itest`、`umc:stage5` 持续为绿。
2. 保持 `umc registry inspect` 的 `operatorPolicy` 不回退到 `migrate_to_canonical_root`。
3. 仅在 operator 明确需要时，再决定 legacy root archive / cleanup 窗口。

## Architecture Supervision

- Signal: `green`
- Signal Basis: 现在不仅有 Stage 5 evidence 和 release-preflight，一条明确的 registry-root operator policy 也已经进入 CLI 和控制面
- Root Cause Hypothesis: 后续真正的风险不再是“cutover 未决”，而是 operator 误把 legacy divergence 当成 hard gate，或 runtime 回退到 legacy root
- Correct Layer: release preflight evidence, governance evidence, registry-root operator policy, control surface
- Escalation Gate: continue automatically

## Current Escalation State

- Current Gate: continue automatically
- Reason: 代码、部署、CLI 验证和 root-cutover policy 都已收口；剩余事项属于稳定性维护
- Next Review Trigger: `umc:release-preflight` 失败、host smoke 回退、bundle install 失败、或 `registry inspect` 回退到 `legacy_fallback`

## Current Execution Line

- Objective: 保持 canonical-root operator policy 可见且不回退
- Plan Link: `hold-host-neutral-root-policy-stable`
- Runway: one stable-maintenance slice covering registry inspect、configuration docs、host smoke、release-preflight、control-surface freshness
- Progress: `4 / 4` tasks complete
- Stop Conditions:
  - validation fails and changes product direction materially
  - live topology regresses to `legacy_fallback`

## Execution Tasks

- [x] EL-1 keep `registry inspect` visible and canonical-first
- [x] EL-2 keep public docs and `.codex/*` state aligned with the operator policy
- [x] EL-3 keep release-preflight and host smoke green beside the root policy
- [x] EL-4 keep later work from reintroducing legacy-mirroring as a hard gate

## Development Log Capture

- Trigger Level: high
- Pending Capture: no
- Last Entry: `docs/devlog/2026-04-12-make-host-neutral-root-cutover-policy-explicit.md`
