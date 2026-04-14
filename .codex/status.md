# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-14`

## Current Phase

`post-stage5 evaluation-driven optimization`

## Active Slice

`execute-200-case-benchmark-and-answer-path-triage`

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
  - compaction fallback 单测已和宿主真实 `~/.openclaw/openclaw.json` 解耦，不再因本地失效 plugin path 让 `npm test` / `release-preflight` 偶发失败
- `v0.2.1` release prep 已对齐：
  - `package.json`、plugin runtime version、README / usage-guide / release docs 的稳定安装目标都已切到 `v0.2.1`
  - `releases/v0.2.1.md` 已补齐，历史 `v0.2.0` release note 保持不动
  - `npm run umc:release-preflight -- --format markdown` 已再次通过，`bundleInstallTag = v0.2.1`
  - 本机 `npm run deploy:local` 已把宿主扩展目录刷新到当前工作区；`openclaw plugins inspect unified-memory-core --json` 现在显示 loaded version 与 install metadata 都是 `0.2.1`
  - `runtime:check` 已补上 plugin inspect + resilient memory-status handling，不再把“宿主 CLI 变化 / memory status 不可用”直接误报成硬失败
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
  - 宿主侧 live verification 已补齐：失效的 `status-codex-quota` 配置残留已清理，`openclaw plugins list` 已恢复正常
  - 已安装插件的真实 `after_tool_call` hook 已在 canonical registry 上写入一条 canary `accepted_action`：`target_fact` 成功 promote，`outcome_artifact` 保持 observation
- post-Stage-5 评测驱动优化的第一轮 baseline 已落地：
  - repo 内已新增 `evals/openclaw-cli-memory-fixture/` fixture 镜像，覆盖稳定事实、项目知识、旧状态和当前状态
  - `evals/openclaw-cli-memory-benchmark-cases.js` 已扩到 `187` 个 benchmark case，其中 `62` 条是 live `openclaw agent` answer-level case
  - `scripts/eval-openclaw-cli-memory-benchmark.js` 已成为统一 benchmark 入口，支持 case filtering、entrypoint filtering、Markdown/JSON 报告和关键 legacy attribution
  - `scripts/eval-openclaw-cli-agent-answer-matrix.js` 已补上专门的 answer-level matrix 入口
  - `scripts/watch-openclaw-memory-search-transport.js` 已把 raw `openclaw memory search` transport 单独收口成 watchlist
  - retrieval-heavy host-index benchmark 已扩到：`125/125`
  - transport watchlist 首轮结果：`17/24` raw ok，`7` 条 empty-result，不再与算法判断混在一起
  - live answer-level current-path 子矩阵已自动化，但当前结果是红的：`0/36`
  - benchmark-driven 第一轮修复已落地：`guessing policy` query rewrite 与 fallback rewrite fan-out 已补齐，失败项归零
  - answer-level benchmark wrapper prompt 现在会在 query rewrite 前被剥掉，不再让 `Based only on your memory...` 这类测试包装语污染 retrieval query
  - 总览报告已补齐：[reports/generated/openclaw-cli-memory-eval-program-2026-04-14.md](../reports/generated/openclaw-cli-memory-eval-program-2026-04-14.md)
- development plan `59-64` 已收口成正式产物：
  - `187` case coverage review 与 `200+` 扩面规划已写成报告：[reports/generated/openclaw-cli-memory-coverage-plan-2026-04-14.md](../reports/generated/openclaw-cli-memory-coverage-plan-2026-04-14.md)
  - 中文案例 `50%` 的下一轮约束已写回 roadmap / development plan / control surface
  - retrieval / assembly / answer-level 主链路性能专项计划已补齐：[docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md](../docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md)
  - 主链路性能首轮基线已落地：[reports/generated/main-path-performance-baseline-2026-04-14.md](../reports/generated/main-path-performance-baseline-2026-04-14.md)
  - 首轮 perf 归因已经明确：retrieval / assembly 仍是毫秒级，raw transport 继续 watchlist，answer-level host path 是当前最慢红线
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
  - `openclaw plugins list`：`pass`
  - `openclaw plugins inspect unified-memory-core --json`：`pass`（loaded/install version `0.2.1`）
  - `npm run runtime:check`：`pass`
  - `node --test test/openclaw-cli-memory-benchmark-cases.test.js test/query-rewrite.test.js test/openclaw-memory-search-transport-watch.test.js`：`pass`
  - `node scripts/eval-openclaw-cli-memory-benchmark.js --entrypoints memory_search --skip-legacy ...`：`125/125`
  - `node scripts/watch-openclaw-memory-search-transport.js --format markdown`：`17/24 raw ok；7 watchlist`
  - `node scripts/eval-openclaw-cli-agent-answer-matrix.js --skip-legacy --max-cases 36 --format markdown`：`0/36`（当前 answer-level host path red）
  - `npm run umc:cli -- registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown`：`noop / adopt_canonical_root`
  - `npm run umc:cli -- review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split-rehearsal --format markdown`：`pass`
  - `npm run smoke:eval -- --format markdown`：`28/28`
  - `npm run smoke:eval:critical -- --format markdown`：`18/18`
  - `npm run eval:memory-search:cases -- --skip-builtin --format json`：plugin signal/source `30/30`
  - live host `after_tool_call` accepted-action canary：`pass`（1 条 `target_fact` stable；2 条 `outcome_artifact` observation）
  - Markdown 链接扫描：`251` files scanned；source docs `issueCount = 0`（忽略 `dist/openclaw-release/` 生成产物）
  - `git diff --check`：`pass`

## In Progress

- 下一阶段已从 planning 切到 execution：`200+` case 扩面、中文 `50%`、answer-level gate / transport watch 正式化、主链路慢点优化
- 当前 live `openclaw agent` answer-level path 仍需要单独看待：retrieval-heavy `125/125` 与 transport watchlist 已拆开，但当前 `agent` 子矩阵 `0/36`，而且首轮 perf baseline 样本显示 answer-level 平均约 `32s`
- 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿
- 保持 host-neutral root policy 在 CLI、公开文档和控制面里持续一致
- 保持 project/workstream roadmap 摘要与新的评测驱动主线持续一致
- 继续观察 legacy root 是否只停留在兼容回退窗口，而不是重新变成 active root
- 把 accepted-action 的 Step 48-52 继续明确维持在 deferred enhancement queue，而不是在 Step 47 完成后继续悄悄并进当前 closeout baseline
- 保持 OpenClaw `after_tool_call` accepted-action runtime hook 与配置/文档/宿主部署验证持续一致
- 在每轮算法变更后重跑评测并写回可读报告

## Blockers / Open Decisions

- answer-level host path 当前是红的：live `openclaw agent` 子矩阵 `0/36`，首轮 perf baseline 还显示 `~32s` 平均耗时与直接 abstain / timeout
- operator / planning follow-up 只剩：
  - 什么时候清理过时的 legacy root 副本
  - accepted-action Step 48-52 何时具备重开实现的前置条件

## Next 3 Actions

1. 把 benchmark 从 `187` 扩到 coverage-first 的 `200+`，优先补中文、cross-source、supersede、negative 和 answer-level 盲区。
2. 把中文案例真正做到不少于 `50%` 的实际运行面，并把 answer-level / negative 的中文题补齐。
3. 先把 answer-level host path red line 当成正式门禁和 triage 主线，再按 perf baseline 优化最慢层。

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

- Objective: 执行 `200+` case coverage-first 扩面、中文 `50%`、answer-level gate / transport watch 正式化，并按 perf baseline 推进主链路优化
- Plan Link: `execute-200-case-benchmark-and-answer-path-triage`
- Runway: 200+ case 扩面、中文案例补盲、answer-level red-path triage、正式门禁、perf-baseline-driven optimization；并行守住 release-preflight 和 canonical-root policy
- Progress: `0 / 4` tasks complete
- Stop Conditions:
  - benchmark expansion degenerates into pure case count chasing
  - answer-level host-path regression gets misclassified as raw transport or retrieval quality
  - slow-path optimization starts before answer-level and transport evidence are separated

## Execution Tasks

- [ ] EL-1 expand the benchmark from `187` to a coverage-first `200+` cases
- [ ] EL-2 make Chinese cases at least `50%` of the runnable matrix
- [ ] EL-3 turn the answer-level host path and raw transport watchlist into formal gates, then triage the answer-level red path
- [ ] EL-4 use the perf baseline to prioritize slow-path optimization and refresh reports / control-surface state

## Development Log Capture

- Trigger Level: high
- Pending Capture: no
- Last Entry: `docs/devlog/2026-04-13-isolate-compaction-fallback-test-from-host-config.md`
