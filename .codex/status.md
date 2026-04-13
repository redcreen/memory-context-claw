# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-13`

## Current Phase

`stage closeout / Stage 5 complete`

## Active Slice

`hold-post-stage5-roadmap-state-aligned`

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
  - release-preflight 里的 memory-search 门禁已收口为 plugin signal regression，不再顺带跑 builtin OpenClaw search 对照
- host-neutral registry root policy 已显式收口：
  - canonical root 现在以 `~/.unified-memory-core/registry` 为默认 operator 目标
  - live topology 当前已解析到 canonical root，`cutoverReady = true`
  - `registry-root consistency` 不升成“legacy 必须镜像 canonical”的独立强门禁
  - 独立 block 条件收口为：runtime 回退到 `legacy_fallback`，或 canonical root 缺失
- accepted-action governed intake baseline 已落地：
  - CLI 已支持结构化 `accepted_action` source intake
  - accepted-action 证据已能进入 governed source -> candidate -> stable loop
  - export / audit / lifecycle 已能消费 accepted-action stable artifacts
  - Step 47 的 field-aware extraction 已落地：successful accepted_action 现在会拆成 `target_fact`、显式 `operating_rule`、`outcome_artifact` candidates
  - runtime/task hook 已补齐到两条显式入口：Codex `writeAfterTask(...)` 与 OpenClaw 异步 `after_tool_call`
  - 一次性 outcome 目前仍保持 observation，Step 48-52 的 admission routing / negative-path / conflict policy 继续维持在 deferred TODO 队列
- control-surface 与 host-neutral workstream docs 已再次对齐：
  - 不再把 canonical-root cutover 描述成“仍待决定的窗口”
  - 当前维护重点是防止 policy drift，而不是重新定义 hard gate
- project workstream roadmap 已重新对齐到 post-Stage-5 维护态：
  - 不再把“roadmap 收口 + 新 enhancement plan”写成当前主线
  - 当前项目级主线明确收口为：守住 release-preflight、deployment verification、memory-search governance、root policy
- 当前验证已完成：
  - Stage 5 targeted tests：`3/3`
  - release / deployment targeted tests：`71/71`
  - full repo `npm test`：`364/364`
  - `npm run umc:stage5 -- --format markdown`：`pass`
  - `npm run umc:acceptance -- --format markdown`：`pass`
  - `npm run umc:openclaw-itest -- --format markdown`：`pass`
  - `npm run umc:build-bundle -- --format markdown`：`pass`
  - `npm run umc:openclaw-install-verify -- --format markdown`：`pass`
  - `npm run umc:release-preflight -- --format json`：`pass`
  - `npm run umc:cli -- release build-bundle --format markdown`：`pass`
  - `npm run umc:cli -- verify openclaw-install --format markdown`：`pass`
  - `npm run umc:cli -- registry inspect --format markdown`：`pass`
  - `npm run umc:cli -- registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown`：`noop / adopt_canonical_root`
  - `npm run umc:cli -- review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split-rehearsal --format markdown`：`pass`
  - `npm run smoke:eval -- --format markdown`：`28/28`
  - `npm run smoke:eval:critical -- --format markdown`：`18/18`
  - `npm run eval:memory-search:cases -- --skip-builtin --format json`：plugin signal/source `30/30`
  - Markdown 链接扫描：`251` files scanned；source docs `issueCount = 0`（忽略 `dist/openclaw-release/` 生成产物）
  - `git diff --check`：`pass`

## In Progress

- 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿
- 保持 host-neutral root policy 在 CLI、公开文档和控制面里持续一致
- 保持 project/workstream roadmap 摘要与当前 Stage 5 closeout 基线持续一致
- 继续观察 legacy root 是否只停留在兼容回退窗口，而不是重新变成 active root
- 把 accepted-action 的 Step 48-52 继续明确维持在 deferred enhancement queue，而不是在 Step 47 完成后继续悄悄并进当前 closeout baseline
- 保持 OpenClaw `after_tool_call` accepted-action runtime hook 与配置/文档/宿主部署验证持续一致

## Blockers / Open Decisions

- none at the implementation layer
- operator / planning follow-up 只剩：
  - 什么时候清理过时的 legacy root 副本
  - accepted-action Step 48-52 何时具备重开实现的前置条件

## Next 3 Actions

1. 保持 `umc:release-preflight`、`umc:openclaw-install-verify`、`umc:openclaw-itest`、`umc:stage5` 持续为绿。
2. 保持 `umc registry inspect` 的 `operatorPolicy` 不回退到 `migrate_to_canonical_root`，并保持 project/workstream roadmap 不回退到旧阶段叙事。
3. 只有在 runtime API prerequisites 持续为绿且 operator 明确需要时，才讨论新的 enhancement plan、accepted-action Step 48-52，或 legacy root cleanup 窗口。

## Architecture Supervision
- Signal: `yellow`
- Signal Basis: open blockers or architectural risks are still recorded
- Root Cause Hypothesis: 后续真正的风险不再是“cutover 未决”，而是 evidence / roadmap drift 让维护者误判当前阶段，或在 Step 47 已完成后继续把 Step 48-52 过早并进当前 closeout baseline
- Correct Layer: release preflight evidence, governance evidence, registry-root operator policy, project/workstream roadmap, control surface
- Automatic Review Trigger: no automatic trigger is currently active
- Escalation Gate: raise but continue

## Current Escalation State
- Current Gate: raise but continue
- Reason: the current direction can continue, but the supervision state should stay visible
- Next Review Trigger: review again when blockers change, the active slice rolls forward, or release-facing work begins

## Current Execution Line

- Objective: 保持 post-Stage-5 的 operator baseline、project/workstream roadmap 摘要和 canonical-root policy 同时稳定
- Plan Link: `hold-post-stage5-roadmap-state-aligned`
- Runway: one stable-maintenance slice covering roadmap summary、smoke baselines、memory-search governance snapshot、registry inspect、release-preflight、control-surface freshness
- Progress: `3 / 4` tasks complete
- Stop Conditions:
  - validation fails and changes product direction materially
  - live topology regresses to `legacy_fallback`
  - later planning pressure tries to reopen a new enhancement phase without stable prerequisites

## Execution Tasks

- [x] EL-1 align project/workstream roadmap summaries with the current Stage 5 closeout baseline
- [x] EL-2 refresh smoke and memory-search governance snapshots in the visible project state
- [x] EL-3 keep `registry inspect`, release-preflight, and public docs aligned with the operator baseline
- [x] EL-4 define deeper accepted-action extraction as an explicit deferred enhancement queue
- [x] EL-5 implement Step 47 field-aware accepted-action extraction with CLI / lifecycle coverage
- [ ] EL-6 keep later enhancement planning gated behind stable runtime API prerequisites instead of reopening the next phase early

## Development Log Capture

- Trigger Level: high
- Pending Capture: no
- Last Entry: `docs/devlog/2026-04-13-skip-builtin-memory-search-checks-in-release-preflight.md`
