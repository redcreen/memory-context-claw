# 当前执行 TODO

这份 TODO 不再只是“排查记录”，而是后续执行顺序。

执行原则：

1. 先看 **Current Phase**
2. 只优先做 `Now`
3. `Next` 作为下一批
4. `Later` 不插队，除非当前阶段被阻塞

---

## Final Goal

把 `memory-context-claw` 做成一层：

- 持续抓记忆
- 提炼 fact/card
- 优先消费稳定事实
- 分离 confirmed / pending / noise
- 持续回归验证
- 定期治理数据

---

## Phase Map

### Phase 1. Capture Foundation

状态：`done / maintain`

已完成：

- session-memory 消费
- pre-compaction distillation
- 候选记忆提炼
- 原始 session log 保留

### Phase 2. Fact/Card Layer

状态：`done / maintain`

已完成：

- session-memory -> fact/card
- `conversation-memory-cards.md/json`
- stable cards from `MEMORY.md`
- stable cards from `memory/YYYY-MM-DD.md`
- project positioning cards

### Phase 3. Consumption Layer

状态：`done / tune`

已完成：

- cardArtifact fast path
- fact-first retrieval
- rerank / assembly
- perf-critical queries 毫秒级

### Phase 4. Regression Layer

状态：`active`

已完成：

- smoke suite
- perf suite
- stable-facts live regression

仍在继续：

- 扩更多稳定事实进主回归
- 保留 guardrail 治理池
- 把 watchlist 和 hard smoke 明确分开

### Phase 5. Governance Layer

状态：`governance running / memory search primary focus`

治理已经进入常规运行，当前主工程焦点切到 `memory search`。

---

## Current Phase

**Memory Search Workstream**

当前目标：

- 不再把 `memory_search` 问题混成一个大黑盒
- 而是拆成几个可验证的根源子问题：
  - 宿主 builtin `memory_search` 对中文短词 / 短偏好句的召回缺口
  - `session-memory` 文件形态为什么不适合检索
  - `memory/%` 与 `sessions/%` 候选竞争时，为什么新事实容易被旧 session 压住
  - 在不魔改宿主前提下，插件层还能做哪些稳定补强

治理层说明：

- Phase 5 / Governance Layer 已经进入常规运行
- 不再作为当前主阻塞项
- 继续通过 `governance-cycle` 保持健康度

当前阶段状态：

- `Phase A / Root-Cause Baseline`: `done`
- `Phase B / Targeted Evaluation Tooling`: `done`
- `Phase C / Session-Memory Shape Strategy`: `done`
- `Phase D / Retrieval Policy Hardening`: `done`
- `Phase E / Memory Search Governance`: `done`

当前状态：

- Memory Search Workstream 已完成 A-E 全阶段收口
- 后续进入常规治理与增量维护模式
- 后续执行蓝图：
  - `memory-search-next-blueprint.md`

---

## Now

### 0. Memory Search v1 watchlist 已清空，进入下一轮增量优化

当前状态：

- `memory-search governance` 已达到：
  - `pluginSignalHits = 6/6`
  - `pluginSourceHits = 6/6`
  - `pluginFailures = 0`
  - `watchlist = []`
- `pluginSingleCard = 6/6`
- `pluginMultiCard = 0/6`
- `pluginNoisySupporting = 0/6`
- `pluginUnexpectedSupportingTotal = 0`
- `full smoke = 25/25`

当前判断：

- 第一轮 watchlist 收口已完成
- 后续不再围绕旧的 3 条 case 反复打转
- 下一步应转到：
  - 新稳定事实 / 规则继续扩面
  - 迁移后的旧路径 / 旧 case 清理
  - 治理基线继续保持全绿
  - `workspace/notes/*.md` 这类项目背景笔记继续按“高信号才出 stable card”原则扩面，而不是平铺所有笔记
  - 把 `workspace/notes` 的“高信号”定义继续保持为显式规则，而不是靠文件名猜测
  - `provider-role` 这类配置/概念 query 虽然 top1 已稳定，但 supporting candidates 里仍可能混入长 session 片段，后续继续做噪音压制

补充状态：

- 安装体验相关规则已继续扩面：
  - `release-install-rule`
  - `install-verify-rule`
- stable 规则扩面已继续收口：
  - `workspace-notes-rule`
  - `pending-rule-smoke`
- full smoke 已到 `25/25`
- `lossless-understanding` 已稳定命中：
  - `workspace/notes/openclaw-memory-vs-lossless.md`
- `provider-role` 已进一步收口：
  - top1 稳定是 `configuration.md`
  - assemble selected 已不再带长 session transcript
  - 最终 selected 现在只保留配置说明本身
- 稳定 user-fact / stable-rule 槽位的 selected 已进一步收口：
  - `我爱吃什么`
  - `你怎么称呼我`
  - `我的时区是什么`
  - `OpenViking 是做什么的`
  - 最终 selected 现在已不再夹带无关 `configuration.md` / `formal-memory-policy.md`
- `workspace-layering` 已进一步收口：
  - `长期记忆目录规则是什么` 现在会优先回到 `README.md` 的 workspace 结构卡
  - 最终 selected 现在只保留目录结构卡
- `project-positioning-smoke` 已进一步收口：
  - 最终 selected 现在只保留 `README.md` 项目定位卡
- mixed-mode 家庭 / 生日问题已进一步收口：
  - `我生日是什么时候`
  - `我女儿叫什么，生日是哪天，现在几年级`
  - `我的孩子情况是什么`
  - 最终 selected 已不再混入“身份证登记年份说明”卡
- `memory-search governance` 现在已能看“上下文纯度”，不只看 pass/fail：
  - `pluginSingleCard`
  - `pluginMultiCard`
  - `pluginNoisySupporting`
  - `pluginUnexpectedSupportingTotal`
- `short-chinese-token` 已进一步收口：
  - `牛排 刘超` 现在最终 selected 只剩 `MEMORY.md`
  - 这使得当前专项治理 summary 已到：
    - `pluginSingleCard = 6/6`
    - `pluginMultiCard = 0/6`
- `case 升级规则` 已落地第一版工具：
  - `npm run eval:smoke-promotion`
  - 当前会给出“已在 smoke / 可考虑升格 / 继续留在专项治理池”三类建议
- `workspace/notes` stable-card 准入规则已显式化：
  - `一句话结论 + 适用场景` 是基础结构门槛
  - `openclaw-memory-vs-lossless.md` 这类稳定概念 note 允许进入 stable card
  - `context-assembly-claw-roadmap.md` 这类历史 roadmap note 不进入 stable card
  - `memory-context-claw-config.md` 这类已被 canonical config 文档覆盖的 note 不进入 stable card
- `workspace-notes-rule` 已正式进入 smoke：
  - `workspace/notes 里的笔记什么时候能进入 stable card`
  - top1 稳定是 `README.md`
- `pending-rule-smoke` 已正式进入 smoke：
  - `待确认信息应该放哪里`
  - top1 稳定是 `formal-memory-policy.md`
- 当前剩余更值得继续优化的 supporting-candidate 清洁化，主要集中在：
  - `project / workspace / rule` 类问题
  - 而不再是 `user-facts / stable facts` 类问题

### 0.1 清理迁移后残留的旧路径与旧 case

目标：

- 把仓库从 `/Users/redcreen/Project/长记忆/...` 迁到 `/Users/redcreen/Project/context-assembly-claw` 之后留下的旧路径残留继续收干净

重点：

- smoke / golden / test fixture 里的旧路径
- reports 里仍然指向旧工作区结构的描述
- 让 `workspace/` 成为唯一默认心智模型

产出：

- 一轮路径清理 commit
- smoke / golden / testsuite 与当前结构重新对齐

当前状态：

- active 维护面已完成
- tests / evals / scripts 已不再残留旧的 `长记忆/` 路径
- 后续只需要在新增 case / 新脚本时继续保持新结构，不再专门为这件事开一轮工程

### 1. 拆清宿主 builtin `memory_search` 的真实缺口

目标：

- 把“memory search 不稳定”拆成明确、可验证的子问题

当前已知：

- builtin `memory_search` 没有被改好
- 中文短词 / 短偏好句仍然可能召回失败
- `memory/%` 新事实可能被旧 `sessions/%` 压住
- 宿主参数微调不是万能解

产出：

- 一份更系统的 memory-search root-cause 文档
- 一组能复现实例的最小 query / case

当前状态：

- 已完成
- 对应产出：
  - `memory-search-architecture.md`
  - `memory-search-baseline-report.md`

### 2. 梳理 `session-memory` 文件形态与检索适配

目标：

- 查清为什么同样已经写入并索引的 `memory/*.md`，宿主检索仍然不容易命中

重点：

- 文件内容形态
- chunking 形态
- FTS 对中文短词的帮助为什么弱
- 时间衰减为什么对某些命名模式不起作用

产出：

- 一份“当前文件形态问题”说明
- 一份“双格式 / card-friendly 输入形态”方向说明

当前状态：

- 已完成
- 对应产出：
  - `session-memory-shape-strategy.md`

### 3. 设计插件层 retrieval policy 的 memory-search 补强路线

目标：

- 在不魔改宿主前提下，系统补强 builtin `memory_search` 的缺口

重点：

- 什么时候走 fact-first fast path
- 什么时候仍然依赖 builtin `memory_search`
- 哪些查询类型要优先吃 stable card / formal memory
- 哪些查询类型仍要保持 search-first

产出：

- 一份 retrieval policy 设计说明
- 一组对应 smoke / perf / targeted cases

补充结构约束：

- 先独立工作流、案例集、脚本入口
- 暂不进行大规模源码搬迁
- 等 memory-search 边界进一步稳定后，再考虑物理拆出 `src/memory-search/`

当前状态：

- 已完成
- 对应产出：
  - `retrieval-policy.md`
  - `src/retrieval-policy.js`
  - `test/retrieval-policy.test.js`

补充状态：

- 第一轮 watchlist 已清空
- 当前进入常规治理 + 增量 case 阶段

### 4. 继续升格稳定事实进主回归

目标：

- 新稳定事实不要只停在 daily / candidate
- 要持续进入：
  - `smoke-cases.json`
  - `agent-regression-cases.json`
  - `fact-growth-cases.json`

当前状态：

- `critical smoke` 已经 `10/10` 全绿
- `full smoke` 已经 `19/19` 全绿
- `timezone-smoke`、`communication-style-smoke`、`reminder-channel-smoke`、`execution-rule-smoke`、`openviking-role`、`agent-routing-rule`、`main-boundary-rule`、`main-negative-boundary-rule`、`status-word-rule`、`plugin-config`、`project-positioning-smoke`、`provider-role` 已修复

当前判断：

- Phase 4 的硬回归面已经收口
- 这条要继续做，但它现在是持续推进项，不再是唯一主焦点
  - `agent-regression-cases.json`
  - 必要时进入 smoke / perf

### 5. 保持治理周期常规运行

目标：

- 不让治理掉线，但不再抢占主工程焦点

当前状态：

- 已有：
  - `memory:audit-formal`
  - `memory:govern-safe`
  - `memory:governance-cycle`
  - `memory:audit-conflicts`
  - `memory:audit-duplicates`

当前判断：

- Governance 已经从主阻塞项降级成常规维护动作
- 后面继续按周期跑，不再和 memory-search 主线混在一起

### 6. 已完成的治理主项

以下事项已完成，保留在这里是为了防止后面重复开工：

#### 6.1 写清正式记忆准入标准

目标：

- 明确什么能进 `MEMORY.md`
- 什么能进 `memory/YYYY-MM-DD.md`
- 什么只能进 pending
- 什么属于噪音应归档

产出：

- 一份明确的准入标准文档

状态：

- 已完成

#### 6.2 第二波宿主正式目录治理

目标：

- 清掉仍留在正式目录中的高置信运行产物

重点对象：

- 明显属于一次性调查/状态快照的 `memory/*.md`

要求：

- 保守治理
- 只动高置信噪音
- 每轮治理后跑最小 live regression

当前状态：

- `cron_sync.log`
- `sync.log`
- `sync_agents.log`
- `sync_all.log`
- `test_agent.hmd`

已完成归档。

下一步：
- 第二波高置信运行产物：已完成
- 第三波调查型 memory 文档：已完成

下一步：

- `Now/2` 基本收口
- 后续只保留小步巡检，不再作为当前主阻塞项

状态：

- 已完成

#### 6.3 固化 confirmed / pending 分层

目标：

- 确保以后待确认内容不会再默认进入正式层

当前已有：

- `memory:apply-daily`
- `memory:export-pending`

接下来要做：

- 检查还有没有别的路径会把待确认内容写进正式层
- 盘点宿主正式目录里“已确认事实 / 待确认候选 / 过程文档”的剩余混合面
- 让 pending 导出和正式准入形成固定工作流

当前新增工具：

- `npm run memory:audit-formal -- --write`
- `npm run memory:govern-safe -- --write --label YYYY-MM-DD-governance-waveN`

当前基线：

- 正式层巡检：`total=10 / clean=8 / pendingRisk=0 / archiveReview=2`

最新基线：

- 正式层巡检：`total=9 / clean=9 / pendingRisk=0 / archiveReview=0`

当前判断：

- confirmed / pending 的显式边界已经收紧到可用
- 下一步重心是处理 `archiveReview` 剩余 2 项，以及识别哪些内容是宿主会重复生成的

当前剩余特殊项：

- 当前无 `archiveReview` 剩余项
- `2026-04-05-food-preference.md` 已验证：
  - 先被 `cardArtifact` 接住
  - 再从宿主正式层退出
  - 退出后关键 live regression 仍保持通过

当前判断：

- `Now/3` 的“正式层混合面治理”已经收口到可用状态
- 下一步重心应转向：
  - 把这套治理做成周期性常规任务
  - 持续把稳定事实升格进主回归

新增工具：

- `npm run memory:governance-cycle -- --write`
  - 固定串起：
    - formal audit
    - session-memory exit audit
    - safe governance 候选统计
    - 可选 critical live regression

新增观察：

- `MEMORY.md 应该放什么内容` 这类问题，之前 top1 会被 session-derived card 压过正式规则来源
- 已修复：`formal-memory-policy.md` 现在会生成稳定规则 card，并在规则意图下优先于 session-derived rule card
- 当前后续重点不再是这个排序问题，而是继续处理 `archiveReview` 剩余特殊项

状态：

- 已完成并进入维护

---

## Next

### 7. 冲突事实治理

目标：

- 新旧事实冲突时，不只是回答层降权
- 还要在数据层明确标记冲突

### 8. live regression 会话隔离

目标：

- 查清 `openclaw agent --agent main --session-id ...` 为什么没有真正隔离 `main` 会话
- 避免 `eval:hot*` / `eval:agent:*` 被热会话上下文污染，产生假失败

当前现象：

- `smoke:eval` 已经 `10/10`
- 但 `eval:hot:critical` / `eval:agent:critical` 里的 `food-preference-latest` 仍会失败
- 原始返回显示：
  - `systemPromptReport.sessionKey = agent:main:main`
  - `agentMeta.sessionId` 仍然落在已有主会话

当前判断：

- 这是回归工具链问题，不是单纯 retrieval/scoring 逻辑问题
- 在找到真正隔离的 live 执行路径前，`eval:hot*` / `eval:agent:*` 不能被当作完全干净的基线
- 已确认：
  - `openclaw agent --agent main --session-id ...`
  - `openclaw agent --to ... --session-id ...`
  都仍然落回 `agent:main:main`
  - `openclaw agent --local --agent main --session-id ...`
    直接命中了主会话锁：
    - `/Users/redcreen/.openclaw/agents/main/sessions/103587ff-4d67-4598-8de7-ba361cf96fca.jsonl.lock`
  - `openclaw agent --local --to ...`
    当前也没有产出可用的隔离 JSON 结果，暂时不能视为可信 clean live 入口
  - 最新 `eval:hot:critical` 已显式输出：
    - `isolated = 0`
    - `hotMainAlias = 2`
    - `matchedRequestedSessionId = 0`
    - 两个 case 的 `observedSessionId` 都落在同一个热会话上

下一步：

- 找一个真正隔离的 live 验证入口
- 如果宿主当前没有这类入口，就把 `eval:agent:*` 明确改名或标注成 `hot-session regression`
- 已新增：
  - `eval:hot*` 结果会显式输出：
    - `requestedSessionId`
    - `observedSessionKey`
    - `observedSessionId`
    - `hotSession.hotMainAlias`
    - `hotSession.matchedRequestedSessionId`
    - `hotSession.isolated`
- 当前用途：
  - 先用这些字段快速判断失败是“事实真的退化”还是“会话没有隔离”
  - 当前已经足够支持把 `eval:hot*` 当作热会话健康检查，而不是 clean baseline
- 当前倾向结论：
  - 宿主在这台机器上暂时没有可确认的 `main` clean live 入口
  - 这条应视为已确认工具链限制，后面除非宿主行为变化，不再持续消耗大量排查时间

当前典型：

- 新偏好 vs 旧偏好
- 已确认身份说明 vs 历史错误候选

当前状态：

- 已有 `memory:audit-conflicts`
- 最新基线：`slotsScanned=5 / conflicts=0`

下一步：

- 保持冲突审计常规化
- 当新事实升格时，优先看是否产生新槽位冲突

### 6. 重复事实治理

目标：

- 避免同一事实以多个版本长期漂在正式层

当前状态：

- 已有 `memory:audit-duplicates`
- 最新基线：
  - `cardsScanned=14`
  - `duplicateFacts=2`
  - `duplicateSlotValues=2`
  - `acceptableLayered=3`
  - `review=1`

当前已发现的重复：

- `MEMORY.md 应该放的是长期稳定、会被反复复用的内容。`
  - session-derived rule card
  - `formal-memory-policy.md`
- `你的实际出生年份是1983；身份证登记生日年份是1982，这是历史登记错误，但证件信息客观如此。`
  - `MEMORY.md`
  - `memory/2026-04-05.md`

当前判断：

- `身份出生年份` 这组重复属于合理分层冗余
  - 长期层保留稳定事实
  - daily 层保留近期确认痕迹
- 当前真正需要继续治理的重复，主要只剩：
  - session-derived 规则解释
  - `formal-memory-policy.md` 正式规则
- 但消费层已经优先保留正式规则来源
  - `critical smoke` 中这条 session-derived duplicate 已不再进入规则问题的选中结果
- 另外，`你爱吃牛排` 现在已经正式写回 `MEMORY.md` 并被稳定解析
  - 不再依赖临时 card 工件存活

下一步：

- 决定哪些重复属于“应该保留的多层事实”
- 哪些重复应该合并或降级
- 把 duplicate audit 纳入周期性治理判断
- 后续再决定是否让 `conversation-memory-cards.json` 也主动退出这条 session-derived rule duplicate

### 9. Guardrail 根源治理

目标：

- 解决宿主 startup memory 原文泄漏

当前结论：

- 这不是普通排序问题
- 插件层已能识别 guardrail
- 但宿主正式层里已有原文仍可能压过插件指令

原则：

- 先治理正式层数据
- 不继续靠回答层补丁硬压

---

## Later

### 10. `memory_search / FTS` 根源优化路径评估

目标：

- 继续理解宿主 builtin `memory_search` 对中文短词的限制

原则：

- 不魔改宿主
- 只做可包裹、可替换输入形态、可后处理的方案

### 11. 双格式 session-memory 继续增强

目标：

- 原始 session-memory 保留
- retrieval-friendly card 继续精炼

### 12. 把数据治理纳入常规任务

目标：

- 把治理变成固定动作，而不是临时清理

后续方向：

- 周期性巡检正式层
- 周期性巡检 pending 层
- 周期性检查哪些事实应升格进回归面

---

## Standing Constraints

这些约束始终有效：

- 不魔改 OpenClaw 宿主
- 不魔改别的插件
- 只做插件层 / 接口层改进
- 性能必须长期受控
- 数据治理是常规任务，不是一次性工作

---

## Workspace consolidation

现状：

- 高相关工作区文件已经从仓库外层并入项目内 `workspace/`

后续动作：

- 把主文档里的默认路径统一收敛到 `workspace/`
- 评估 `workspace/notes/context-assembly-claw-roadmap.md` 是否应继续保留，还是归档为历史稿
- 保持外层 `.obsidian` 暂不并入，除非后续明确要把个人知识库配置和项目绑定

---

## Current focus

目前重点已经从“补更多 phase”切到：

- 继续收干净 `project / workspace / rule` 类问题的最终 recalled context
- 保持 `projectNavigation / projectPositioning / lossless / workspaceStructure / workspaceNotesRule` 这些相近意图彼此解耦
- watchlist 继续保持空，不再让新的项目文档导航题掉回 session 噪音
- 继续把 mixed-mode `birthday / daughter / son / children` 这类问题的最终 supporting context 保持在同槽位卡，不再回退到身份证年份说明
