# OpenClaw CLI Memory Coverage Review And 200-Case Plan

日期：`2026-04-14`  
范围：收口 development plan `59-64` 里的 coverage review、中文占比规划、正式门禁边界，以及下一轮 `200` case 设计约束

## 1. 当前矩阵真相

当前 benchmark case 总量：`187`

- `memory_search`: `125`
- `agent`: `62`

当前分类分布：

- `profile`: `11`
- `preference`: `32`
- `rule`: `12`
- `project`: `28`
- `cross-source`: `8`
- `supersede`: `6`
- `temporal-current`: `19`
- `temporal-history`: `9`
- `agent-profile`: `6`
- `agent-project`: `14`
- `agent-temporal`: `10`
- `agent-preference`: `10`
- `agent-rule`: `6`
- `agent-history`: `6`
- `agent-zh`: `6`
- `negative`: `4`

当前语言分布：

- 纯中文：`0`
- 中英混合：`6`
- 英文：`181`

## 2. 当前 blind spots

当前问题不是“案例太少”，而是 coverage 还不够均衡。

### 2.1 中文覆盖几乎缺席

- 当前 `187` 条里，纯中文为 `0`
- 只有 `6` 条 mixed prompt
- 这说明现在的 benchmark 仍主要在回答“英文问法下能不能工作”，还没有覆盖真实中文宿主使用

### 2.2 answer-level host path 的覆盖还不够形成正式门禁

- 当前 `agent` case 已有 `62`
- 但 live 子矩阵当前证据仍是 `0/36`
- 这条链路已经暴露成单独红线，不能继续只靠 retrieval-heavy 绿灯来代表“整体可用”

### 2.3 conflict / supersede / cross-source 仍偏轻

- `cross-source`: `8`
- `supersede`: `6`
- `temporal-history`: `9`

这些类别已经存在，但量还不足以支撑“冲突、覆盖、历史 vs 当前”的系统性回归。

### 2.4 negative / abstention 还太薄

- `negative`: `4`

“不知道就别瞎说”已经有基础验证，但目前还不足以覆盖：

- 中文未知问题
- 跨来源噪音干扰下的拒答
- temporal-current 问题里的错误自信

## 3. 下一轮 200-case 设计原则

下一轮不追求把 `187` 机械补到 `200`。

下一轮矩阵必须满足：

1. coverage breadth first，不用“同义改写”硬堆数量
2. 中文案例至少 `50%`
3. answer-level host path 必须继续保留独立矩阵
4. raw transport 继续只作为 watchlist，不混进算法 pass/fail
5. cross-source / supersede / temporal-current / temporal-history / abstention 都要扩成真正的回归面

## 4. 目标矩阵

下一轮目标：至少 `200` case。

建议基线：

- 中文：`100`
- 非中文：`100`

建议按入口分：

- `memory_search`: `120`
- `agent`: `80`

建议按能力分：

| 能力层 | 当前 | 下一轮目标 |
| --- | ---: | ---: |
| 稳定 profile / preference / rule | `55` | `56` |
| project knowledge | `28` | `28` |
| cross-source | `8` | `16` |
| supersede / current-vs-history | `34` | `44` |
| answer-level host path | `62` | `80` |
| abstention / negative | `4` | `12` |

说明：

- 不是每一类都要线性增加
- 重点补的是 blind spots：中文、answer-level、conflict/supersede、negative

## 5. 中文 `50%` 的具体要求

中文比例不是把英文 prompt 翻译一遍就算。

下一轮中文面至少要覆盖：

- 中文 profile 问法
- 中文 preference 问法
- 中文规则题
- 中文项目知识题
- 中文 `current / 现在 / 当前 / 已确认 / 现在应该` 问法
- 中文历史题：`之前 / 原来 / 旧的 / 当时`
- 中英混合 prompt：文件名、tag、region、CLI 名称混排
- 中文未知问题和中文拒答

## 6. 正式门禁怎么收

从下一轮开始，正式门禁必须拆成三张表，而不是继续看一个总分：

### 6.1 Retrieval-heavy benchmark gate

- 继续看 `memory_search` / sqlite-visible retrieval 质量
- 不把 raw transport 故障记成算法回退

### 6.2 Answer-level host gate

- 单独看 live `openclaw agent` 问答结果
- 必须单独报通过率、abstention rate、temporal-current 命中率

### 6.3 Raw transport watchlist

- 继续单独跟踪 raw `openclaw memory search`
- 只回答“宿主 transport 稳不稳”
- 不再回答“算法是不是退化了”

## 7. 与性能专项的关系

`200` case 规划不能脱离主链路 perf baseline。

下一轮 benchmark 扩展时，必须同步观察：

- retrieval / assembly 是否仍是毫秒级快路径
- raw transport 是否继续表现出单独不稳定
- answer-level host path 是否既慢又 abstain

这就是为什么 `59-64` 要把 coverage plan 和 perf baseline 一起收口。

## 8. 从这里往下的执行顺序

完成 `59-64` 后，下一轮执行顺序应该是：

1. 把 `187` case 扩成 coverage-first 的 `200+`
2. 保证中文占比达到 `50%`
3. 把 answer-level red path 作为独立 triage 主线
4. 依据 perf baseline 排定 retrieval / assembly / host answer-level 的优化优先级

