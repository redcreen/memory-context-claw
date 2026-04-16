# 为什么 Unified Memory Core 用起来更顺手

如果只说一句话：

`unified-memory-core` 不是把 OpenClaw 内置记忆“完全替掉”的魔法插件。但现在更准确的说法已经不再是“它只小幅领先”。跑完两组不同性质的 live A/B 后，结论变成了：

- 如果测的是“同一份既有记忆，谁消费得更好”，差异确实不大。
- 如果测的是“普通对话里刚说了一条长期规则/偏好/事实，下一轮新会话谁更会记住”，`Unified Memory Core` 已经开始明显领先。

## 用户现在立刻能得到什么

- 事实、规则、当前状态问题会走一条受治理的 retrieval + assembly 路径
- nightly self-learning 已经内建并可运行
- 记忆能力不再只靠聊天体感，而是有正式 CLI 门禁保护
- 宿主 transport 故障会被单独隔离，不再误判成算法退化

这意味着：

- 遇到“旧信息和新信息混在一起”的概率更低
- `现在到底是什么` 这类问题更容易稳定答对
- 一旦回归，维护者更容易定位到底是算法问题还是宿主问题

## 当前证据说明了什么

最新完整证据：

- 完整报告：[unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md](../reports/generated/unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md)

这一轮关键结果：

- 仓库回归：`414 / 414`
- latest available release-preflight 证据：`8 / 8` 通过
- retrieval-heavy CLI benchmark：`262 / 262`
- isolated local answer-level gate：`12 / 12`，其中中文样本 `6 / 12`
- 更深的 answer-level watch：`14 / 18`
- 仓库当前维护的 runnable matrix：`392` cases
- 其中中文相关 case 占比：`53.83%`

## 真实 A/B：Memory Core 对比 OpenClaw 内置

我这次做的是一轮真正的、规模足够大的 live answer-level A/B 对比：

- 同一个 agent
- 同一份记忆夹具
- 同一组问题
- `unified-memory-core` 对比 OpenClaw 默认内置上下文引擎

真实对比案例数：`100`

- 两边都答对：`97`
- 只有 Memory Core 答对：`1`
- 只有内置答对：`0`
- 两边都没答对：`2`

按语言拆开看：

- 英文：`50` 个，Memory Core `50` 个通过，内置 `49` 个通过，`1` 个只有 Memory Core 能答对
- 中文：`50` 个，Memory Core `48` 个通过，内置 `48` 个通过，没有 Memory Core 独占增益，也没有内置独占通过，另外 `2` 个两边都失败

这组结果说明两件事：

1. OpenClaw 内置记忆在很多简单事实题上本来就不差。
2. Memory Core 的当前净增益已经出现，但幅度不大。如果你的预期是“做了这么多工作后，answer-level 会明显甩开默认内置”，那现在还不能这么说。

## 新专项 A/B：普通对话实时写记忆

这轮我又补了一组更贴近真实使用方式的 live A/B：

- capture：先在普通对话里告诉系统一条新规则/新偏好/新事实
- prune：然后把 session transcript 清掉，避免只是吃到“刚才那轮上下文残留”
- recall：最后在新会话里追问，看它到底有没有形成可召回的长期记忆

专项报告：

- [openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md](../reports/generated/openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)

这组一共 `10` 条：

- current（OpenClaw + Unified Memory Core ordinary-conversation governed ingest）：`10`
- legacy（OpenClaw 默认 legacy path）：`5`
- 两边都通过：`5`
- 只有 Memory Core 通过：`5`
- 只有 legacy 通过：`0`
- 两边都失败：`0`

按语言拆开看：

- 英文：`5` 条，current `5`，legacy `3`，`UMC-only=2`，`legacy-only=0`
- 中文：`5` 条，current `5`，legacy `2`，`UMC-only=3`，`legacy-only=0`

这组结果的意义，比旧的 `100` 条更接近“普通用户实际会感受到的聪明”：

1. `tool_routing_preference` 这类 structured ordinary memory，UMC 已经能稳定拉开。
2. 中文普通对话写记忆这条线上，UMC 现在比 legacy 更明显。
3. 之前那条英文 durable-rule 代号题 `saffron-releases` 已经被 current 收掉，现在 focused ordinary-conversation write suite 已经做到 `10 / 10`。

## 这轮新增修复带来了什么

这轮不是只重跑测试，我还把 answer-level runner 的宿主噪声处理补强了：

- 更强的 JSON payload 提取
- isolated eval agent 的 stale session lock 清理
- 不再在每个 case 前 destructive reset session
- 空 payload / parse failure 时做一次 bounded retry

结果是：

- repo-default stable answer-level formal gate 重新稳定在 `12 / 12`
- formal gate 本身的中文占比已经抬到 `6 / 12`
- 更深的 watch 面维持在 `14 / 18`

这说明当前主问题已经不再是“stable gate 根本不可信”，而是“更深、更难的 answer-level 覆盖还没完全收口”。

## 一个更有说服力的真实例子

这轮最明确的 Memory Core 独占增益案例其实出现在英文检索问法上：

- 提问：
  `Based only on your memory for this agent, if someone asks what Lantern does, how should you describe it? If memory is missing, reply exactly: I don't know based on current memory.`
- Memory Core：通过
- OpenClaw 内置：失败

还有一个评测口径修正：

- 之前那条“生日”中文负例，不再继续算 plain negative
- 它更像 identity-conflict / birthday-guardrail，而不是干净的“不知道就拒答”探针
- 换成真正的未知事实负例后，`100` case live A/B 里已经没有 builtin-only 胜场

也就是说，现在最诚实的判断变成了：

- 在“既有记忆消费”上，Memory Core 的增益依然偏小。
- 在“普通对话实时写入长期记忆”上，Memory Core 已经开始明显更强。
- current ordinary-conversation path 这一轮已经收口到 focused suite `10 / 10`；剩下更值得优先看的，是 `100` case 里仍未关闭的 `2` 条 shared-fail 中文 history case。

为了让这个结论更容易把握，你可以把两组 A/B 分开记：

- `100` 条既有记忆消费题：
  `97` shared、`1` UMC-only、`0` legacy-only、`2` both-fail
- `10` 条普通对话实时写记忆题：
  `5` shared、`5` UMC-only、`0` legacy-only、`0` both-fail

之前我用来说明增益的中文案例，现在仍然是一个有效的“Memory Core 可以赢”的例子：

- 提问：
  `只根据当前记忆，Project Lantern 到底是在做什么？如果没有这条记忆，就只回答：I don't know based on current memory.`
- Memory Core：通过
- OpenClaw 内置：失败

这类题的关键不只是“有没有检到相关记忆”，而是最终 retrieval + assembly 能不能把答案稳定组织对。

## 为什么维护者通常更在意它

即使某些题两边都能答对，Memory Core 仍然多给了你一整套默认内置没有在这个仓库里清晰提供的能力：

- 受治理的 memory lifecycle
- nightly self-learning 报告
- promotion / replay / audit surfaces
- 正式 benchmark gates
- transport watchlist
- 清晰的性能基线

所以真正的价值不只是“多答对了几道题”，更是“这套记忆系统终于变得可测、可解释、可维护”。

## 下一步会继续做什么

GitHub development plan 现在已经进入下一步：

- 把 answer-level 覆盖继续扩到 `cross-source`、`conflict`、`multi-step history`，以及更自然、更高信息密度的中文问法

下一阶段的目标，已经不是“证明它能工作”，而是更严肃的一步：

- 把这轮 `100` 个 A/B 里剩下的 `2` 个两边都失败先收掉
- 然后再把 Memory Core 的直接胜场，从现在的 `1` 个，推向更大规模、尤其是 cross-source / conflict / multi-step history / 更深自然中文场景里的稳定领先
