# Plan

## Current Phase

`post-stage5 evaluation-driven optimization`

## Current Results Snapshot

- Program: `execute-200-case-benchmark-and-answer-path-triage`
- Status: `completed`
- Runnable matrix: `392` cases
- Chinese coverage: `211 / 392 = 53.83%`
- Natural Chinese cases: `24` (`12` retrieval + `12` answer-level)
- Retrieval-heavy formal gate: `250 / 250`
- Isolated local answer-level formal gate: `12 / 12` (`6 / 12` zh-bearing inside the formal gate)
- Natural-Chinese representative retrieval slice: `5 / 5`
- Natural-Chinese representative answer-level slice: `6 / 6`
- Deeper answer-level watch matrix: `18` cases, `9 / 18` zh-bearing
- Deeper answer-level watch result: `14 / 18`
- Deeper watch interpretation: useful as a triage surface, not yet promotable into the repo-default formal gate because the remaining `4` failures are now a smaller harder set that still needs targeted fixing
- Raw transport watchlist: `3 / 8 raw ok`; the rest are `4` `missing_json_payload` failures and `1` `empty_results`
- Main-path perf baseline: retrieval / assembly avg `16ms`; raw transport avg `8061ms`; isolated local answer-level avg `11200ms`
- Interpretation: the `200+` case buildout, natural-Chinese / watchlist / perf hardening, and the first answer-level gate expansion are complete; the builtin-only regression is now gone from the `100`-case live A/B, so the next phase is to close the remaining shared-fail history cases first

## Slices

- Slice: `build-openclaw-cli-100-case-benchmark`
  - Objective: 把当前 `20` 案例扩展成 `100+` OpenClaw CLI benchmark，覆盖稳定事实、普通检索、当前态覆盖、负向拒答、冲突事实、连续更新和跨来源归因
  - Dependencies: 现有 `umceval` 夹具、OpenClaw CLI、评测报告、case fixtures、A/B 对照脚本或手工流程
  - Risks: 如果只是机械堆案例而没有分类和归因，测试数量会增加，但无法真正驱动算法优化
  - Validation: `100+` 案例定义文档、机器可读结果、人工可读报告、可重复运行入口
  - Exit Condition: 至少 `100` 个案例能稳定运行，并能按类别和入口统计结果
  - Status: `completed`

- Slice: `plan-200-case-benchmark-and-main-path-performance`
  - Objective: 把当前 `187` case 评测面 review 成更全面的 `200` case 计划，并为 retrieval / assembly / answer-level 主链路建立性能专项计划
  - Dependencies: 当前 benchmark 结果、answer-level matrix 报告、transport watchlist、现有 release-preflight / Stage 5 证据
  - Risks: 如果只追求 200 这个数字而不补盲区，coverage 会失真；如果不先规划性能面，answer-level 与 retrieval 成本会继续模糊
  - Validation: roadmap / development plan / control surface 同步，明确中文案例 `>= 50%`、coverage review 方法、主链路 perf baseline 入口
  - Exit Condition: 下一轮执行可以直接按 coverage matrix 和 perf plan 开工，而不是重新定义问题
  - Status: `completed`

- Slice: `execute-200-case-benchmark-and-answer-path-triage`
  - Objective: 把 benchmark 从 `187` 扩成 coverage-first 的 `200+` case，真正把中文做到 `50%`，并把 answer-level host path red line 与 transport watchlist 变成正式门禁
  - Dependencies: 当前 `187` case 结果、coverage review 报告、main-path perf baseline、answer-level matrix 入口、transport watchlist 入口
  - Risks: 如果继续只做 retrieval-heavy 扩面，answer-level host path 会持续红而且无法被正式约束；如果中文只做翻译版，coverage 会继续失真
  - Validation: `200+` case 定义、中文案例实际占比统计、answer-level gate 报告、transport watchlist 报告、main-path perf baseline refresh
  - Exit Condition: 下一轮 benchmark 不再有明显 coverage blind spots，answer-level/transport gate 进入常规门禁，且最慢层已有可解释优化路径
  - Status: `completed`

- Slice: `expand-answer-level-formal-gate-after-natural-zh-hardening`
  - Objective: 在自然中文覆盖、raw transport watchlist 和 main-path perf baseline 已重新稳定的前提下，把 isolated local answer-level formal gate 从 `6` 条代表性样本继续扩成更大的稳定矩阵
  - Dependencies: `392` case runnable matrix、自然中文代表性子矩阵、transport failure-class watchlist、`2026-04-15` perf baseline、isolated eval agent `umceval65`
  - Risks: 如果 answer-level 扩容时重新把 gateway/shared-session 噪声混回正式结论，新的 larger matrix 会再次失真；如果只加题数不补 conflict / abstention blind spots，扩容不会真正提升证据质量
  - Validation: 更大的 isolated local answer-level gate 报告、与 raw transport watchlist 分离的归因、中文 answer-level 子矩阵持续为绿、main-path perf baseline 重跑
  - Exit Condition: answer-level formal gate 不再依赖 `6` 条代表性样本，同时自然中文、watchlist、perf 这三条已完成基线继续保持稳定
  - Status: `completed`

- Slice: `deepen-answer-level-gate-beyond-12-case-baseline`
  - Objective: 在 `12 / 12` isolated local answer-level formal gate 已稳定的基础上，继续补强 cross-source、conflict、multi-step history 和更深的自然中文 answer-level coverage
  - Dependencies: `2026-04-15` answer-level formal gate report、`392` case matrix、`24` natural-Chinese cases、transport failure-class watchlist、main-path perf baseline
  - Risks: 如果继续只靠当前 `12` 条稳定样本，formal gate 会再次偏向“容易答对的代表题”；如果扩容时把 gateway/shared-session 噪声混回正式门禁，结论会再次失真
  - Validation: 更深 answer-level gate 报告、control-surface 更新、与 transport watchlist 分离的结论、main-path perf baseline refresh
  - Exit Condition: formal gate 覆盖面超出当前 `12` 条稳定基线，同时 current/history/conflict/cross-source/zh-natural 深度补齐
  - Status: `completed`

- Slice: `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains`
- Objective: 先收掉 `100` case live A/B 里剩余的 shared-fail history cases，再把更多 harder cases 推成 Memory Core 独占胜场
  - Dependencies: `2026-04-15` memory-improvement A/B report、isolated local formal gate `12 / 12`、deeper watch `14 / 18`、raw transport watchlist、main-path perf baseline
- Risks: 如果继续停留在 `97` shared wins、`1` UMC-only、`0` builtin-only、`2` shared fails，产品仍然很难证明“在真实问题上明显比默认内置更强”
  - Validation: builtin-only regression fix、shared-fail history closure、下一轮 live A/B 设计、full regression / perf / A/B rerun
  - Exit Condition: 当前 regression 被关闭，且下一轮 live A/B 已明确瞄准 cross-source / conflict / history / 自然中文的净增益
  - Status: `ongoing`

- Slice: `formalize-realtime-memory-intent-ingestion`
  - Objective: 把“主回复 + `memory_extraction`”从局部 runtime seam 收口成正式产品契约，补上 ordinary conversation rule 的实时 governed ingest 入口
  - Dependencies: `evals/memory-intent-replay-cases.json`、`scripts/eval-memory-intent-replay.js`、`src/codex-adapter.js`、self-learning / codex-adapter architecture docs、development plan
  - Risks: 如果继续把普通 conversation rule 留给 nightly 补捞，明显规则仍会漏；如果在 schema / admission route 未清晰前直接扩大 rollout，会把 session 与 durable 混淆
  - Validation: replay suite、Codex adapter tests、architecture docs、development plan、control-surface state
  - Exit Condition: `memory_extraction` contract、admission routing 方向和 replay gate 都已明确，后续实现不再依赖聊天上下文恢复
  - Status: `completed`

- Slice: `attribute-memory-capability-sources`
  - Objective: 对同一批核心案例做 `legacy / unified / bootstrap / retrieval` 对照，明确答案来源和扩展增益边界
  - Dependencies: 临时 legacy profile、当前 unified host profile、benchmark 案例分层、A/B 报告文档
  - Risks: 如果归因只写结论不留证据，后续优化会再次混淆“原生能力”和“扩展增益”
  - Validation: A/B 对照报告、关键案例证据、来源分类说明
  - Exit Condition: 用户能直接从报告看懂哪些能力来自原生、哪些来自扩展、哪些只是 bootstrap 输入
  - Status: `completed`

- Slice: `turn-failures-into-algorithm-iterations`
  - Objective: 把 benchmark 失败案例转成 retrieval / assembly / policy 算法问题清单，并按轮次修复、复测、提交
  - Dependencies: benchmark 结果、A/B 报告、`src/assembly.js`、retrieval / policy surfaces、回归测试
  - Risks: 如果修复后不重跑 benchmark，优化会再次退回“感觉变好了”而不是证据驱动
  - Validation: 每轮失败清单、对应修复、复测结果、GitHub commit
  - Exit Condition: benchmark 失败项被持续压缩，且新问题能快速回写成回归保护
  - Status: `completed`

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
  - Validation: `npm run smoke:eval -- --format markdown`、`npm run smoke:eval:critical -- --format markdown`、`npm run eval:memory-search:cases -- --skip-builtin --format json`、project/workstream roadmap、control-surface status
  - Exit Condition: later-phase planning 只会从稳定的 operator baseline 打开，project roadmap 不再和 live control docs 冲突
  - Status: `completed`

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

1. 先收掉 `100` case live A/B 里两条 shared-fail 中文 history case：`ab100-zh-history-editor-2`、`ab100-zh-history-editor-4`
2. 继续保持 `24` 条自然中文案例、当前 raw transport watchlist 和 `2026-04-15` perf baseline 在下一轮修复中持续稳定
3. 在 shared-fail history cases 收口后，重设计下一轮 live A/B，让更多 `cross-source`、`conflict`、`multi-step history` 与高信息密度自然中文场景变成 Memory Core 独占胜场
4. 把 gateway/shared-session 与 raw transport 继续保持在独立 watchlist，不与算法判断混淆
5. 在 regression 清掉后，重设计下一轮 live A/B，让更多 `cross-source`、`conflict`、`multi-step history` 与高信息密度自然中文场景变成 Memory Core 独占胜场
6. 并行保持 release-preflight / bundle install / host smoke / Stage 5 evidence 稳定
7. 保持 host-neutral root operator policy 可见且不回退
8. 保持 accepted-action deeper queue 的 Step 48-52 仍然显式 deferred，不把 admission / negative-path / conflict work 偷渡进当前实现
9. memory-intent slice 已收口完成；后续只在更高层 benchmark / runtime adoption 里继续观察 drift

## Architecture Supervision
- Signal: `yellow`
- Signal Basis: open blockers or architectural risks are still recorded
- Problem Class: shared-fail history closure and turning mostly-shared A/B wins into clearer UMC gains
- Root Cause Hypothesis: 如果 `100` case live A/B 继续停留在 `97` shared wins、`1` UMC-only、`0` builtin-only、`2` shared fails，产品仍然很难证明“Memory Core 在真实问题上明显比默认内置更强”
- Correct Layer: live A/B case design, retrieval / assembly behavior, negative-case abstention, history/supersede handling, transport watchlist, main-path performance baseline, control surface
- Rejected Shortcut: 跳过 Stage 5 证据面和当前 operator baseline，直接讨论 runtime API / service mode
- Automatic Review Trigger: no automatic trigger is currently active
- Escalation Gate: raise but continue

## Current Execution Line

- Objective: 先把 `100` case live A/B 里剩余的 shared-fail history cases 收掉，再推动更多 harder cases 形成 Memory Core 独占胜场
- Plan Link: `convert-100-case-ab-from-mostly-shared-wins-into-clearer-umc-gains`
- Runway: shared-fail history closure、cross-source/conflict/history/natural-Chinese A/B redesign、gateway/raw transport watch
- Progress: `0 / 3` tasks complete
- Stop Conditions:
  - remaining harder failures get promoted without root-cause attribution
  - answer-level regression gets misdiagnosed as raw transport noise
  - perf / release evidence is rerun before the deeper-watch closure boundary is clear
  - Stage 5 evidence regresses while this enhancement work is ongoing
- Validation: deeper-watch reruns、failure attribution notes、formal-gate promotion decision、`npm run umc:release-preflight`、full regression、CLI use cases、main-path perf baseline、memory-improvement A/B summary、roadmap / development plan、`npm run umc:cli -- registry inspect --format markdown`

## Execution Tasks

- [x] EL-1 close the builtin-only regression in the `100` case live A/B: `ab100-zh-negative-4`
- [ ] EL-2 close the shared-fail Chinese history cases in the `100` case live A/B: `ab100-zh-history-editor-2` and `ab100-zh-history-editor-4`
- [ ] EL-3 redesign the next live A/B around `cross-source`, `conflict`, `multi-step history`, and denser natural-Chinese prompts so Memory Core can win on more harder cases

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
