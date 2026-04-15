# 为什么 Unified Memory Core 用起来更顺手

如果只说一句话：

`unified-memory-core` 不是把 OpenClaw 内置记忆“完全替掉”的魔法插件，但它已经把记忆系统变得更可治理、更可测试、更容易维护，并且在更难的真实问法上已经出现了可验证的 answer-level 增益。

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

- 仓库回归：`399 / 399`
- latest available release-preflight 证据：`8 / 8` 通过
- retrieval-heavy CLI benchmark：`262 / 262`
- isolated local answer-level gate：`12 / 12`
- 更深的 answer-level watch：`12 / 18`
- 仓库当前维护的 runnable matrix：`392` cases
- 其中中文相关 case 占比：`53.83%`

## 真实 A/B：Memory Core 对比 OpenClaw 内置

我还做了一轮真正的 live answer-level A/B 对比：

- 同一个 agent
- 同一份记忆夹具
- 同一组问题
- `unified-memory-core` 对比 OpenClaw 默认内置上下文引擎

真实对比案例数：`16`

- 两边都答对：`15`
- 只有 Memory Core 答对：`1`
- 只有内置答对：`0`

按语言拆开看：

- 英文：`8` 个，`8` 个都是两边都答对，`0` 个只有 Memory Core 能答对
- 中文：`8` 个，`7` 个两边都答对，`1` 个只有 Memory Core 能答对

这组结果说明两件事：

1. OpenClaw 内置记忆在很多简单事实题上本来就不差。
2. Memory Core 的当前净增益已经出现了，但主要集中在更难的自然问法，尤其是中文问法，而不是所有简单题都立刻拉开差距。

## 这轮新增修复带来了什么

这轮不是只重跑测试，我还把 answer-level runner 的宿主噪声处理补强了：

- 更强的 JSON payload 提取
- isolated eval agent 的 stale session lock 清理
- 不再在每个 case 前 destructive reset session
- 空 payload / parse failure 时做一次 bounded retry

结果是：

- repo-default stable answer-level formal gate 重新稳定在 `12 / 12`
- 更深的 watch 面从之前的 `7 / 18` 提升到现在的 `12 / 18`

这说明当前主问题已经不再是“stable gate 根本不可信”，而是“更深、更难的 answer-level 覆盖还没完全收口”。

## 一个更有说服力的真实例子

中文 A/B 里的真实问题：

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

下一阶段的目标，就是把“现在只是部分题领先”继续推向“更多真实问题上，Memory Core 会比默认内置更稳定地领先”。
