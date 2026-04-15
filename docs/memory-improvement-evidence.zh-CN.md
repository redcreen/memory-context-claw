# 为什么 Unified Memory Core 用起来更顺手

如果只说一句话：

`unified-memory-core` 不是把 OpenClaw 内置记忆“完全替掉”的魔法插件。跑完 `100` 个真实 live A/B 案例后，更准确的结论是：它已经把记忆系统变得更可治理、更可测试、更容易维护，但在直接 answer-level 对比上，目前只表现出小幅领先，而不是大幅碾压。

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

- 仓库回归：`403 / 403`
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

- 两边都答对：`96`
- 只有 Memory Core 答对：`1`
- 只有内置答对：`1`
- 两边都没答对：`2`

按语言拆开看：

- 英文：`50` 个，Memory Core `50` 个通过，内置 `49` 个通过，`1` 个只有 Memory Core 能答对
- 中文：`50` 个，Memory Core `47` 个通过，内置 `48` 个通过，没有 Memory Core 独占增益，反而有 `1` 个是内置独占通过，另外 `2` 个两边都失败

这组结果说明两件事：

1. OpenClaw 内置记忆在很多简单事实题上本来就不差。
2. Memory Core 的当前净增益已经出现，但幅度不大。如果你的预期是“做了这么多工作后，answer-level 会明显甩开默认内置”，那现在还不能这么说。

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

同时，这轮也明确暴露了一个不能回避的问题：

- 提问：
  `只根据当前记忆，我的生日是哪一天？如果没有这条记忆，就只回答：I don't know based on current memory.`
- Memory Core：失败，出现了幻觉答案 `1983-02-06`
- OpenClaw 内置：通过，正确拒答

也就是说，现在最诚实的判断是：

- Memory Core 已经不是“没有增益”
- 但它也还没有进入“在大量真实问题上明显比默认内置更强”的阶段

为了让这个结论更容易把握，你可以直接把 `100` 个 live A/B 的结论记成：

- `96` 个：两边都能答对
- `1` 个：只有 Memory Core 能答对
- `1` 个：只有默认内置能答对
- `2` 个：两边都没答对

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

- 把这轮 `100` 个 A/B 里暴露出来的 `1` 个内置独占通过和 `2` 个两边都失败先收掉
- 然后再把 Memory Core 的直接胜场，从现在的 `1` 个，推向更大规模、尤其是 cross-source / conflict / multi-step history / 更深自然中文场景里的稳定领先
