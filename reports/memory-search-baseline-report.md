# Memory Search Baseline Report

## 目的

这份报告记录 `Memory Search Workstream / Phase A` 的第一轮完整 baseline。

目标不是“马上修好 builtin memory_search”，而是先把现状拆清楚：

- 宿主 builtin `memory_search` 现在到底卡在哪
- 插件层已经补强到什么程度
- 哪些问题是 source competition
- 哪些问题是中文短词 / 文件形态 / 意图匹配问题

---

## 运行方式

命令：

```bash
npm run eval:memory-search:cases -- --format json
```

专项 case 集：

- [memory-search-cases.json](../evals/memory-search-cases.json)

---

## 总体结果

### Summary

- `cases = 6`
- `builtinSignalHits = 4`
- `builtinSourceHits = 0`
- `pluginSignalHits = 4`
- `pluginSourceHits = 5`
- `pluginFastPathLikely = 5`

### 一句话结论

- builtin `memory_search` 在这批 case 上，**几乎从不把期望 source 排到前面**
- 插件层已经能在大多数关键 case 上，把结果重新拉回 `cardArtifact / formal / stable fact`
- 当前 `memory search` 的主问题，已经可以明确描述为：
  - **source competition**
  - **session-memory 形态不利于检索**
  - **中文短词 / 短 query 天生更脆弱**

---

## 结果表

| Case | Builtin Signal | Builtin Source | Plugin Signal | Plugin Source | Fast Path | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| `food-preference-recall` | ✅ | ❌ | ❌ | ✅ | ✅ | builtin 能碰到 `牛排`，但 source 仍被 `sessions` 占满；插件能稳定拉回 `MEMORY.md/cardArtifact` |
| `identity-name-recall` | ✅ | ❌ | ✅ | ✅ | ✅ | 身份类 case 已经明显由插件层兜住 |
| `short-chinese-token` | ❌ | ❌ | ❌ | ✅ | ❌ | 中文短词 query 是 builtin 的真实薄弱点；插件也还没完全兜住 signal |
| `session-memory-source-competition` | ✅ | ❌ | ✅ | ❌ | ✅ | builtin source competition 非常明显；插件能兜住事实，但 source 仍走 `MEMORY.md/cardArtifact`，不是原始 `memory/%` |
| `rule-formal-memory-priority` | ✅ | ❌ | ✅ | ✅ | ✅ | 规则类 query 上，formal-first 已被插件层明显拉正 |
| `project-positioning-priority` | ❌ | ❌ | ✅ | ✅ | ✅ | 项目定位类 query 已能稳定走 card fast path，builtin 几乎无帮助 |

---

## 分 case 说明

## 1. `food-preference-recall`

查询：

```text
我爱吃什么
```

现象：

- builtin `expectedSignalsHit = true`
- 但 `expectedSourceHit = false`
- top sources:
  - `sessions = 19`
  - `memory = 1`

插件层：

- top1 已经变成：
  - `MEMORY.md`
  - `source = cardArtifact`
  - `snippet = 你爱吃牛排`

结论：

- 宿主层不是完全看不到 `牛排`
- 真正问题是：**source priority 完全不对**
- 插件层已经能把事实重新提到前面

---

## 2. `identity-name-recall`

查询：

```text
你怎么称呼我
```

现象：

- builtin 仍然是 `sessions = 19 / memory = 1`
- 期望 source 没被排前

插件层：

- top1:
  - `MEMORY.md`
  - `source = cardArtifact`
  - `snippet = 你叫刘超，我平时记你是超哥`

结论：

- 身份类 query 已经被插件层稳定兜住
- 这是一个“builtin 弱，plugin 强”的明确样本

---

## 3. `short-chinese-token`

查询：

```text
牛排 刘超
```

现象：

- builtin `expectedSignalsHit = false`
- builtin `expectedSourceHit = false`
- top results 大量是无关 `sessions`

插件层：

- `expectedSourceHit = true`
- 但 `expectedSignalsHit = false`
- top1 仍然更偏身份 card：`你叫刘超，我平时记你是超哥`

结论：

- 这是当前最干净的“中文短词 / 短 query 脆弱点”样本
- 不只是 builtin 弱，插件层也还没有完全把这类 query 分类好

---

## 4. `session-memory-source-competition`

查询：

```text
用户爱吃什么 饮食 喜欢吃 刘超 超哥
```

现象：

- builtin `expectedSignalsHit = true`
- builtin `expectedSourceHit = false`
- top1 甚至命中了项目里的 `memory-search-param-eval.md`
- `memory/%` 并没有真正排到前面

插件层：

- top1 已经是：
  - `MEMORY.md`
  - `source = cardArtifact`
  - `snippet = 你爱吃牛排`

结论：

- 当前不是“memory/% 完全不可见”
- 而是：
  - source competition 太强
  - `sessions/%` 和项目文档很容易把 `memory/%` 挤掉
- 插件层能拉回事实，但并没有让原始 `memory/%` 成为获胜 source

---

## 5. `rule-formal-memory-priority`

查询：

```text
MEMORY.md 应该放什么内容
```

现象：

- builtin `expectedSignalsHit = true`
- 但前排几乎还是全是 `sessions`

插件层：

- top1:
  - `formal-memory-policy.md`
  - `source = cardArtifact`
  - `snippet = MEMORY.md 应该放的是长期稳定、会被反复复用的内容。`

结论：

- 规则类 query 上，plugin 的 `formal-first` 已经明显优于裸 builtin search
- 这是后续 retrieval policy 可以继续放大的方向

---

## 6. `project-positioning-priority`

查询：

```text
这个项目主要解决什么问题
```

现象：

- builtin `expectedSignalsHit = false`
- builtin `expectedSourceHit = false`
- top results 基本无关

插件层：

- top1:
  - `README.md`
  - `source = cardArtifact`
  - `snippet = 这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。`

结论：

- 项目定位类 query 已经高度依赖 stable project card
- builtin 层当前几乎帮不上忙

---

## 根因分组

### A. Source Competition

表现：

- `builtinSourceHits = 0`
- `sessions/%` 长期占满前排
- `memory/%` 与正式文档很难在 builtin 层胜出

对应 case：

- `food-preference-recall`
- `identity-name-recall`
- `session-memory-source-competition`
- `rule-formal-memory-priority`

### B. 中文短词 / 短 Query 脆弱点

表现：

- `牛排 刘超` 这种 query 上，signal 与 source 都不稳

对应 case：

- `short-chinese-token`

### C. Project / Formal / Stable Card 明显优于裸检索

表现：

- 只要插件层有稳定 card，结果就明显更好

对应 case：

- `rule-formal-memory-priority`
- `project-positioning-priority`

---

## Phase A 结论

`Phase A` 到这里可以算完成，因为它已经达成了最关键的目标：

1. 不再用单个“牛排”案例口头讨论问题
2. 有完整专项 case 集
3. 有统一执行入口
4. 有 builtin vs plugin 的并排 baseline
5. 能明确说出问题主要卡在哪几层

当前最重要的收口结论是：

**builtin `memory_search` 的主问题不是“完全搜不到”，而是“source priority 极差，且对中文短 query / session-memory 形态很脆弱”。**

---

## Phase B 输入

下一阶段最值得继续做的，不是马上大改，而是：

1. 把 `short-chinese-token` 这类 query 再拆细
2. 把 source competition 的分布报告化
3. 明确哪些 query：
   - 应该继续走 fast path
   - 应该 search-first
   - 应该 formal-first
4. 开始设计 retrieval policy 的更清晰边界
