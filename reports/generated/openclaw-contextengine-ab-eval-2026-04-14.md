# OpenClaw ContextEngine A/B 对照报告

日期：`2026-04-14`  
对照目标：`legacy` 基线 vs `unified-memory-core v0.2.1`  
关注问题：回答到底来自哪里，以及哪些能力是扩展后才更明显具备的

## 1. 这份报告回答什么

前一份报告 [openclaw-cli-memory-eval-2026-04-13.md](./openclaw-cli-memory-eval-2026-04-13.md) 证明了：

- 当当前激活的 `contextEngine` 是 `unified-memory-core`
- 真实 `openclaw memory search` / `openclaw agent` 链路
- 在那 20 个案例里是可用的

但那份报告**不能单独回答**：

- 某个答案是不是只靠 workspace bootstrap 就能得到
- 某个答案是不是 OpenClaw 原生记忆系统本来就会
- 某个答案是不是 `Unified Memory Core` 扩展后才更好地做到

这份 A/B 报告就是专门补这个空白。

## 2. 怎么做对照

为了不改动宿主真实配置，这次没有直接改 `~/.openclaw/openclaw.json`，而是做了一个临时 profile：

- 临时状态目录：`/tmp/openclaw-ab`
- 复制了原始 `openclaw.json`
- 复制了同一个测试 agent：`umceval`
- 复制了同一份记忆索引数据库：`umceval.sqlite`

然后只改一件事：

- 把 `plugins.slots.contextEngine` 从 `unified-memory-core` 切成 `legacy`
- 并且把 `unified-memory-core` 从临时 profile 的 `plugins.allow`、`plugins.load.paths`、`plugins.entries` 里移除

这样得到的是：

- 同一个 agent
- 同一批测试记忆
- 同一套宿主 CLI
- 唯一变量是 `contextEngine`

验证命令结果：

- `OPENCLAW_STATE_DIR=/tmp/openclaw-ab openclaw config get plugins.slots.contextEngine` -> `legacy`
- `OPENCLAW_STATE_DIR=/tmp/openclaw-ab openclaw plugins inspect unified-memory-core --json` -> `Plugin not found: unified-memory-core`

所以这轮对照不是“同一条链路重复跑两遍”，而是真正把扩展拿掉后再测。

## 3. 这次只挑了三类关键问题

为了回答“答案来自哪里”，这轮不需要重跑全部 20 题，只需要测最能区分来源的三类：

1. bootstrap 类
   目标：判断答案是不是仅靠 workspace 注入文件就能拿到
2. 普通检索类
   目标：判断原生基线是否已经具备一般记忆检索能力
3. 当前态覆盖类
   目标：判断“新值压住旧值”的能力是否主要来自扩展

## 4. 对照结果

### 4.1 bootstrap 类：不是简单“只因为有 MEMORY.md”

测试题：

- 用户 preferred name 是什么
- 用户 timezone 是什么

统一观察：

- `legacy` 和 `unified-memory-core` 的 system prompt report 都显示同样的 workspace 注入文件
- 其中都包含 `MEMORY.md`

但实际答案不同：

| 案例 | unified-memory-core | legacy |
| --- | --- | --- |
| preferred name | `Maya Chen.` | `I don't know based on current memory.` |
| timezone | `Asia/Shanghai.` | `I don't know based on current memory.` |

这说明两件事：

1. 不能因为 system prompt 里出现了 `MEMORY.md`，就认定答案只是 bootstrap 自带的
2. 至少在这两个案例里，`Unified Memory Core` 对 bootstrap 信息的装配/使用效果明显强于 `legacy`

更准确的说法是：

- 这些答案**可能包含 bootstrap 信号**
- 但**不是“只要有 bootstrap 就谁都能答出来”**

## 4.2 普通检索类：不是所有能力都来自扩展

测试题：

- `What is Project Lantern?`

`legacy` 基线下，真实 `openclaw agent` 也能回答：

- `A B2B analytics assistant for clinic managers.`

而前一份 20 案例报告里，这个项目事实在 `unified-memory-core` 当前链路下同样通过。

这意味着：

- 一般性的长期项目事实检索，并不是扩展后才第一次出现
- OpenClaw 原生基线本身已经具备一部分可用的记忆检索能力

所以不能把所有通过项都归功于 `Unified Memory Core`。

## 4.3 当前态覆盖类：这里是扩展增益最清楚的地方

测试题：

- 当前 main editor 是什么
- 当前 default deploy region 是什么
- 当前 meetings notebook 是什么
- 当前 clinic demo 现在是什么时间

`unified-memory-core` 当前链路结果：

- editor -> `Zed.`
- region -> `eu-west-1`
- notebook -> `The charcoal A5 notebook.`
- clinic demo -> `Next Tuesday at 15:00 Shanghai time.`

`legacy` 基线结果：

- editor -> `I don't know based on current memory.`
- region -> `I don't know based on current memory.`
- notebook -> `I don't know based on current memory.`

这组结果说明：

- 原生基线并不擅长把“旧值 -> 新值”的更新信息稳定整理成当前答案
- `Unified Memory Core` 在当前态问题上，已经明显比 `legacy` 更强

这里的差异不是“多记住了一条静态事实”，而是：

- 能不能把冲突片段组织成当前值
- 能不能避免旧值污染最终回答

这正是本次 `assembly` 当前态净化修复所覆盖的能力。

## 5. 结论：哪些能力是谁带来的

基于这轮 A/B，对“答案来自哪里”可以更准确地分成三类：

### A. 可能包含 bootstrap 信号，但不能简化成“只是 bootstrap”

代表案例：

- preferred name
- timezone

原因：

- 两边都看到了同样的 `MEMORY.md`
- 但只有 `unified-memory-core` 稳定答出来

所以这里更合理的结论是：

- bootstrap 是输入来源之一
- `Unified Memory Core` 对这类输入的利用效果更好

### B. 原生基线本来就有一部分能力

代表案例：

- `Project Lantern` 这类普通长期项目事实

原因：

- `legacy` 基线已经能回答

所以这里更合理的结论是：

- 不是所有“能答出来”的东西，都能算成扩展新增能力

### C. 扩展后的显著增益，主要在“当前态记忆使用”

代表案例：

- current editor
- current deploy region
- current notebook
- current clinic demo time

原因：

- 这类问题要求系统处理“新旧并存、但要只给当前值”
- `legacy` 基线在已测样本上直接 abstain
- `unified-memory-core` 当前链路可以稳定给出当前值

所以这里可以比较有把握地说：

- 这是 `Unified Memory Core` 带来的显著增强

## 6. 这份报告和前一份 20 案例报告应该怎么一起看

最稳妥的解读方式是：

- 前一份 20 案例报告回答“当前生产链路是否可用”
- 这份 A/B 报告回答“哪些能力本来就有，哪些是扩展后更强”

合起来之后，可以得出一个更接近事实的结论：

- OpenClaw 原生基线并不是完全没有记忆能力
- `Unified Memory Core` 也不是“所有通过项都独占”
- 但在 bootstrap 信息利用和当前态记忆使用上，`Unified Memory Core` 确实带来了清楚可见的提升

## 7. 还没有覆盖的边界

这份 A/B 仍然是一个最小对照，不是完整矩阵。

它还没有系统覆盖：

- `compat` 专门模式
- 全 20 个案例的双跑统计
- 大规模多日历史数据
- 不同 provider / gateway fallback 的差异

所以目前最准确的表述是：

- 已经足够证明“扩展增益存在，而且主要体现在当前态记忆使用”
- 但还没有做到完整产品基准测试的严密程度

## 8. 相关材料

- 当前生产链路 20 案例报告：[openclaw-cli-memory-eval-2026-04-13.md](./openclaw-cli-memory-eval-2026-04-13.md)
- bootstrap 对照原始结果：[umc_ab_agent_eval.partial.json](/tmp/umc_ab_agent_eval.partial.json)
- 当前态 unified 复测结果：[umc_temporal_agents_results.json](/tmp/umc_temporal_agents_results.json)
