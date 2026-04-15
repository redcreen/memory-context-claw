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
- 当前指针：`Stage 5 closeout`
- 当前建议：先把 release-preflight、deployment verification 和 Stage 5 证据面持续保持稳定，再讨论任何更后面的阶段

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

## 阶段总览

| 阶段 | 步骤范围 | 目标 | 状态 |
| --- | --- | --- | --- |
| Stage 1 | `1-10` | 冻结产品形态与文档基线 | `completed` |
| Stage 2 | `11-20` | 完成第一条 local-first 实现基线 | `completed` |
| Stage 3 | `21-30` | 完成 self-learning 生命周期基线 | `completed` |
| Stage 4 | `31-38` | 把受治理学习结果接到 adapter 策略使用 | `completed` |
| Stage 5 | `39-46` | 补齐产品运维与 split-ready 执行 | `completed` |

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

## 当前下一步

从这里恢复：

1. 继续保持 release-preflight、deployment verification 和 `Stage 5` 证据面稳定
2. 在文档前置条件长期为绿之前，不要打开 runtime API 或 service-mode 工作
3. 把 registry-root cutover 继续当作显式 operator policy 工作，不要让它变成隐藏的阶段漂移

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
- isolated local answer-level formal gate：`12 / 12`
- 自然中文代表性 retrieval slice：`5 / 5`
- 自然中文代表性 answer-level slice：`6 / 6`
- raw transport watchlist：`0 / 8 raw ok`，全部归类为 host `missing_json_payload`
- 最新 perf baseline：retrieval / assembly `43ms`；raw transport `15570ms`；isolated local answer-level `36155ms`
- 当前解释：`200+` case 扩面、自然中文补强、watchlist failure-class 化、perf baseline 刷新，以及 answer-level formal gate 从 `6/6` 扩到 `12/12` 都已收口；后续主线是继续把这个更大的 gate 做深

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
   - answer-level formal gate：`6/6`（`openclaw agent --local` + isolated eval agent `umceval65`）
   - transport watchlist：`0/8 raw ok`，全部归类为 host transport invalid-json
68. `completed` 单独 triage 并修复 live `openclaw agent` answer-level red path，直到它不再系统性地 `I don't know` 或超时。
   - 根因已拆开：gateway/session-lock 噪声、agent main-session 复用污染、CLI `--local` JSON 输出写在 stderr。
   - 当前正式 gate 改走 isolated local answer path；gateway 路径继续保留在 watchlist，不再污染算法判断。
69. `completed` 按主链路性能基线优化最慢层，优先解释 host answer-level，再处理 raw transport，再决定 retrieval / assembly 是否需要继续微调。
   - 最新 main-path baseline：retrieval / assembly `43ms` 平均；raw transport `15570ms` 平均；isolated local answer-level `36155ms` 平均，`3/3` 通过。
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
   - 最新 raw transport watchlist = `0/8 raw ok`，全部 failure-class 为 `missing_json_payload`；这条 watchlist 只代表 host instability，不代表 retrieval / answer-level 算法退化。
80. `completed` 按主链路性能基线继续优化最慢层，并在每轮优化后重跑正式门禁。
   - 当前优先级仍是 isolated local answer-level 慢路径，其次是 raw transport；最新 perf baseline 已刷新到 retrieval / assembly `43ms`、raw transport `15570ms`、isolated local answer-level `36155ms`。
81. `completed` 把更大的 isolated local answer-level formal gate 固化成 repo-default 入口，而不是继续依赖手工 `--only` 组合。
   - `scripts/eval-openclaw-cli-agent-answer-matrix.js` 现在默认使用 isolated eval agent `umceval65`、`--agent-local`、`--skip-legacy`，以及固定的 `12` 条 formal gate case ids。
82. `completed` 重跑更大的 answer-level formal gate，并发布新的 `2026-04-15` 正式报告。
   - 新的正式报告：[reports/generated/openclaw-cli-agent-answer-matrix-2026-04-15.md](../../../reports/generated/openclaw-cli-agent-answer-matrix-2026-04-15.md)
   - 最新结果：`12 / 12`
83. `completed` 把更大的 answer-level formal gate 结果写回 roadmap、development plan、control surface，并重置下一步执行指针。
   - 主路线图、control surface 和 development plan 现在都不再把 answer-level formal gate 写成 `6/6`。
84. `next` 把当前 `12` 条稳定 answer-level formal gate 继续做深到 cross-source、conflict、multi-step history 和更深的自然中文覆盖。
   - 重点不是再机械加题，而是把目前仍主要靠 retrieval-heavy 和代表性 answer 样本支撑的 blind spots 收进正式门禁。
85. `todo` 提高自然中文在 answer-level formal gate 本身里的占比，而不只是全局 runnable matrix 过半。
   - 下一轮 answer-level 扩容至少要显式包含更多 zh-natural current/history/conflict 场景。
86. `todo` 在更深的 answer-level formal gate 完成后，重跑 main-path perf baseline 和 A/B 归因报告，确认更大 gate 不会让宿主噪声重新污染结论。

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
