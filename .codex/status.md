# Status

## Delivery Tier

- Tier: `large`
- Last reviewed: `2026-04-15`

## Current Phase

`post-stage5 evaluation-driven optimization`

## Active Slice

`close-remaining-deeper-watch-failures-after-14-of-18`

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
  - `evals/openclaw-cli-memory-benchmark-cases.js` 已形成 `392` 条 runnable matrix，其中 zh-bearing = `211 / 392 = 53.83%`
  - `scripts/eval-openclaw-cli-memory-benchmark.js` 已成为统一 benchmark 入口，支持 case filtering、entrypoint filtering、Markdown/JSON 报告和关键 legacy attribution
  - `scripts/watch-openclaw-memory-search-transport.js` 已把 raw `openclaw memory search` transport 单独收口成 watchlist
  - retrieval-heavy formal gate 已扩到：`250/250`
  - 自然中文补强已落地：`24` 条 `[zh-natural]` 案例（`12` retrieval + `12` answer-level），代表性 retrieval slice `5/5`、代表性 answer-level slice `6/6`
  - transport watchlist 当前 formal watch 结果：`3/8 raw ok`，其余为 `4` 条 `missing_json_payload` 与 `1` 条 `empty_results`
  - isolated local answer-level formal gate 已扩大并收口为：`12/12`，正式路径是 `openclaw agent --local` + isolated eval agent `umceval65`
  - benchmark-driven 第一轮修复已落地：`guessing policy` query rewrite 与 fallback rewrite fan-out 已补齐，失败项归零
  - answer-level benchmark wrapper prompt 现在会在 query rewrite 前被剥掉，不再让 `Based only on your memory...` 这类测试包装语污染 retrieval query
  - 总览报告已补齐：[reports/generated/openclaw-cli-memory-eval-program-2026-04-14.md](../reports/generated/openclaw-cli-memory-eval-program-2026-04-14.md)
- development plan `59-70` 已收口成正式产物：
  - `187` case coverage review 与 `200+` 扩面规划已写成报告：[reports/generated/openclaw-cli-memory-coverage-plan-2026-04-14.md](../reports/generated/openclaw-cli-memory-coverage-plan-2026-04-14.md)
  - runnable matrix 已扩到 `392` cases；zh-bearing runnable matrix = `211/392 = 53.83%`
  - retrieval-heavy 正式 gate 已扩到 `250/250`
  - answer-level formal gate 已收口成更大的 isolated local gate：`12/12`，使用 `openclaw agent --local` + isolated eval agent `umceval65`
  - 自然中文专项已补齐：代表性 retrieval slice `5/5`，代表性 answer-level slice `6/6`
  - raw `openclaw memory search` transport watchlist 已固定为独立 host watch：`3/8 raw ok`，其余为 `4` 条 `missing_json_payload` 与 `1` 条 `empty_results`
  - retrieval / assembly / answer-level 主链路性能专项计划已补齐：[docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md](../docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md)
  - 主链路性能刷新基线已落地：[reports/generated/main-path-performance-baseline-2026-04-15.md](../reports/generated/main-path-performance-baseline-2026-04-15.md)
  - 当前 perf 归因已经明确：retrieval / assembly 平均 `16ms`；raw transport 平均 `8061ms`；isolated local answer-level 平均 `11200ms`
  - host output-shape hardening 已补齐：更强的 JSON payload 提取、isolated eval agent stale session lock 清理、取消 per-case destructive session reset，以及 parse failure bounded retry
  - 更深的 `18` case answer-level watch 已从 `7/18` 提升到 `14/18`，formal gate 本身的中文占比也已抬到 `6/12`；剩余 `4` 条失败现在集中在 current-editor、cross-source-calls、zh-project 和 zh-natural-cross-source-calls
  - answer-level root cause 已显式拆开：gateway/session-lock 噪声、agent main-session 复用污染、CLI `--local` JSON 走 stderr
  - `78-80` 总结报告已补齐：[reports/generated/openclaw-natural-chinese-watch-and-perf-2026-04-15.md](../reports/generated/openclaw-natural-chinese-watch-and-perf-2026-04-15.md)
  - `77` 和 follow-up `81-83` 已把 answer-level formal gate 从 `6/6` 扩到 `12/12`，并补上 repo-default 的 isolated local formal gate 入口：[reports/generated/openclaw-answer-level-gate-expansion-2026-04-15.md](../reports/generated/openclaw-answer-level-gate-expansion-2026-04-15.md)
- realtime memory-intent ingestion 的 doc-first baseline 已落地：
  - memory-intent replay 回归面已补到 `7` 条高混淆案例，覆盖 durable / session / task-only / no-memory / profile / workflow-rule 边界
  - `scripts/eval-memory-intent-replay.js`、`evals/memory-intent-replay-cases.json`、`test/memory-intent-replay-cases.test.js` 已形成正式 replay 面
  - `memory_intent` 现在已成为正式 source type / contract，显式包含 category、durability、confidence、admission route、structured rule
  - Codex adapter `writeAfterTask(...)` 已能消费 `memoryExtraction` / `memory_extraction`，并在 `should_write_memory=true` 时实时写入 governed `source + reflection + promotion`
  - CLI 已支持 `memory_intent` declared source intake，contract / source / reflection / runtime / CLI 回归已补齐
  - `npm run verify:memory-intent` 已成为这条 slice 的正式 gate
  - architecture / self-learning / development-plan / control-surface 文档已补上 realtime memory-intent ingestion 设计基线并收口
- control-surface 与 host-neutral workstream docs 已再次对齐：
  - 不再把 canonical-root cutover 描述成“仍待决定的窗口”
  - 当前维护重点是防止 policy drift，而不是重新定义 hard gate
- project workstream roadmap 已重新对齐到 post-Stage-5 维护态：
  - 不再把“roadmap 收口 + 新 enhancement plan”写成当前主线
  - 当前项目级主线明确收口为：守住 release-preflight、deployment verification、memory-search governance、root policy
- 当前验证已完成：
  - Stage 5 targeted tests：`3/3`
  - release / deployment targeted tests：`71/71`
  - full repo `npm test`：`403/403`
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
  - `node --test test/query-rewrite.test.js test/openclaw-cli-memory-benchmark-cases.test.js test/openclaw-memory-search-transport-watch.test.js test/openclaw-agent-eval-prompt.test.js`：`pass`
  - `node scripts/eval-openclaw-cli-memory-benchmark.js --entrypoints memory_search --skip-legacy ...`：`262/262`
  - `node scripts/eval-openclaw-cli-memory-benchmark.js --agent umceval65 --entrypoints memory_search --skip-legacy --only zh-natural-profile-search-1,zh-natural-project-search-1,zh-natural-temporal-search-1,zh-natural-rule-search-1,zh-natural-temporal-search-3 ...`：`5/5`
  - `node scripts/eval-openclaw-cli-memory-benchmark.js --agent umceval65 --entrypoints agent --skip-legacy --agent-local --only agent-zh-natural-name-1,agent-zh-natural-project-1,agent-zh-natural-editor-1,agent-zh-natural-region-1,agent-zh-natural-rule-1,agent-zh-natural-negative-1 ...`：`6/6`
  - `node scripts/watch-openclaw-memory-search-transport.js --format markdown --per-category 1 --max-probes 8 --timeout-ms 8000 ...`：`3/8 raw ok`（`4` 条 `missing_json_payload`，`1` 条 `empty_results`）
  - `npm run eval:openclaw:agent-matrix -- --agent-timeout-ms 35000 --format markdown`：`12/12`
  - `node scripts/eval-openclaw-cli-memory-benchmark.js --entrypoints agent --agent umceval65 --skip-legacy --agent-local --only agent-name-1,agent-project-1,agent-rule-no-guess-1,agent-cross-source-calls-1,agent-current-editor-1,agent-current-demo-1,agent-history-editor-1,agent-project-city-1,agent-zh-project-1,agent-zh-temporal-1,agent-zh-natural-name-1,agent-zh-natural-project-1,agent-zh-natural-editor-1,agent-zh-natural-history-editor-1,agent-zh-natural-conflict-region-1,agent-zh-natural-cross-source-calls-1,agent-zh-natural-negative-1,agent-negative-1 ...`：`14/18`
  - `npm run eval:main-path:perf`：`pass`
  - `npm run verify:memory-intent`：`pass`
  - `npm run umc:cli -- registry migrate --source-dir ~/.openclaw/unified-memory-core/registry --target-dir ~/.unified-memory-core/registry --format markdown`：`noop / adopt_canonical_root`
  - `npm run umc:cli -- review split-rehearsal --source-dir ~/.unified-memory-core/registry --target-dir /tmp/umc-split-rehearsal --format markdown`：`pass`
  - `npm run smoke:eval -- --format markdown`：`28/28`
  - `npm run smoke:eval:critical -- --format markdown`：`18/18`
  - `npm run eval:memory-search:cases -- --skip-builtin --format json`：plugin signal/source `30/30`
  - live host `after_tool_call` accepted-action canary：`pass`（debug-only `umc_emit_accepted_action_canary` 经真实 OpenClaw tool execution -> event bus -> hook 自动写入 canonical registry；本轮结果为 `2` 条 `outcome_artifact` observation，`promoted=0`，符合一次性 canary outcome 预期）
  - Markdown 链接扫描：`251` files scanned；source docs `issueCount = 0`（忽略 `dist/openclaw-release/` 生成产物）
  - `git diff --check`：`pass`

## In Progress

- 下一阶段已切到更深的 answer-level 主线：在 `12/12` formal gate、自然中文覆盖、watchlist 和 perf baseline 已重新稳定的前提下，继续补强 cross-source / conflict / history 深度
- 当前 answer-level 已不再是“算法是否可用”的 blocker：repo-default isolated local formal gate `12/12` 已稳定通过，且 formal gate 内中文样本已提升到 `6/12`；更深的 `18` case watch matrix 当前结果 `14/18`，后续重点是收掉剩余 `4` 条 harder failures
- 保持 release-preflight、bundle install、host smoke、Stage 5 acceptance 证据持续为绿
- 保持 host-neutral root policy 在 CLI、公开文档和控制面里持续一致
- 保持 project/workstream roadmap 摘要与新的评测驱动主线持续一致
- 继续观察 legacy root 是否只停留在兼容回退窗口，而不是重新变成 active root
- 把 accepted-action 的 Step 48-52 继续明确维持在 deferred enhancement queue，而不是在 Step 47 完成后继续悄悄并进当前 closeout baseline
- 保持 OpenClaw `after_tool_call` accepted-action runtime hook 与配置/文档/宿主部署验证持续一致
- 在每轮算法变更后重跑评测并写回可读报告

## Blockers / Open Decisions

- raw `openclaw memory search` transport 仍是显式 watchlist：`3/8 raw ok`，其余为 `4` 条 `missing_json_payload` 与 `1` 条 `empty_results`
- gateway / shared-session 路径仍可能带来宿主噪声；当前正式 answer-level gate 已改走 isolated local path
- operator / planning follow-up 只剩：
  - 什么时候清理过时的 legacy root 副本
  - accepted-action Step 48-52 何时具备重开实现的前置条件

## Next 3 Actions

1. 收掉 `100` case live A/B 里两条 shared-fail 中文 history case：`ab100-zh-history-editor-2`、`ab100-zh-history-editor-4`。
2. 在 shared-fail history cases 清掉后，重新设计下一轮更偏 `cross-source`、`conflict`、`multi-step history` 和高信息密度自然中文的 live A/B，让 Memory Core 在更多 harder cases 上形成清晰净增益。
3. 在下一轮 A/B 设计完成后，再决定是否把更深 watch surface 继续晋升成新的 formal gate 层。

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

- Objective: 先把 `100` case live A/B 里剩余的 shared-fail history cases 收掉，再推动更多 harder cases 形成 Memory Core 独占胜场
- Plan Link: `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains`
- Runway: builtin-only regression fix、shared-fail history closure、cross-source/conflict/history/natural-Chinese A/B redesign、gateway/raw transport watch；并行守住 release-preflight 和 canonical-root policy
- Progress: `1 / 3` tasks complete
- Stop Conditions:
  - deeper-watch harder failures get promoted without root-cause attribution
  - answer-level host-path regression gets misclassified as raw transport or retrieval quality
  - perf / release evidence gets rerun before the deeper-watch closure boundary is clear

## Execution Tasks

- [x] EL-1 close the builtin-only regression in the `100` case live A/B: `ab100-zh-negative-4`
- [ ] EL-2 close the shared-fail Chinese history cases in the `100` case live A/B: `ab100-zh-history-editor-2` and `ab100-zh-history-editor-4`
- [ ] EL-3 redesign the next live A/B around `cross-source`, `conflict`, `multi-step history`, and denser natural-Chinese prompts so Memory Core can win on more harder cases

## Development Log Capture

- Trigger Level: high
- Pending Capture: no
- Last Entry: `docs/devlog/2026-04-13-isolate-compaction-fallback-test-from-host-config.md`
