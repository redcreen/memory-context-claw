# Test Suite

[English](#english) | [中文](#中文)

## English

### Overview

This repo currently uses five testing layers:

1. unit / integration tests
2. smoke assembly checks
3. retrieval golden-path evaluation
4. live `main` hot-session regression
5. formal memory audit and governance checks

Each layer answers a different question:

- are the functions correct?
- does retrieval + rerank + assembly still behave sanely?
- are expected documents still being selected?
- does the real OpenClaw hot session still answer key questions correctly?
- is the host formal memory layer still clean enough to trust?
- are conflict / duplicate / exit-governance signals still within expected bounds?

### If You Only Want The Important Commands

Use this as the shortest practical path:

```bash
npm test
npm run smoke:eval
npm run eval:memory-search:cases
npm run memory:governance-cycle -- --write
```

Meaning:

- `npm test`: core function and logic safety
- `npm run smoke:eval`: user-facing regression baseline
- `npm run eval:memory-search:cases`: memory-search workstream baseline
- `npm run memory:governance-cycle -- --write`: formal memory + governance health

### Where The Tests Live

Core scripts:

- [scripts/smoke-assemble.js](scripts/smoke-assemble.js)
- [scripts/eval-smoke-cases.js](scripts/eval-smoke-cases.js)
- [scripts/eval-cases.js](scripts/eval-cases.js)
- [scripts/agent-regression.js](scripts/agent-regression.js)
- [scripts/audit-formal-memory.js](scripts/audit-formal-memory.js)
- [scripts/audit-session-memory-exit.js](scripts/audit-session-memory-exit.js)
- [scripts/audit-fact-conflicts.js](scripts/audit-fact-conflicts.js)
- [scripts/audit-fact-duplicates.js](scripts/audit-fact-duplicates.js)
- [scripts/run-governance-cycle.js](scripts/run-governance-cycle.js)
- [scripts/verify-suite.js](scripts/verify-suite.js)

Key policy / architecture docs:

- [system-architecture.md](system-architecture.md)
- [reports/memory-search-architecture.md](reports/memory-search-architecture.md)
- [reports/session-memory-shape-strategy.md](reports/session-memory-shape-strategy.md)
- [reports/retrieval-policy.md](reports/retrieval-policy.md)

Case files:

- [evals/smoke-cases.json](evals/smoke-cases.json)
- [evals/golden-cases.json](evals/golden-cases.json)
- [evals/agent-regression-cases.json](evals/agent-regression-cases.json)
- [evals/fact-growth-cases.json](evals/fact-growth-cases.json)
- [evals/perf-cases.json](evals/perf-cases.json)

### Commands

Run unit / integration tests:

```bash
npm test
```

Run one ad hoc smoke query:

```bash
npm run smoke -- "我爱吃什么"
```

Compare presets on one query:

```bash
npm run smoke:compare -- "Lossless 插件 和 长期记忆 的区别"
```

Run lightweight smoke suite:

```bash
npm run smoke:eval:critical
```

Run full smoke baseline:

```bash
npm run smoke:eval
```

Run golden retrieval evaluation:

```bash
npm run eval
```

Run performance evaluation:

```bash
npm run eval:perf
```

Run memory-search targeted evaluation:

```bash
npm run eval:memory-search:cases
```

Run memory-search governance baseline:

```bash
npm run eval:memory-search:governance -- --write
```

Run memory-search to smoke promotion suggestions:

```bash
npm run eval:smoke-promotion
```

Run formal memory audit:

```bash
npm run memory:audit-formal -- --write
```

Run safe formal memory governance:

```bash
npm run memory:govern-safe -- --write --label YYYY-MM-DD-governance-waveN
```

Run session-memory exit audit:

```bash
npm run memory:audit-session-exit -- --write
```

Run fact conflict audit:

```bash
npm run memory:audit-conflicts -- --write
```

Run fact duplicate audit:

```bash
npm run memory:audit-duplicates -- --write
```

Run one governance cycle:

```bash
npm run memory:governance-cycle -- --write
```

The governance cycle now also includes a memory-search summary:

- `cases`
- `builtinSignalHits`
- `builtinSourceHits`
- `pluginSignalHits`
- `pluginSourceHits`
- `pluginFastPathLikely`
- `pluginSingleCard`
- `pluginMultiCard`
- `pluginNoisySupporting`
- `pluginUnexpectedSupportingTotal`
- `pluginFailures`

Run lightweight live hot-session regression:

```bash
npm run eval:hot:critical
```

Result fields now include hot-session metadata:

- `requestedSessionId`
- `observedSessionKey`
- `observedSessionId`
- `hotSession.hotMainAlias`
- `hotSession.matchedRequestedSessionId`
- `hotSession.isolated`

Run dialogue-derived fact regression:

```bash
npm run eval:hot:facts
```

Run full live hot-session regression:

```bash
npm run eval:hot
```

Run everything commonly used by maintainers:

```bash
npm run verify
```

### Smoke Cases

Current smoke cases are grouped into categories.

#### `user-facts`

- `food-preference`
  Query: `我爱吃什么`
  Expectation: selected context includes `牛排`, top source should be `cardArtifact`

- `identity-name`
  Query: `你怎么称呼我`
  Expectation: selected context includes `超哥` or `刘超`, top source should be `cardArtifact`

- `birthday-solar-smoke`
  Query: `我生日是什么时候`
  Expectation: selected context includes `1983-02-06` or `1983年2月6日`, top source should be `cardArtifact`

- `daughter-profile-smoke`
  Query: `我女儿叫什么，生日是哪天，现在几年级`
  Expectation: selected context includes `刘子妍`, `2014-12-29`, `五年级`, top source should be `cardArtifact`

- `timezone-smoke`
  Query: `我的时区是什么`
  Expectation: selected context includes `GMT+8` or `北京时间`, top source should be `cardArtifact`

- `communication-style-smoke`
  Query: `你应该怎么跟我沟通`
  Expectation: selected context includes `直接`, `实用`, `不废话`, top source should be `cardArtifact`

#### `rules`

- `reminder-channel-smoke`
  Query: `我说提醒时默认用什么`
  Expectation: selected context includes `飞书任务`, `苹果日历`, top source should be `cardArtifact`

- `execution-rule-smoke`
  Query: `收到明确任务后，低风险可逆操作应该怎么做`
  Expectation: selected context includes `低风险`, `可直接执行`, `先确认`, top source should be `cardArtifact`

- `memory-md-scope`
  Query: `MEMORY.md 应该放什么内容`
  Expectation: selected context includes `长期稳定` / `反复复用`, top source should be `cardArtifact`

- `workspace-layering`
  Query: `长期记忆目录规则是什么`
  Expectation: selected paths include `workspace/memory/2026-04-04.md` or `workspace/MEMORY.md`

#### `concepts`

- `lossless-understanding`
  Query: `为什么已经有长期记忆了，还需要 Lossless`
  Expectation: selected context includes `Lossless`, `长期记忆`, `context`

#### `project`

- `plugin-config`
  Query: `memory-context-claw 这个插件的配置应该怎么写`
  Expectation: selected context includes `memory-context-claw`, `contextEngine`, `enabled: true`

- `project-positioning-smoke`
  Query: `这个项目主要解决什么问题`
  Expectation: selected context includes `context engine`, `长期记忆更稳定地变成当前轮可用的上下文`, top source should be `cardArtifact`

#### `concepts`

- `provider-role`
  Query: `memorySearch.provider 是做什么的`
  Expectation: selected context includes `embedding`, `memory_search`, and should come from a `cardArtifact`

- `openviking-role`
  Query: `OpenViking 是做什么的`
  Expectation: selected context includes `长期记忆检索补充工具`, `个人信息`, `历史片段`, top source should be `cardArtifact`

- `agent-routing-rule`
  Query: `编程工作应该交给哪个 Agent`
  Expectation: selected context includes `编程工作`, `code Agent`, top source should be `cardArtifact`

- `main-boundary-rule`
  Query: `main 负责什么`
  Expectation: selected context includes `总协调`, `任务判断`, `任务分派`, `结果汇总`, top source should be `cardArtifact`

- `main-negative-boundary-rule`
  Query: `main 不负责什么`
  Expectation: selected context includes `不负责长期承接`, `专业 Agent`, `具体执行`, top source should be `cardArtifact`

- `status-word-rule`
  Query: `已开始是什么意思`
  Expectation: selected context includes `已开始`, `实际工具调用`, `后台任务`, `明确执行动作`, top source should be `cardArtifact`

### Golden Retrieval Cases

Current golden retrieval cases:

- `lossless-vs-memory`
- `workspace-layering`
- `memory-usage`

These verify that expected documents remain in the selected retrieval set.

### Live Hot-Session Regression Cases

Current live `main` hot-session regression cases:

- `lossless-understanding`
- `memory-md-scope`
- `directory-layering`
- `plugin-positioning`
- `provider-role`
- `plugin-config`
- `alt-phrasing-context-plugin`
- `plugin-minimal-config`
- `food-preference-latest`
- `identity-preferred-name`

### Dialogue-Derived Fact Cases

Newly extracted from recent `main` dialogue and staged for gradual adoption:

- `birthday-solar`
- `birthday-lunar`
- `daughter-profile`
- `son-profile`
- `children-overview`
- `ambiguous-id-date-guardrail`

These currently live in:

- [evals/fact-growth-cases.json](evals/fact-growth-cases.json)

Breakdown notes:

- [reports/new-dialogue-test-cases.md](reports/new-dialogue-test-cases.md)

### Performance Cases

Current perf cases track latency budgets for representative flows:

- `food-preference-latency`
- `identity-name-latency`
- `memory-md-scope-latency`
- `project-positioning-latency`
- `daughter-profile-latency`

These live in:

- [evals/perf-cases.json](evals/perf-cases.json)

Rules:

- `softLimitMs`: exceeded means regression warning
- `hardLimitMs`: exceeded means the perf suite fails

### Recommended Usage

For every development round:

1. `npm test`
2. `npm run smoke:eval:critical`
3. when changing user-fact behavior, also run `npm run eval:agent:critical`
4. when changing retrieval / rewrite / card logic, also run `npm run eval:perf`
5. when changing formal/pending boundaries or governing host memory, also run `npm run memory:audit-formal -- --write`
6. when changing safe governance rules, also run `npm run memory:govern-safe -- --write --label YYYY-MM-DD-governance-waveN`
7. when changing session-memory exit logic, also run `npm run memory:audit-session-exit -- --write`
8. when changing governance workflow or doing periodic cleanup, also run `npm run memory:governance-cycle -- --write`
9. when changing conflict handling or slot governance, also run `npm run memory:audit-conflicts -- --write`
10. when changing duplicate-fact handling or doing fact dedup governance, also run `npm run memory:audit-duplicates -- --write`

For stage gates:

1. `npm run smoke:eval`
2. `npm run eval`
3. `npm run eval:agent`

### Current Notes

The smoke suite is still intentionally split:

- `critical` is the minimum protection layer for every round
- full smoke is the broader baseline that should also stay green at stage gates

Current baseline:

- `critical smoke = 10/10`
- `full smoke = 22/22`

## 中文

### 先看结论

如果你只想跑最重要的一组检查，直接用这 4 个命令：

```bash
npm test
npm run smoke:eval
npm run eval:memory-search:cases
npm run memory:governance-cycle -- --write
```

它们分别覆盖：

- `npm test`：核心函数和逻辑安全
- `npm run smoke:eval`：用户侧回归基线
- `npm run eval:memory-search:cases`：memory-search 专项基线
- `npm run memory:governance-cycle -- --write`：正式记忆层和治理健康度

### 总览

这个仓库当前的测试分成 5 层：

1. 单元 / 集成测试
2. smoke 组装测试
3. 检索黄金样本评测
4. 真实 `main` agent 回归
5. 正式记忆层巡检与治理检查

每一层回答的问题不同：

- 函数本身对不对
- retrieval + rerank + assembly 这条链路是否还正常
- 期望文档是否还在被选中
- 真实 OpenClaw agent 是否还会答对关键问题
- 宿主正式记忆层当前是否足够干净，是否混入 pending / process / runtime 污染
- 冲突事实、重复事实、session-memory 退出治理信号是否仍在可控范围

### 测试文件在哪里

核心脚本：

- [scripts/smoke-assemble.js](scripts/smoke-assemble.js)
- [scripts/eval-smoke-cases.js](scripts/eval-smoke-cases.js)
- [scripts/eval-cases.js](scripts/eval-cases.js)
- [scripts/agent-regression.js](scripts/agent-regression.js)
- [scripts/audit-formal-memory.js](scripts/audit-formal-memory.js)
- [scripts/audit-session-memory-exit.js](scripts/audit-session-memory-exit.js)
- [scripts/audit-fact-conflicts.js](scripts/audit-fact-conflicts.js)
- [scripts/audit-fact-duplicates.js](scripts/audit-fact-duplicates.js)
- [scripts/run-governance-cycle.js](scripts/run-governance-cycle.js)
- [scripts/verify-suite.js](scripts/verify-suite.js)

case 文件：

- [evals/smoke-cases.json](evals/smoke-cases.json)
- [evals/golden-cases.json](evals/golden-cases.json)
- [evals/agent-regression-cases.json](evals/agent-regression-cases.json)
- [evals/fact-growth-cases.json](evals/fact-growth-cases.json)
- [evals/perf-cases.json](evals/perf-cases.json)

### 命令怎么跑

跑单元 / 集成测试：

```bash
npm test
```

跑单条 smoke 查询：

```bash
npm run smoke -- "我爱吃什么"
```

对比两个 preset：

```bash
npm run smoke:compare -- "Lossless 插件 和 长期记忆 的区别"
```

跑轻量 smoke 套件：

```bash
npm run smoke:eval:critical
```

跑全量 smoke baseline：

```bash
npm run smoke:eval
```

跑黄金检索评测：

```bash
npm run eval
```

跑性能评测：

```bash
npm run eval:perf
```

跑正式记忆层巡检：

```bash
npm run memory:audit-formal -- --write
```

跑 session-memory 退出巡检：

```bash
npm run memory:audit-session-exit -- --write
```

跑事实冲突巡检：

```bash
npm run memory:audit-conflicts -- --write
```

跑事实重复巡检：

```bash
npm run memory:audit-duplicates -- --write
```

跑一轮完整治理周期：

```bash
npm run memory:governance-cycle -- --write
```

跑轻量真实 agent 回归：

```bash
npm run eval:agent:critical
```

跑已升格为主回归的稳定事实：

```bash
npm run eval:agent:stable-facts
```

跑“新对话事实”回归：

```bash
npm run eval:agent:facts
```

如果要给真实 agent 回归设置超时并看逐条进度：

```bash
npm run eval:agent:facts -- --timeout-ms 45000
```

跑全量真实 agent 回归：

```bash
npm run eval:agent
```

维护者常用总入口：

```bash
npm run verify
```

正式记忆层巡检报告默认写到：

- [reports/formal-memory-audit-2026-04-05.md](reports/formal-memory-audit-2026-04-05.md)

### Smoke 测试案例

当前 smoke cases 已经按类别分组。

#### `user-facts`

- `food-preference`
  查询：`我爱吃什么`
  期望：selected context 包含 `牛排`，top source 应为 `cardArtifact`

- `identity-name`
  查询：`你怎么称呼我`
  期望：selected context 包含 `超哥` 或 `刘超`，top source 应为 `cardArtifact`

- `timezone-smoke`
  查询：`我的时区是什么`
  期望：selected context 包含 `GMT+8` 或 `北京时间`，top source 应为 `cardArtifact`

- `communication-style-smoke`
  查询：`你应该怎么跟我沟通`
  期望：selected context 包含 `直接`、`实用`、`不废话`，top source 应为 `cardArtifact`

#### `rules`

- `reminder-channel-smoke`
  查询：`我说提醒时默认用什么`
  期望：selected context 包含 `飞书任务`、`苹果日历`，top source 应为 `cardArtifact`

- `execution-rule-smoke`
  查询：`收到明确任务后，低风险可逆操作应该怎么做`
  期望：selected context 包含 `低风险`、`可直接执行`、`先确认`，top source 应为 `cardArtifact`

- `memory-md-scope`
  查询：`MEMORY.md 应该放什么内容`
  期望：selected context 包含 `长期稳定` / `反复复用`，top source 应为 `cardArtifact`

- `workspace-layering`
  查询：`长期记忆目录规则是什么`
  期望：selected paths 包含 `workspace/memory/2026-04-04.md` 或 `workspace/MEMORY.md`

#### `concepts`

- `lossless-understanding`
  查询：`为什么已经有长期记忆了，还需要 Lossless`
  期望：selected context 包含 `Lossless`、`长期记忆`、`context`

- `provider-role`
  查询：`memorySearch.provider 是做什么的`
  期望：selected context 包含 `embedding`、`memory_search`

- `openviking-role`
  查询：`OpenViking 是做什么的`
  期望：selected context 包含 `长期记忆检索补充工具`、`个人信息`、`历史片段`，top source 应为 `cardArtifact`

- `agent-routing-rule`
  查询：`编程工作应该交给哪个 Agent`
  期望：selected context 包含 `编程工作`、`code Agent`，top source 应为 `cardArtifact`

- `main-boundary-rule`
  查询：`main 负责什么`
  期望：selected context 包含 `总协调`、`任务判断`、`任务分派`、`结果汇总`，top source 应为 `cardArtifact`

- `main-negative-boundary-rule`
  查询：`main 不负责什么`
  期望：selected context 包含 `不负责长期承接`、`专业 Agent`、`具体执行`，top source 应为 `cardArtifact`

- `status-word-rule`
  查询：`已开始是什么意思`
  期望：selected context 包含 `已开始`、`实际工具调用`、`后台任务`、`明确执行动作`，top source 应为 `cardArtifact`

#### `project`

- `plugin-config`
  查询：`memory-context-claw 这个插件的配置应该怎么写`
  期望：selected context 包含 `memory-context-claw`、`contextEngine`、`enabled: true`

### Golden 检索案例

当前 golden retrieval cases：

- `lossless-vs-memory`
- `workspace-layering`
- `memory-usage`

它们主要检查：期望文档是否仍然出现在检索结果里。

### 真实 Agent 回归案例

当前真实 `main` agent 回归包含：

- `lossless-understanding`
- `memory-md-scope`
- `directory-layering`
- `plugin-positioning`
- `provider-role`
- `plugin-config`
- `alt-phrasing-context-plugin`
- `plugin-minimal-config`
- `food-preference-latest`
- `identity-preferred-name`

### 从新对话拆出来的事实用例

最近从 `main` 的新增对话里拆出来、准备逐步接入自动化的 case 有：

- `birthday-solar`
- `birthday-lunar`
- `daughter-profile`
- `son-profile`
- `children-overview`
- `ambiguous-id-date-guardrail`

这些用例目前放在：

- [evals/fact-growth-cases.json](evals/fact-growth-cases.json)

其中已经稳定、并升格进主 `agent regression` 的有：

- `birthday-solar`
- `birthday-lunar`
- `daughter-profile`
- `son-profile`
- `children-overview`
- `identity-birthyear-dual`

### Live Regression Caveat

`eval:hot*` should be read as a **hot-session health check**, not a clean isolated-session baseline.

When debugging a failure, inspect:

- `observedSessionKey`
- `observedSessionId`
- `hotSession.hotMainAlias`
- `hotSession.isolated`

If `observedSessionKey = agent:main:main` or `hotSession.isolated = false`, treat the result as potentially contaminated by the existing `main` session history.

Current confirmed limitation on this machine:

- `openclaw agent --agent main --session-id ...`
- `openclaw agent --to ... --session-id ...`
- `openclaw agent --local --agent main --session-id ...`

have not produced a trustworthy isolated `main` session path so far.

Current `openclaw agent` based live regression for `main` is a **hot-session validation**, not a guaranteed clean-session baseline.

Confirmed behavior on this machine:

- `openclaw agent --agent main --session-id ...`
- `openclaw agent --to ... --session-id ...`

both still resolve to:

- `systemPromptReport.sessionKey = agent:main:main`

That means:

- live answers can still be affected by the currently hot `main` session
- `smoke`, `perf`, and governance-cycle retrieval baselines remain reliable
- `eval:hot*` / `eval:agent:*` should currently be interpreted as:
  - useful for checking whether the running `main` experience is healthy
  - not yet a pure isolated regression baseline

目前仍保留在独立治理池、还没有升格进主回归的是：

- `ambiguous-id-date-guardrail`

详细拆解说明在：

- [reports/new-dialogue-test-cases.md](reports/new-dialogue-test-cases.md)

### 性能测试用例

当前 perf cases 用来盯几条代表性查询的耗时预算：

- `food-preference-latency`
- `identity-name-latency`
- `memory-md-scope-latency`
- `project-positioning-latency`
- `daughter-profile-latency`

这些用例放在：

- [evals/perf-cases.json](evals/perf-cases.json)

规则是：

- `softLimitMs` 超过时记为性能告警
- `hardLimitMs` 超过时，perf suite 直接失败
- perf runner 会逐条打印进度，便于定位卡住的是哪一条
- 可以给底层 `openclaw memory search` 加命令超时，例如：
  - `npm run eval:perf -- --timeout-ms 15000`

### 推荐怎么使用

每一轮开发都建议至少跑：

1. `npm test`
2. `npm run smoke:eval:critical`
3. 如果改到了用户事实链路，再跑 `npm run eval:agent:critical`
4. 如果改到了 retrieval / rewrite / card 逻辑，再跑 `npm run eval:perf`

阶段性验收建议跑：

1. `npm run smoke:eval`
2. `npm run eval`
3. `npm run eval:agent`

### 当前说明

目前 smoke 仍然刻意分成两层：

- `critical` 是每轮必跑的最小保护面
- 全量 smoke 是阶段性 baseline，也应该在阶段收口时保持全绿

当前基线：

- `critical smoke = 10/10`
- `full smoke = 22/22`
## Memory Search Workstream

这组不是“宿主 `memory_search` 已修好”的证明，而是后续收口 builtin `memory_search` 缺口的专项 case 集。

- case 文件：
  [memory-search-cases.json](evals/memory-search-cases.json)
- 工作流说明：
  [memory-search-workstream.md](reports/memory-search-workstream.md)

当前用途：

- 统一记录 memory-search 根源问题的专项案例
- 区分：
  - 宿主 builtin `memory_search` 自身的缺口
  - 插件层 fast path / fact-first 补强已经兜住的查询
- 后面新的 targeted 验证脚本会优先围绕这份 case 集扩展

结构说明：

- 工作流已独立
- 专项 case 已独立
- 源码与测试目录暂未物理拆分

原因：

- 当前边界在工程上已经清楚，但代码上仍跨 retrieval / scoring / query rewrite / conversation-memory / engine
- 现在先追根因和 targeted 验证，比先大规模搬文件更重要

结构说明文档：

- [memory-search-scope.md](memory-search-scope.md)
- [memory-search-architecture.md](reports/memory-search-architecture.md)
- [memory-search-roadmap.md](reports/memory-search-roadmap.md)
- [memory-search-orchestration-vs-tool-agent.md](reports/memory-search-orchestration-vs-tool-agent.md)
