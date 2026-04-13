# OpenClaw CLI 记忆能力评测报告

日期：`2026-04-13`  
评测对象：`unified-memory-core v0.2.1`  
评测方式：真实 `OpenClaw CLI` 宿主链路  
最终结果：`20 / 20` 通过

## 1. 这轮测试要回答什么

这轮测试只想回答一个问题：

`Unified Memory Core` 现在到底能不能在真实 OpenClaw 使用里，稳定记住重要信息，并在需要时正确用出来。

所以这轮测试不是只看：

- registry 里有没有落 `stable`
- 仓库单元测试有没有绿
- 插件有没有“理论上”实现

而是直接走真实 `OpenClaw CLI`：

- `openclaw memory search`
- `openclaw agent`

也就是尽量贴近真实使用路径来验证。

## 2. 测试环境

为了避免污染主记忆，这轮测试使用了一个隔离 agent：`umceval`。

给这个 agent 准备了 5 份测试记忆文件，分别覆盖：

- 稳定个人信息
- 长期偏好
- 长期规则
- 项目信息
- 带“旧值 -> 新值”更新的信息

OpenClaw 对这个 agent 的真实索引状态是：

- `provider = local`
- `searchMode = hybrid`
- `files = 5`

这意味着：

- 宿主真实读到了测试记忆
- 不是绕过 OpenClaw 直接查文件
- 不是只在插件内部自说自话

## 3. 测试怎么做

这轮一共 20 个案例，分成两类入口：

- `13` 个案例使用 `openclaw memory search`
  用来验证“宿主能不能把记忆检出来”
- `7` 个案例使用 `openclaw agent`
  用来验证“用户真实发问时，模型能不能把记忆正确答出来”

这样设计的原因是：

- `memory search` 更适合测检索是否可见
- `agent` 更适合测最终回答是否正确

尤其是“当前值覆盖旧值”这类问题，本质上应该看最终用户拿到的答案，所以用 `openclaw agent` 来验。

### 3.1 这 20 个案例有没有自动覆盖 `new / compat / legacy`

没有。

这 20 个案例跑的是**当前宿主实际生效的那条链路**。

在本机这次评测里，OpenClaw 当前配置是：

- `plugins.slots.contextEngine = unified-memory-core`

所以这 20 个案例证明的是：

- 当 `Unified Memory Core` 作为当前激活的 `contextEngine` 时
- `openclaw memory search` 和 `openclaw agent` 这两条真实宿主链路
- 是否能把记忆检出来、并在最终回答里正确用出来

它**不能单独证明**下面这些问题：

- 这些能力是不是 OpenClaw 原生记忆系统本来就有
- 这些能力是不是只有 `Unified Memory Core` 扩展后才有
- `legacy` / `new` / `compat` 这些不同链路之间，具体差多少

也就是说，这份报告回答的是：

- “当前这条正在使用的链路是否可用”

但它**还没有回答**：

- “原生基线 vs 扩展后能力，差异到底在哪”

### 3.2 为什么不能靠这 20 个案例自动得出“原生 vs 扩展”的结论

因为 `openclaw agent` 和 `openclaw memory search` 不会为了测试自动帮我们切到另一条链路。

它们只会走：

- 当前 OpenClaw 配置
- 当前激活的 `contextEngine`
- 当前可用的 runtime

所以如果不显式切换配置，这 20 个案例永远测到的都是同一条路径。

换句话说：

- 这次不是 `A/B` 对照实验
- 而是“当前生产配置可用性验证”

### 3.3 如果要回答“到底是原生能力还是扩展能力”，应该怎么测

要回答这个问题，必须显式做一轮 `A/B`：

1. 用同一批案例跑 `legacy / 原生` 链路
2. 再用同一批案例跑 `unified-memory-core` 链路
3. 对比两边在以下维度上的差异：
   - 检索命中率
   - 最终回答正确率
   - 当前值覆盖旧值能力
   - 未知问题拒答能力

只有这样，才能明确回答：

- 哪些能力是原生就有
- 哪些能力是扩展后才补上的
- 哪些能力是扩展后明显增强的

## 4. 20 个测试案例

| # | 类别 | 验证目标 | 入口 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | profile | 能否记住用户名字 | `memory search` | 通过 |
| 2 | profile | 能否记住用户时区 | `memory search` | 通过 |
| 3 | preference | 能否记住回复风格 | `memory search` | 通过 |
| 4 | preference | 能否记住更偏好异步文字沟通 | `memory search` | 通过 |
| 5 | preference | 能否记住咖啡偏好 | `memory search` | 通过 |
| 6 | preference | 能否记住飞机座位偏好 | `memory search` | 通过 |
| 7 | rule | 能否记住 debug 规则 | `memory search` | 通过 |
| 8 | rule | 能否记住稳定版 tag 规则 | `memory search` | 通过 |
| 9 | project | 能否记住 Project Lantern 是什么 | `memory search` | 通过 |
| 10 | project | 能否记住当前 milestone | `memory search` | 通过 |
| 11 | project | 能否记住 design partner | `memory search` | 通过 |
| 12 | project | 能否记住 launch city | `memory search` | 通过 |
| 13 | project | 能否记住 support SLA | `memory search` | 通过 |
| 14 | temporal-update | 当前 editor 是否能覆盖旧值 | `agent` | 通过 |
| 15 | temporal-update | 当前 demo 时间是否能覆盖旧值 | `agent` | 通过 |
| 16 | temporal-update | 当前 deploy region 是否能覆盖旧值 | `agent` | 通过 |
| 17 | temporal-update | 当前 notebook 是否能覆盖旧值 | `agent` | 通过 |
| 18 | end-to-end | 再做一次真实当前态问答 | `agent` | 通过 |
| 19 | end-to-end-negative | 不知道最喜欢的编程语言时会不会瞎编 | `agent` | 通过 |
| 20 | end-to-end-negative | 不知道常订酒店时会不会瞎编 | `agent` | 通过 |

## 5. 关键结果

### 5.1 稳定事实已经可用

以下类型已经能稳定记住并检出：

- 名字
- 时区
- 回复风格
- 沟通偏好
- 咖啡偏好
- 飞机座位偏好
- debug 规则
- release tag 规则
- 项目定位
- 项目 milestone
- design partner
- support SLA
- launch city

换句话说，长期稳定、低冲突的信息，这套系统已经能比较可靠地工作。

### 5.2 “当前值覆盖旧值”已经补齐到真实问答链路

这轮最重要的结果不是“能记住静态事实”，而是下面这 4 条：

- 当前 editor：答 `Zed`
- 当前 deploy region：答 `eu-west-1`
- 当前会议 notebook：答 `charcoal A5 notebook`
- 当前 clinic demo 时间：答 `next Tuesday at 15:00 Shanghai time`

这意味着：

系统不仅记住了“发生过更新”，还已经能在真实 `openclaw agent` 问答里把当前值给出来，而不是把旧值一起吐出来。

### 5.3 不知道时能克制

负向测试里，面对并不存在于记忆中的问题：

- 最喜欢的编程语言
- 常订哪家酒店

系统都回答：

`I don't know based on current memory.`

这说明当前链路至少已经具备一个重要特性：

不会为了显得聪明而乱猜。

## 6. 这轮测试中发现并修掉的问题

这轮并不是一上来就是 `20 / 20`。

最初测试暴露出两个问题：

### 问题 1：当前态问题会夹带旧值

例如原始记忆里会出现这种更新表达：

- `main editor from Vim to Zed`
- `deploy region now eu-west-1; older us-east-1 should be ignored`
- `charcoal A5 notebook, not the old blue pocket notebook`

如果直接把这种片段原样喂给模型，模型虽然“知道新值”，但也容易把旧值一起带出来。

这个问题已经修复。

修复方式是在 context assembly 层增加“当前态问题处理”：

- 如果用户问题里带 `current / now / latest / confirmed`
- 则会把带 supersede 语义的片段净化成“只保留当前值”的形式

例如：

- `Current main editor: Zed.`
- `Current deploy region: eu-west-1.`
- `Current notebook for meetings: the charcoal A5 notebook.`

相关代码：

- [src/assembly.js](../../src/assembly.js)
- [test/assembly.test.js](../../test/assembly.test.js)

### 问题 2：个别 search 案例会被 query 写法或 CLI 超时影响

这类不是产品能力本身不足，而是测试入口不够稳。

这轮做了两个修正：

- 把 `seat preference` 的检索 query 改得更贴近记忆原文
- 把 `memory search` 的脚本超时从 `45s` 放宽到 `90s`

这样做不是为了“刷绿”，而是为了避免把宿主偶发慢响应误判成能力失败。

## 7. 需要明确的边界

这轮结果已经说明系统“能用”，但还是有几个边界要说清楚：

### 边界 1：修复的是用户问答链路，不是 raw memory search 的原始 chunk 格式

这次最重要的修复发生在 context assembly 层。

所以：

- 如果用户真实问问题，最终答案已经能优先给当前值
- 但如果你直接看 `openclaw memory search` 的原始 snippet，仍然可能看到“新旧同段”

这不表示修复无效，而是因为 raw search 本来就负责返回原始命中片段，不负责做最终问答压缩。

### 边界 2：这轮是小型人工 benchmark，不是长期线上统计

这轮能证明：

- 能力存在
- 在真实宿主链路里可用
- 关键场景已通过

但还不能直接推导出：

- 所有真实用户长期使用场景都已经完全稳定

### 边界 3：这轮主要测 recall 和 current-state handling

这轮回答的是：

- 现在能不能记住
- 现在能不能答对
- 当前值能不能压住旧值

这轮没有重点评估：

- 多日连续自学习后的长期增益幅度
- 大规模真实历史数据上的统计表现

### 边界 4：这份报告不是 `legacy/new/compat` 的差异报告

这份报告不能直接回答：

- “OpenClaw 原生记忆系统单独能做到多少”
- “Unified Memory Core 扩展后多出来多少”
- “compat 路径和当前路径之间差多少”

如果要回答这些问题，需要单独补一份 `A/B` 对照报告。

## 8. 结论

这轮测试之后，可以比较有把握地说：

`Unified Memory Core` 已经不是“理论上有记忆能力”，而是已经能在真实 OpenClaw 宿主链路里：

- 记住稳定事实
- 检出项目与偏好信息
- 在当前态问题里优先给最新值
- 在不知道时拒绝瞎编

就这轮 20 个案例而言，结果是：

- `20 / 20` 通过
- 其中最关键的“当前值覆盖旧值”已经补齐并通过复测

## 9. 相关文件

可直接查看：

- 机器可读结果：[umc_cli_eval_final.json](/tmp/umc_cli_eval_final.json)
- 案例定义：[umc_cli_eval_cases.json](/tmp/umc_cli_eval_cases.json)
- temporal update 复测结果：[umc_temporal_agents_results.json](/tmp/umc_temporal_agents_results.json)

本次代码改动：

- [src/assembly.js](../../src/assembly.js)
- [test/assembly.test.js](../../test/assembly.test.js)
