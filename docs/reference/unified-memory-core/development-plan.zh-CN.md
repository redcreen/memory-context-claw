# Unified Memory Core Development Plan

[English](development-plan.md) | [中文](development-plan.zh-CN.md)

## 目的

这份文档是 `Unified Memory Core` 的顺序执行队列。

它应该只回答一个实际问题：

`接下来到底先做什么、后做什么、今天应该从第几步恢复？`

相关文档：

- [../../roadmap.zh-CN.md](../../roadmap.zh-CN.md)
- [../../architecture.zh-CN.md](../../architecture.zh-CN.md)
- [deployment-topology.zh-CN.md](deployment-topology.zh-CN.md)
- [architecture/README.zh-CN.md](architecture/README.zh-CN.md)
- [roadmaps/README.zh-CN.md](roadmaps/README.zh-CN.md)
- [blueprints/README.zh-CN.md](blueprints/README.zh-CN.md)
- [testing/README.zh-CN.md](testing/README.zh-CN.md)

## 最终目标

`Unified Memory Core` 最终应该成为：

- 一套受治理的共享记忆底座
- 一个可被 OpenClaw、Codex 和后续工具复用的产品核心层
- 一个具备显式 namespace、可见性规则、可修复工件的多 adapter 系统
- 一个既能嵌入宿主，也能独立运行的产品

## 当前产品承诺与执行映射

当前执行计划也要直接锚定到 3 个用户承诺：

1. `轻快`
   - 已落地：fact-first assembly、Stage 6 runtime shadow instrumentation、release-preflight、Docker hermetic eval
   - 下一步：先把 context loading optimization 做成正式主线和正式门禁，再收 ordinary-conversation realtime-write latency，最后才是 install / bootstrap / verify
2. `聪明`
   - 已落地：realtime `memory_intent` ingestion + nightly governed learning + working-set shadow path
   - 下一步：在 context optimization scorecard 稳定后，把 shadow-first 的 context decision 逐步推进到 bounded、guarded 的窄路径收益
3. `省心`
   - 已落地：CLI / audit / replay / rollback operator 流程、canonical registry root、OpenClaw / Codex adapters
   - 下一步：继续保持这些流程可读、可 replay、可发版，并补强跨 Codex / 多实例的产品证据

## 产品北极星与执行解释

> 装得简单，用得顺手，跑得轻快，记得聪明，维护省心。

把它翻成执行要求：

- `轻快`
  - 安装、默认配置、首次验证、prompt thickness、latency、runtime cost 一起进门禁
- `聪明`
  - bounded decision contract、self-learning、working-set pruning、budgeted assembly 一起提升“判断质量”
- `省心`
  - rollback boundary、operator metrics、hermetic / Docker eval、shared registry 入口必须在每次推进前写清楚

## 北极星驱动的当前优先级

这份计划现在不再只是“docs-first review”。

接下来应该按 3 个用户承诺来排当前优先级：

1. `轻快 / context loading optimization`
   - 先把每轮 context thickness、working-set reduction、budgeted assembly 和 answer-level latency 收成正式主线
2. `轻快 / realtime-write latency`
   - 再把 hermetic ordinary-conversation 写记忆路径里的 timeout / latency 问题压下去
3. `轻快 / install`
   - 然后再收 install / bootstrap / verify 路径
4. `聪明`
   - 在 bounded decision contract 明确后，把 shadow-first 结果推进到极窄的 guarded opt-in 路径
5. `省心`
   - 补 OpenClaw 之外，尤其是 Codex / 多实例的产品证据，并继续守住 rollback / replay / audit 能力

## 怎么使用这份计划

把这份文档当成一条单线执行队列来看。

规则：

1. 先做完当前阶段，再开始下一个阶段
2. 严格按编号顺序推进
3. 标记为 `completed` 的步骤，不要重开，除非出现 bug 必须返工
4. 标记为 `next` 的步骤，就是当前准确的恢复点
5. 当前阶段之外的事项一律延后

## 当前位置

当前状态：

- `Stage 1`：已完成
- `Stage 2`：已完成
- `Stage 3`：已完成
- `Stage 4`：已完成
- `Stage 5`：已完成
- `Stage 6`：已完成
- `Stage 7`：进行中
- `Stage 8`：下一阶段
- `Stage 9`：进行中（`default-off` / opt-in only）
- 当前指针：`108`
- 当前建议：Stage 7 scorecard 与 Stage 9 guarded seam 已落地；下一步先做 Stage 7 closeout 判断与 Stage 8 ordinary-conversation realtime-write latency，再决定是否扩大 smart path

当前 baseline 已经落地：

- shared contracts
- `Source System` MVP
- 结构化 `accepted_action` source intake
- `Memory Registry` MVP
- 本地 `source -> candidate` pipeline
- `Projection System` MVP
- `Governance System` MVP
- OpenClaw adapter runtime integration
- Codex adapter runtime integration
- reflection / daily learning baseline
- standalone runtime / CLI baseline
- audit / repair / replay / export inspect baseline
- independent execution review baseline

仍然生效的执行约束：

- 实现继续保持 `local-first`
- 实现继续保持 `network-ready`，但不要求 `network-required`
- 不要跳过当前 step pointer

## 下一轮设计约束

这组约束用于把“下一轮逐轮 context 优化”限定在可回退、可测量的范围内：

- 继续保持 `dialogueWorkingSetShadow` 为 `default-off` 和 shadow-only，直到 promotion / rollback gate 足够清楚
- 不改 builtin memory 行为，也不把 builtin memory rewrite 当成当前主线
- 不把越来越大的硬编码规则表当成长期主路径；下一轮应优先定义 bounded、structured 的 LLM-led context decision contract
- LLM tool 调用次数必须受控；优先做单次结构化 decision，而不是在同一轮 prompt 上堆多次辅助调用
- 任何 active-path experiment 都必须先有 operator metrics、rollback boundary 和 hermetic / Docker 复现面

## 阶段总览

| 阶段 | 步骤范围 | 目标 | 状态 |
| --- | --- | --- | --- |
| Stage 1 | `1-10` | 冻结产品形态与文档基线 | `completed` |
| Stage 2 | `11-20` | 完成第一条 local-first 实现基线 | `completed` |
| Stage 3 | `21-30` | 完成 self-learning 生命周期基线 | `completed` |
| Stage 4 | `31-38` | 把受治理学习结果接到 adapter 策略使用 | `completed` |
| Stage 5 | `39-46` | 补齐产品运维与 split-ready 执行 | `completed` |
| Stage 6 | `93-100` | 在任何 active prompt cutover 前，用 runtime shadow mode 验证 dialogue working-set pruning | `completed` |
| Stage 7 | `101-108` | 把 context loading optimization 收成正式主线与正式门禁 | `in_progress` |
| Stage 8 | `109-114` | 压下 ordinary-conversation realtime-write 的 hermetic timeout / latency | `next` |
| Stage 9 | `115-120` | 以 bounded、guarded 方式让 context 优化开始变成用户收益 | `in_progress` |
| Stage 10 | `121-126` | 收 install / bootstrap / verify，并补强共享底座产品证据 | `planned` |

## 顺序开发计划

### Stage 1. 设计与文档基线

阶段完成标准：

- 产品形态明确
- 文档对齐完成
- 测试面定义完成

1. `completed` 冻结产品命名、边界和仓库方向。
2. `completed` 对齐顶层架构和主 roadmap。
3. `completed` 定义一等模块边界。
4. `completed` 补齐模块架构文档。
5. `completed` 补齐模块 roadmap、blueprint 和 todo。
6. `completed` 定义 testing surfaces 和 case matrix。
7. `completed` 定义 deployment topology 和多 runtime 模型。
8. `completed` 定义 artifacts、namespace、visibility、exports 的 shared contracts。
9. `completed` 定义 OpenClaw 和 Codex adapter 边界。
10. `completed` 定义 self-learning、standalone mode、independent execution 边界。

### Stage 2. Local-First 实现基线

阶段完成标准：

- 至少一条 local-first 产品闭环可以端到端运行
- adapters 能消费 governed exports
- standalone mode 可用

11. `completed` 实现 shared contracts 与 contract tests。
12. `completed` 实现 `Source System` MVP。
13. `completed` 实现 `Memory Registry` MVP。
14. `completed` 实现本地 `source -> candidate` pipeline 与 registry tests。
15. `completed` 实现 `Projection System` MVP。
16. `completed` 实现带 audit / repair / replay primitives 的 `Governance System` MVP。
17. `completed` 实现 OpenClaw adapter runtime integration。
18. `completed` 实现 Codex adapter runtime integration。
19. `completed` 实现 `Reflection System` MVP 与 daily reflection baseline。
20. `completed` 实现 standalone CLI、export / audit / repair / replay 面和 independent-execution review。

### Stage 3. Self-Learning 生命周期基线

阶段完成标准：

- observation candidates 可以进入受治理生命周期
- promotion 和 decay 明确可见
- learning-specific governance 可测试

21. `completed` 实现 learning candidates 的 promotion rules。
22. `completed` 实现弱信号和陈旧信号的 decay / expiry rules。
23. `completed` 实现 learned artifacts 的 conflict detection 和 conflict report。
24. `completed` 实现 promoted learning artifacts 的 stable registry update rules。
25. `completed` 增加 learning-specific audit reports。
26. `completed` 增加 learning-specific replay / repair 路径。
27. `completed` 增加 learning outcomes 的 time-window comparison reports。
28. `completed` 为 learning lifecycle 增加 regression coverage。
29. `completed` 验证 OpenClaw 对 promoted learning artifacts 的消费行为。
30. `completed` 以一条本地端到端的 `observation -> stable` governed loop 收口本阶段。

### Stage 4. Policy Adaptation 与多消费者使用

阶段完成标准：

- 受治理学习结果可以显式影响 consumer 行为
- adapter 侧策略使用可回滚、可测试

31. `completed` 定义 `policy-input artifact` contract。
32. `completed` 从 promoted learning artifacts 生成 policy-input projections。
33. `completed` 让 OpenClaw retrieval / assembly 消费 governed learning signals。
34. `completed` 让 Codex task-side consumption 消费 governed learning signals。
35. `completed` 增加 policy adaptation tests 和 rollback protections。
36. `completed` 增加 consumer-specific export compatibility reports。
37. `completed` 验证 learned artifacts 在跨 adapter 情况下的 namespace / visibility 行为。
38. `completed` 以一条可复现的 policy-adaptation loop 收口本阶段。

### Stage 5. 产品加固与独立运行

阶段完成标准：

- 产品具备长期可运维性
- split-ready execution 经过验证
- 后续 service mode 讨论基于稳定底座进行

39. `completed` 加固 file / directory / URL / image 输入的 standalone source adapters。
40. `completed` 增加 reflection 与 governance runs 的 scheduled-job 友好工作流。
41. `completed` 增加 self-learning maintenance workflow 文档与 CLI 支持。
42. `completed` 增加 release-boundary validation checks。
43. `completed` 增加 migration 和 repo-split rehearsal。
44. `completed` 增加 learning exports 的 reproducibility 和 rollback checks。
45. `completed` 复核 runtime API 或 network service mode 的前置条件。
46. `completed` 以 independent-product readiness review 收口本阶段。

### Stage 6. Dialogue Working-Set Shadow Integration

阶段完成标准：

- runtime shadow instrumentation 已存在且继续保持 `default-off`
- runtime 能记录 `relation / evict / pins / reduction ratio`，但不改正式 prompt
- 真实 session 的 shadow telemetry 足够稳定，能够支持是否打开 active-path experiment 的决策

Stage 6 证据：

- runtime replay 报告：[../../../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md](../../../reports/generated/dialogue-working-set-runtime-shadow-2026-04-16.md)
- runtime answer A/B 报告：[../../../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md](../../../reports/generated/dialogue-working-set-runtime-answer-ab-2026-04-16.md)
- runtime shadow summary：[../../../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md](../../../reports/generated/dialogue-working-set-runtime-shadow-summary-2026-04-16.md)
- Stage 6 收口报告：[../../../reports/generated/dialogue-working-set-stage6-2026-04-16.md](../../../reports/generated/dialogue-working-set-stage6-2026-04-16.md)

93. `completed` 先把这条 slice 保持成 docs-first、review-gated，再开始 runtime 工作。
   - roadmap、development plan 和 architecture 引用已经先对齐成正式 Stage 6 队列，不再只是 report 结论。
94. `completed` 在动代码前先定义 Stage 6 的 runtime shadow contract。
   - 当前 runtime 面已经固定成 `relation / evict / pins / reduction ratio`，并带 replayable exports 和 `default-off` 配置面。
95. `completed` 实现最小 runtime shadow instrumentation 路径。
   - `ContextAssemblyEngine.assemble()` 已能在真实 assembled session 上记录 shadow decision，且不改正式 prompt，也不改 builtin memory 行为。
96. `completed` 为真实 session 增加 shadow reports 和 replayable exports。
   - sidecar exports 现在保存 transcript prefix、decision payload、snapshot、token estimates，以及 operator summary。
97. `completed` 把 answer-level regression measurement 接到 shadow path 上。
   - runtime answer A/B 已复用真实 shadow exports，而不再只看 isolated helper snapshot。
98. `completed` 先定义 active-path promotion gate 与 rollback boundary，再讨论是否放行。
   - rollback 现在是纯配置回退：`dialogueWorkingSetShadow.enabled=false`；promotion 继续要求更长时间的 real-session soak 与显式 regression threshold。
99. `completed` 只有当 Stage 6 shadow gate 长期为绿后，才决定是否打开 active prompt experiment。
   - 当前决策：不打开 active prompt mutation，继续保持 shadow-only。
100. `completed` 把 Stage 6 收口到 docs、控制面和报告一致的恢复点。
   - 当前已经明确：Stage 6 是“测量面已落地”，不是“默认路径已切换”。

### Stage 7. Context Loading Optimization Closure

当前证据：

- Stage 7 shadow replay：[../../../reports/generated/dialogue-working-set-stage7-shadow-2026-04-17.md](../../../reports/generated/dialogue-working-set-stage7-shadow-2026-04-17.md)
- Stage 7 scorecard：[../../../reports/generated/dialogue-working-set-scorecard-2026-04-17.md](../../../reports/generated/dialogue-working-set-scorecard-2026-04-17.md)
- Stage 7 / Stage 9 汇总：[../../../reports/generated/dialogue-working-set-stage7-stage9-2026-04-17.md](../../../reports/generated/dialogue-working-set-stage7-stage9-2026-04-17.md)

阶段完成标准：

- context optimization 不再只是“有一些 shadow 报告”，而是变成有统一 scorecard 的正式主线
- durable-source slimming、budgeted assembly、working-set pruning、harder replay / Docker / local evidence 能放在同一张证据面上判断
- rollout / rollback boundary、operator metrics 和 harder-case coverage 已经足够支撑下一阶段
- 日常长对话尽量不需要依赖 compat / compact 才能继续；compat / compact 只保留为夜间或后台 safety net

101. `completed` 定义统一的 context optimization scorecard。
   - 最少包含：`prompt thickness`、`reduction ratio`、`retrieval / assembly latency`、`answer latency`、`rollback boundary`、`case class`
102. `completed` 把现有 evidence surface 统一映射到这套 scorecard。
   - 至少要把 durable-source slimming、Stage 6 shadow exports、history cleanup、ordinary-conversation Docker rerun 放到同一套汇总口径。
103. `completed` 定义“context loading package”契约。
   - 明确 raw turns、pins、capsules、durable context、budget slots 分别属于什么层，而不是只留在分散报告里。
104. `todo` 设计并补齐下一轮 harder eval matrix。
   - 优先补 `cross-source`、`conflict`、`multi-step history`、`open-loop return`、高信息密度自然中文多话题切换。
105. `completed` 给 context optimization 增加 formal gate 和 operator summary。
   - 让 Docker / local / replay 三条路径都能输出可比较的 thickness / latency / reduction 指标。
106. `completed` 把 shadow exports、sidecar artifacts 和 answer-level regression 重新收成同一条 operator 视图。
   - 不再只看孤立报告，而是能直接回答“更轻的 context package 是否真的更好”。
107. `completed` 先定义一个极窄的 guarded experiment seam，但不默认开启。
   - 必须是 config-only rollback，且 builtin memory 行为不变。
108. `in_progress` 基于 harder replay / Docker / local evidence 做 Stage 7 closeout 决策。
   - 决策对象不是“马上上线”，而是“Stage 8 能否在更干净的实时写记忆路径上继续推进”。

### Stage 8. Ordinary-Conversation Realtime-Write Latency Closure

阶段完成标准：

- ordinary-conversation hermetic 路径不再被 timeout 大面积主导
- clean Docker path 可以成为可信的常规 A/B 面
- timeout root cause 已经被拆清，不再混成“能力不行”

109. `todo` 把 ordinary-conversation realtime-write 路径单独收成 latency closure 专项。
   - 这条线和 context loading optimization 紧耦合，但不要再和污染排查混写。
110. `todo` 拆清 capture、governed ingest、retrieval、answer generation 各层 latency。
111. `todo` 针对 timeout-heavy case class 做定向优化与复测。
112. `todo` 固定 Docker hermetic ordinary-conversation 的常规报告入口和阈值。
113. `todo` 重跑 focused A/B，并和 host-live 结果做清晰归因对照。
114. `todo` 以“clean path 不再被 timeout 主导”作为 Stage 8 退出信号。

### Stage 9. Guarded Smart-Path Promotion

当前证据：

- Stage 9 guarded answer A/B：[../../../reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17.md](../../../reports/generated/dialogue-working-set-guarded-answer-ab-2026-04-17.md)
- Stage 7 / Stage 9 汇总：[../../../reports/generated/dialogue-working-set-stage7-stage9-2026-04-17.md](../../../reports/generated/dialogue-working-set-stage7-stage9-2026-04-17.md)

阶段完成标准：

- context 优化开始变成真实用户收益，而不只是 shadow telemetry
- bounded、guarded experiment seam 有清晰 rollout / rollback 规则
- active-path experiment 继续保持极窄，不扩成默认路径
- guarded smart path 仍然服务于“日常尽量不靠 compat / compact”，而不是把 compat / compact 搬进更频繁的主路径

115. `completed` 定义 bounded smart-path 的 promotion contract。
116. `completed` 选择一个极窄的 opt-in active-path experiment surface。
117. `completed` 让 operator metrics、rollback boundary 和 regression gate 绑定到这个 surface。
118. `completed` 在固定 case class 上跑 guarded opt-in A/B。
119. `completed` 决定当前继续维持 opt-in only。
120. `in_progress` 以“用户能感知到收益，但 operator 仍可控”收口本阶段。

### Stage 10. Adoption Simplification And Shared-Foundation Proof

阶段完成标准：

- install / bootstrap / verify 路径明显更短
- 共享底座不只停留在 OpenClaw 主路径
- Codex / 多实例证据变成公开可读的产品能力

121. `todo` 收 install / bootstrap / verify 的最短路径。
122. `todo` 把 package / startup / first-run 成本也收进 `轻快` 证据面。
123. `todo` 为 Codex 补更完整的 shared-foundation 评测和用例。
124. `todo` 为多实例共享底座补更明确的 operator 证据。
125. `todo` 保持 replay / rollback / audit 与 install 简化并行不退化。
126. `todo` 以“接入更短、共享证据更强”收口本阶段。
100. `completed` 等 Stage 6 telemetry 路径存在后，再恢复之前延后的 history cleanup 与 harder live A/B 扩面。
   - 下一条执行指针现在已经回到 `ab100-zh-history-editor-*` 清理和 harder A/B 扩面，并且可以直接挂上新的 shadow telemetry surface。

## 当前下一步

从这里恢复：

1. 从 `92` 开始，重设计更偏 `cross-source / conflict / multi-step history / 高信息密度自然中文` 的 harder live A/B
2. 继续保持 `dialogueWorkingSetShadow` 为 `default-off` 且 shadow-only，让这条 telemetry surface 继续 soak
3. 用新的 Stage 6 telemetry surface 承接更深 harder-case A/B，并在必要时决定是否晋升 formal gate

当前不要开始：

- runtime API
- 多主机 network service
- advanced network-required architecture
- 已有文档之外的 repo split execution 工作

## Post-Stage-5 评测驱动优化队列

这组步骤属于 Stage 5 之后的新主线。

它的目标不是重开 baseline contract work，而是：

- 把 OpenClaw CLI 记忆评测扩到 `100+` 案例
- 用 `legacy / unified / bootstrap / retrieval` 对照搞清能力来源
- 用失败案例持续驱动 assembly / retrieval / policy 算法优化

53. `completed` 建立 `100+` 案例 benchmark 设计与分层矩阵。
   - 至少覆盖：稳定事实、普通检索、当前态覆盖、负向拒答、冲突事实、连续更新、多轮历史、规则提取、项目知识、跨来源归因。
   - 每个案例必须标明：验证入口、期望答案、允许误差、能力标签、是否需要 A/B 对照。
54. `completed` 把现有 `20` 案例扩展成可重复运行的 `100+` OpenClaw CLI 测试集。
   - 默认优先走真实 `openclaw memory search` / `openclaw agent`。
   - 尽量避免只看 registry 内部状态来宣称“能力成立”。
55. `completed` 为 benchmark 增加 `legacy / unified / bootstrap / retrieval` 归因对照报告。
   - 目标不是简单比较分数，而是回答“答案来自哪里”和“哪些能力是扩展增益”。
56. `completed` 把 benchmark 失败项转成显式算法问题清单，并按优先级推进修复。
   - 优先修：当前态覆盖失败、旧值污染、错误拒答、错误命中来源、检索漏召回。
57. `completed` 每一轮算法改动后都要重跑 benchmark、更新文档报告、写回 control surface，并推送到 GitHub。
58. `completed` 当 `100+` 案例 benchmark 与 A/B 报告稳定后，再决定是否打开 runtime API / service-mode 等更后面的 enhancement phase。
   - 当前结论仍是：不要打开 runtime API / service-mode；先把 answer-level path、transport watchlist 和更全面 benchmark 规划收口。

## `200+` case 专项结果快照

这块用于把 `59-70` 的最终结果直接暴露在 plan 文档里，避免只看 development plan 时还需要跳回 `.codex/status.md` 或 benchmark 报告才能确认专项做到哪。

- 专项：`execute-200-case-benchmark-and-answer-path-triage`
- 当前状态：`completed`
- runnable matrix：`392` cases
- 中文占比：`211 / 392 = 53.83%`
- 自然中文案例：`24`（`12` retrieval + `12` answer-level）
- retrieval-heavy formal gate：`250 / 250`
- isolated local answer-level formal gate：`12 / 12`（formal gate 内中文样本 `6 / 12`）
- 自然中文代表性 retrieval slice：`5 / 5`
- 自然中文代表性 answer-level slice：`6 / 6`
- raw transport watchlist：`3 / 8 raw ok`；其余为 `4` 条 `missing_json_payload` 与 `1` 条 `empty_results`
- 最新 perf baseline：retrieval / assembly `16ms`；raw transport `8061ms`；isolated local answer-level `11200ms`
- 当前解释：`200+` case 扩面、自然中文补强、watchlist failure-class 化、perf baseline 刷新，以及 answer-level formal gate 从 `6/6` 扩到 `12/12` 都已收口；`100` case live A/B 里的 builtin-only regression 与 shared-fail history cases 都已被移除，后续主线应把 harder live A/B 继续推到 `cross-source / conflict / multi-step history / 自然中文` 上形成更清晰的 UMC-only 净增益

## 下一阶段规划队列

59. `completed` review 当前 benchmark 覆盖面，并把矩阵规划到更全面的 `200` case。
   - 重点是 coverage blind spots，而不是机械堆数量。
   - 必须显式覆盖：跨来源混合、冲突事实、supersede / current-vs-history、多轮 history、负向拒答、answer-level host path。
60. `completed` 把中文案例占比规划到至少 `50%`。
   - 中文不是附带翻译，而是要覆盖真实中文问法、中文 current-state 问题、中文规则题和中英混合问法。
61. `completed` 把 live `openclaw agent` answer-level matrix 和 raw transport watchlist 一起纳入下一轮正式门禁。
   - answer-level red path 必须单独看，不要继续和 raw transport instability 混在一起。
62. `completed` 为 retrieval / assembly / answer-level 主链路建立性能专项计划。
   - 至少定义：baseline 命令、测量维度、慢点分层、性能回归门禁。
63. `completed` 拿到主链路性能基线，并把最慢路径按 retrieval、assembly、宿主 answer-level、transport 分层归因。
64. `completed` 只有当 `200` case coverage 规划和主链路 perf baseline 都清晰后，才安排下一轮执行和优化优先级。

## 下一轮执行队列

65. `completed` 把 benchmark 从 `187` 扩成 coverage-first 的 `200+` case，并按 blind spot 补齐，而不是只堆改写。
   - 当前 runnable matrix = `392` cases，其中 retrieval-heavy = `262`，answer-level = `130`。
66. `completed` 把中文案例真正做成不少于 `50%` 的实际执行面，并在 retrieval / answer-level / negative 三层都占有实体比例。
   - 当前 zh-bearing runnable matrix = `211 / 392 = 53.83%`。
67. `completed` 把 answer-level host path 与 raw transport watchlist 纳入正式 benchmark gate，持续报告通过率、abstention rate、watchlist 分布。
   - retrieval-heavy gate：`250/250`
   - answer-level formal gate：`12/12`（`openclaw agent --local` + isolated eval agent `umceval65`）
   - transport watchlist：`3/8 raw ok`；其余为 `4` 条 host transport `missing_json_payload` 与 `1` 条 `empty_results`
68. `completed` 单独 triage 并修复 live `openclaw agent` answer-level red path，直到它不再系统性地 `I don't know` 或超时。
   - 根因已拆开：gateway/session-lock 噪声、agent main-session 复用污染、CLI `--local` JSON 输出写在 stderr。
   - 当前正式 gate 改走 isolated local answer path；gateway 路径继续保留在 watchlist，不再污染算法判断。
69. `completed` 按主链路性能基线优化最慢层，优先解释 host answer-level，再处理 raw transport，再决定 retrieval / assembly 是否需要继续微调。
   - 最新 main-path baseline：retrieval / assembly `16ms` 平均；raw transport `8061ms` 平均；isolated local answer-level `11200ms` 平均，`3/3` 通过。
70. `completed` 重跑 `200+` case benchmark、answer-level gate、transport watchlist 和 main-path perf baseline，并以新证据决定是否打开后续 enhancement planning。
   - 结论：继续推进 benchmark / perf / transport work，但不把 raw transport 或 gateway 噪声误报成 retrieval / answer-level 算法退化。
71. `done` 为 memory-intent replay 建立正式回归面，覆盖 durable rule、tool routing preference、session constraint、task-only instruction、user profile fact 和 no-memory 噪音。
72. `done` 在 Codex runtime 写回面补上 `reply + memory_extraction` 的最小实时 ingest 闭环，不再让普通 conversation rule 只能等 nightly self-learning。
73. `done` 把 `memory_extraction` output schema 提升成正式产品契约，而不是只停留在局部 runtime seam。
   - 新增共享 `memory_intent` contract / source type，显式定义 category、durability、confidence、admission route 和 structured rule。
74. `done` 为 `session_constraint`、`task_instruction`、`durable_rule`、`tool_routing_preference` 明确 admission routing，而不是先统一压成 `manual` source 文本。
   - durable rule / tool routing 走 promotable candidate，session / task-local 走 observation，`none` / `should_write_memory=false` 直接 skip。
75. `done` 为 realtime memory-intent ingestion 增加 richer reflection、dedupe、supersede、negative-path 和治理回归。
   - `memory_intent` 已进入 reflection + lifecycle loop，并补上 contract/source/reflection/runtime/CLI 回归面。
76. `done` 把 replay suite 接进正式 gate，避免后续 prompt / schema 漂移重新把显式规则打回 nightly 漏斗。
   - `npm run verify:memory-intent` 已成为这条 slice 的正式 gate。

## 当前执行队列

77. `completed` 把 isolated local answer-level formal gate 从 `6` 条代表性样本扩大到更大的稳定矩阵。
   - 当前 repo-default 的 isolated local formal gate 已扩大到 `12/12`，正式入口是 `npm run eval:openclaw:agent-matrix`。
   - 当前 `12` 条稳定样本覆盖 profile、project、preference、rule、temporal current、history、zh、zh-natural、negative。
78. `completed` 把中文案例从“占比过半”继续推进到更自然、更高信息密度的真实中文表达。
   - 当前已形成 `24` 条 `[zh-natural]` 案例（`12` retrieval + `12` answer-level），代表性 retrieval slice `5/5`，代表性 answer-level slice `6/6`。
79. `completed` 持续把 gateway/session-lock 与 raw `openclaw memory search` transport 保持在独立 watchlist。
   - 最新 raw transport watchlist = `3/8 raw ok`；其余为 `4` 条 `missing_json_payload` 与 `1` 条 `empty_results`；这条 watchlist 只代表 host instability，不代表 retrieval / answer-level 算法退化。
80. `completed` 按主链路性能基线继续优化最慢层，并在每轮优化后重跑正式门禁。
   - 当前优先级仍是 isolated local answer-level 慢路径，其次是 raw transport；最新 perf baseline 已刷新到 retrieval / assembly `16ms`、raw transport `8061ms`、isolated local answer-level `11200ms`。
81. `completed` 把更大的 isolated local answer-level formal gate 固化成 repo-default 入口，而不是继续依赖手工 `--only` 组合。
   - `scripts/eval-openclaw-cli-agent-answer-matrix.js` 现在默认使用 isolated eval agent `umceval65`、`--agent-local`、`--skip-legacy`，以及固定的 `12` 条 formal gate case ids。
82. `completed` 重跑更大的 answer-level formal gate，并发布新的 `2026-04-15` 正式报告。
   - 新的正式报告：[reports/generated/openclaw-cli-agent-answer-matrix-2026-04-15.md](../../../reports/generated/openclaw-cli-agent-answer-matrix-2026-04-15.md)
   - 最新结果：`12 / 12`
83. `completed` 把更大的 answer-level formal gate 结果写回 roadmap、development plan、control surface，并重置下一步执行指针。
   - 主路线图、control surface 和 development plan 现在都不再把 answer-level formal gate 写成 `6/6`。
84. `completed` 把当前 `12` 条稳定 answer-level formal gate 继续做深到 cross-source、conflict、multi-step history 和更深的自然中文覆盖。
   - 当前已建立 `18` case deeper watch matrix，并补上 cross-source、history、conflict 与更深自然中文 answer-level case。
   - 当前 watch 结果：`14 / 18`；剩余 `4` 条失败已经从大面积宿主噪声收敛到少数 harder cases，所以这组 case 目前仍停留在 watch surface，而不是直接替换 repo-default formal gate。
   - 参考报告：[reports/generated/openclaw-cli-agent-answer-watch-2026-04-15.md](../../../reports/generated/openclaw-cli-agent-answer-watch-2026-04-15.md)
85. `completed` 提高自然中文在 answer-level formal gate 本身里的占比，而不只是全局 runnable matrix 过半。
   - 当前 repo-default formal gate 已重排成 `12` 条稳定样本里的 `6 / 12` 中文样本，其中 `5 / 12` 是 `zh-natural`。
86. `completed` 在更深的 answer-level watch 建立后，重看 main-path perf baseline 和 A/B 归因，确认更大 gate 不会让宿主噪声重新污染结论。
   - perf baseline、raw transport watchlist、memory improvement A/B summary 与完整回归都已重跑；当前结论是 stable formal gate 已稳定、deeper watch 已收敛到 `14 / 18`，但仍不宜直接晋升。

87. `completed` 收掉 deeper watch 剩余的 harder failures 归因工作，并把问题拆回更明确的 host-noise / answer-level / A-B 证据面。
   - 这一轮没有把 `14 / 18` deeper watch 直接推进成更高 formal gate，而是先完成更大规模证据刷新：完整回归、CLI use-case、perf baseline、transport watchlist 与 `100` case live A/B。
   - 当前结论已经从“先修剩余 `4` 条 deeper-watch failure”升级成“先解释并关闭为什么 `100` case live A/B 里 Memory Core 还没有明显甩开内置”。
88. `completed` 在更大证据面上重看晋升边界，而不是只盯着 `18` case deeper watch。
   - 当前 stable formal gate 仍然保持 `12 / 12`；deeper watch 仍然是 `14 / 18`，暂不晋升。
   - 新增的 `100` case live A/B 结果现在是：`97` 个 shared wins、`1` 个 Memory Core only、`0` 个 builtin only、`2` 个 shared fails。
89. `completed` 重跑完整回归、CLI use-case、perf baseline 和 memory-improvement A/B，并发布新的 round report。
   - `npm test = 403 / 403`
   - `verify:memory-intent = pass`
   - retrieval-heavy CLI benchmark = `262 / 262`
   - isolated local answer-level formal gate = `12 / 12`
   - raw transport watchlist = `3 / 8 raw ok`
   - main-path perf baseline = retrieval / assembly `16ms`、raw transport `8061ms`、answer-level `11200ms`
   - memory-improvement A/B = `100` cases, `98` UMC pass, `97` builtin pass

90. `completed` 收掉 `100` case live A/B 里之前被当成 builtin-only regression 的 `ab100-zh-negative-4`。
   - 生日题不再继续被当成 plain negative；这类问题更接近 identity-conflict / birthday-guardrail。
   - 替换成真正的未知事实负例后，`ab100-zh-negative-4` 现在是 current / legacy 都稳定拒答，`100` case live A/B 已经没有 builtin-only 胜场。
   - 后续 ordinary-conversation realtime-write suite 已从 `10` 条扩到 `40` 条，并按“先 builtin、清空、再 current”的顺序重跑；当前结果是 current `38 / 40`、legacy `21 / 40`、`UMC-only = 18`、`legacy-only = 1`、`both-fail = 1`。
91. `completed` 收掉 `100` case live A/B 里两条 shared-fail 的中文 history case：`ab100-zh-history-editor-2`、`ab100-zh-history-editor-4`。
   - 修复点不是“再喂更多数据”，而是 history / current-state intent 边界：中文 `history` 问法不再误触发 current-state assembly 和 query rewrite。
   - focused hermetic cleanup rerun 结果：[openclaw-memory-improvement-history-cleanup-2026-04-17.md](../../../reports/generated/openclaw-memory-improvement-history-cleanup-2026-04-17.md)
   - 当前 focused rerun 结果：`ab100-zh-history-editor-2 = unified-gain`，`ab100-zh-history-editor-4 = shared-capability`
   - 稳定高层状态可以读作：`100` case live A/B 当前 current `100 / 100`、legacy `99 / 100`、`UMC-only = 1`、`builtin-only = 0`、`both-fail = 0`
92. `next` 在 shared-fail history cases 收口后，先完成 docs-first review，把 roadmap、development plan、架构文档和 `.codex/*` 统一到“逐轮 context 优化”的下一轮恢复点；然后再设计更偏 `cross-source`、`conflict`、`multi-step history` 与高信息密度自然中文的 live A/B。
   - 这组队列恢复时应把 Stage 6 shadow telemetry 一起挂上。
   - 下一轮设计约束：
     - 优先定义 bounded、structured 的 LLM-led context decision contract，而不是继续扩硬编码规则
     - 必须显式写清 operator metrics、rollback boundary 和 Docker / hermetic eval 入口
     - active prompt mutation 继续不进默认路径

## 延后增强队列

下面这些事项现在明确标成 `todo`，但它们不属于当前 active stage。

保留这组队列的目的，是让后续 enhancement phase 可以从清晰队列恢复，而不是重新从 session history 里猜设计意图。

47. `done` 把 `accepted_action` extraction 拆成可复用 target facts、operating rules 和一次性 outcome artifacts。
   - `accepted_action` source normalization 现在会产出 targets、artifact paths、output references 的字段级 descriptors。
   - reflection 现在会把成功的 accepted-action event 拆成 field-aware 的 `target_fact`、`operating_rule`、`outcome_artifact` candidates，而不是继续压成一条 summary。
   - CLI 和 lifecycle 验证已经证明：可复用 target 可以独立 promote，而一次性 outcome 仍停留在 observation。
   - runtime/task hook 覆盖面现在已经包括 Codex `writeAfterTask(...)`，以及在结构化 accepted-action payload 存在时的 OpenClaw 异步 `after_tool_call`。
48. `todo` 为 accepted-action 增加跨 `session`、`daily`、`observation`、stable-candidate 层的 admission routing。
49. `todo` 为 accepted-action 增加更丰富的 evidence weighting，把 acceptance、execution success、后续复用、冲突、再次引用这些信号合并打分。
50. `todo` 为 accepted-action 增加 negative / partial handling，让 rejected / failed actions 进入 audit 或 observation，而不是按 stable fact 处理。
51. `todo` 为 accepted-action 增加 dedupe、supersede、conflict rules，以及对应的 replay / audit coverage。
52. `todo` 只有当 post-Stage-5 operator baseline 持续为绿，足以支撑新的 enhancement slice 时，才重新打开这组实现。

## Review Checklist

用下面几个问题 review 这份计划：

1. 当前指针是否足够明显？
2. 是否每个阶段都必须先收口，后面阶段才能开始？
3. 是否还有哪个步骤太大，应该继续拆小？
4. 是否有步骤排得太早？
5. 维护者是否只看 step number 就能恢复工作？
