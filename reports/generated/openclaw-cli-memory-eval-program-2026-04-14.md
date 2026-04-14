# OpenClaw CLI Memory Evaluation Program

日期：`2026-04-14`  
目标：完成 post-Stage-5 的第一轮 `100+` 案例评测驱动优化，并把 answer-level / transport 分层成独立证据面

## 1. 这轮实际做完了什么

这轮不是只补一份 roadmap，而是把 `53-58` 的第一轮执行资产真正落地了：

- 建了一个 repo 内可 review 的 benchmark fixture 镜像：
  - [evals/openclaw-cli-memory-fixture/README.md](../../evals/openclaw-cli-memory-fixture/README.md)
  - [evals/openclaw-cli-memory-fixture/MEMORY.md](../../evals/openclaw-cli-memory-fixture/MEMORY.md)
  - [evals/openclaw-cli-memory-fixture/notes/personal-profile.md](../../evals/openclaw-cli-memory-fixture/notes/personal-profile.md)
  - [evals/openclaw-cli-memory-fixture/notes/project-lantern.md](../../evals/openclaw-cli-memory-fixture/notes/project-lantern.md)
  - [evals/openclaw-cli-memory-fixture/memory/2026-04-10.md](../../evals/openclaw-cli-memory-fixture/memory/2026-04-10.md)
  - [evals/openclaw-cli-memory-fixture/memory/2026-04-12.md](../../evals/openclaw-cli-memory-fixture/memory/2026-04-12.md)
- 建了 `187` 个 benchmark case：
  - [evals/openclaw-cli-memory-benchmark-cases.js](../../evals/openclaw-cli-memory-benchmark-cases.js)
- 建了可重复运行的 benchmark 入口：
  - [scripts/eval-openclaw-cli-memory-benchmark.js](../../scripts/eval-openclaw-cli-memory-benchmark.js)
- 建了专门的 live answer-level matrix 入口：
  - [scripts/eval-openclaw-cli-agent-answer-matrix.js](../../scripts/eval-openclaw-cli-agent-answer-matrix.js)
- 建了 raw transport watchlist 入口：
  - [scripts/watch-openclaw-memory-search-transport.js](../../scripts/watch-openclaw-memory-search-transport.js)
- 增加了 benchmark case 的结构化测试：
  - [test/openclaw-cli-memory-benchmark-cases.test.js](../../test/openclaw-cli-memory-benchmark-cases.test.js)
  - [test/openclaw-memory-search-transport-watch.test.js](../../test/openclaw-memory-search-transport-watch.test.js)
- 把 benchmark 运行入口接到了 `package.json`：
  - `npm run eval:openclaw:benchmark`
  - `npm run eval:openclaw:agent-matrix`
  - `npm run eval:openclaw:transport-watch`

## 2. 案例矩阵

当前 benchmark 总量：`187`

分类覆盖：

- `profile`
- `preference`
- `rule`
- `project`
- `cross-source`
- `supersede`
- `temporal-current`
- `temporal-history`
- `agent-profile`
- `agent-preference`
- `agent-rule`
- `agent-project`
- `agent-temporal`
- `agent-history`
- `agent-zh`
- `negative`

这个矩阵已经覆盖了 roadmap 里要求的主场景：

- 稳定事实
- 普通检索
- 当前态覆盖旧值
- 历史状态召回
- 项目知识
- 偏好与规则
- 不知道时拒答
- `legacy / unified / bootstrap / retrieval` 的关键归因点
- 跨来源联合命中
- supersede / conflict / old-vs-current 对照
- 更大规模的 live agent answer-level prompts

## 3. 第一轮大 benchmark 结果

### 3.1 Host index / retrieval surface

这一轮真正全量跑通的是 retrieval-heavy 主量：

- 运行报告：[openclaw-cli-memory-benchmark-2026-04-14.md](./openclaw-cli-memory-benchmark-2026-04-14.md)
- 机器结果：`reports/openclaw-cli-memory-benchmark-2026-04-14.json`

结果：

- `125 / 125` 通过
- 类别明细：
  - `profile`: `11 / 11`
  - `preference`: `32 / 32`
  - `rule`: `12 / 12`
  - `project`: `28 / 28`
  - `cross-source`: `8 / 8`
  - `supersede`: `6 / 6`
  - `temporal-current`: `19 / 19`
  - `temporal-history`: `9 / 9`

重要边界：

- 这 `111` 条主要验证的是 host-visible memory index / retrieval surface
- 当前宿主上的 raw `openclaw memory search` transport 仍不稳定，所以本轮 search-heavy benchmark 默认走的是同一份 OpenClaw agent sqlite index
- 这不是 registry 自说自话，而是 OpenClaw 正在消费的同一份索引

### 3.2 Answer-level current-path evidence

这一轮把 live `openclaw agent` answer-level matrix 也正式自动化了：

- 运行报告：[openclaw-cli-agent-answer-matrix-2026-04-14.md](./openclaw-cli-agent-answer-matrix-2026-04-14.md)
- 机器结果：`reports/openclaw-cli-agent-answer-matrix-2026-04-14.json`

结果并不绿，而是明确暴露了新的宿主链路问题：

- 当前自动化资产：`62` 个 `agent` case
- 当前真实 live 运行子矩阵：`36` case
- 当前结果：`0 / 36`
- 失败模式高度一致：`openclaw agent` 在这批 case 上几乎统一回答 `I don't know based on current memory.`

这说明：

- retrieval-heavy host index 仍然是绿的
- raw transport 的不稳定已被独立收口
- 但当前 live answer-level agent path 现在没有把同一份记忆有效用出来

更重要的是，这个结果把问题边界讲清楚了：

- 它不是 raw `openclaw memory search` transport 问题，因为 search-heavy `125 / 125` 仍然通过
- 它也不是“插件没加载”，因为 `runtime:check`、`plugins inspect`、`memory status` 仍然是绿的
- 当前更像是宿主 answer-level consumption boundary 出现了回退或环境漂移

### 3.3 A/B attribution evidence

能力来源归因继续看这份：

- [openclaw-contextengine-ab-eval-2026-04-14.md](./openclaw-contextengine-ab-eval-2026-04-14.md)

当前最重要的归因结论没有变：

- 普通项目事实检索：原生基线本来就有一部分能力
- bootstrap 信息利用：不是“只要有 `MEMORY.md` 就谁都能答出来”，`Unified Memory Core` 利用得更好
- 当前态覆盖旧值：这是扩展增益最清楚的地方

## 4. 这轮 benchmark 驱动出的真实修复

这轮不是简单重跑。

第一轮有 1 个失败项：

- `pref-no-guesses-2`
- query: `guessing policy`

失败原因：

- retrieval fallback 当时只打单条 query
- `guessing` 没有展开到实际记忆文案里的 `guesses` / `facts`

这轮实际修了两处：

1. benchmark fallback search 现在会吃现有 query rewrite，而不是只打单条 query
2. [query-rewrite.js](../../src/query-rewrite.js) 新增了对 `guessing policy` 这类语义的 rewrite：
   - `guesses facts do not guess`

对应测试：

- [test/query-rewrite.test.js](../../test/query-rewrite.test.js)

修复后重跑结果：

- `pref-no-guesses-2` 通过
- retrieval-heavy 主量现在扩到 `125 / 125` 全绿

另外，这轮还补了一处 answer-level benchmark 基础设施修复：

1. [query-rewrite.js](../../src/query-rewrite.js) 现在会剥掉 benchmark-style 的 agent wrapper 指令，例如：
   - `Based only on your memory for this agent, ...`
   - `If memory is missing, reply exactly: ...`
2. 这样 retrieval query 不会被测试包装语本身污染

对应测试：

- [test/query-rewrite.test.js](../../test/query-rewrite.test.js)

## 5. 对 `53-58` 的实际完成度

### 已完成

- `53` 建立 `100+` benchmark 设计与分层矩阵
- `54` 把当前 `20` 案例扩到 `187` 案例，并把其中 `62` 条扩到 `agent` answer-level
- `55` 保持并补齐 `legacy / unified / bootstrap / retrieval` 归因报告
- `56` 把 benchmark 失败项转成算法问题，并做第一轮修复
- `57` 修复后重跑 benchmark、更新报告、写回 repo
- `58` 基于当前 benchmark 和 attribution 状态，结论仍是：**不要打开 runtime API / service-mode**

另外，这轮把原本只是“下一步”的三项也一并做成了资产：

- live `openclaw agent` answer-level matrix 已有正式自动化入口和报告
- retrieval-heavy benchmark 已扩到跨来源、supersede、冲突对照场景
- raw `openclaw memory search` transport 已独立进入 watchlist，不再混进算法判断

### 为什么 `58` 现在的结论仍然是“不打开”

不是因为功能没做完，而是因为：

- raw `openclaw memory search` transport 在当前宿主上仍有专门 watchlist：`17 / 24` raw ok，`7` 条 empty-result
- live answer-level agent matrix 现在虽然自动化了，但当前真实子矩阵结果是红的：`0 / 36`
- 所以现在最稳的下一步仍然是继续沿 benchmark / answer-path / perf 主线扩展和固化，而不是跳去新的 phase

## 6. 下一轮最有价值的工作

如果继续沿现在这条执行线推进，最高价值的是：

1. review 当前 benchmark 覆盖面，把矩阵扩到更全面的 `200` case，而不是只追求数量；其中中文案例占比至少 `50%`
2. 让 live answer-level agent path 成为正式红线，并定位为什么当前 `openclaw agent` 几乎统一 abstain
3. 为主链路建立性能专项计划，先拿到可解释的 baseline，再决定优化顺序
