# OpenClaw CLI Memory Evaluation Program

日期：`2026-04-14`  
目标：完成 post-Stage-5 的第一轮 `100+` 案例评测驱动优化

## 1. 这轮实际做完了什么

这轮不是只补一份 roadmap，而是把 `53-58` 的第一轮执行资产真正落地了：

- 建了一个 repo 内可 review 的 benchmark fixture 镜像：
  - [evals/openclaw-cli-memory-fixture/README.md](../../evals/openclaw-cli-memory-fixture/README.md)
  - [evals/openclaw-cli-memory-fixture/MEMORY.md](../../evals/openclaw-cli-memory-fixture/MEMORY.md)
  - [evals/openclaw-cli-memory-fixture/notes/personal-profile.md](../../evals/openclaw-cli-memory-fixture/notes/personal-profile.md)
  - [evals/openclaw-cli-memory-fixture/notes/project-lantern.md](../../evals/openclaw-cli-memory-fixture/notes/project-lantern.md)
  - [evals/openclaw-cli-memory-fixture/memory/2026-04-10.md](../../evals/openclaw-cli-memory-fixture/memory/2026-04-10.md)
  - [evals/openclaw-cli-memory-fixture/memory/2026-04-12.md](../../evals/openclaw-cli-memory-fixture/memory/2026-04-12.md)
- 建了 `129` 个 benchmark case：
  - [evals/openclaw-cli-memory-benchmark-cases.js](../../evals/openclaw-cli-memory-benchmark-cases.js)
- 建了可重复运行的 benchmark 入口：
  - [scripts/eval-openclaw-cli-memory-benchmark.js](../../scripts/eval-openclaw-cli-memory-benchmark.js)
- 增加了 benchmark case 的结构化测试：
  - [test/openclaw-cli-memory-benchmark-cases.test.js](../../test/openclaw-cli-memory-benchmark-cases.test.js)
- 把 benchmark 运行入口接到了 `package.json`：
  - `npm run eval:openclaw:benchmark`

## 2. 案例矩阵

当前 benchmark 总量：`129`

分类覆盖：

- `profile`
- `preference`
- `rule`
- `project`
- `temporal-current`
- `temporal-history`
- `agent-profile`
- `agent-project`
- `agent-temporal`
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

## 3. 第一轮大 benchmark 结果

### 3.1 Host index / retrieval surface

这一轮真正全量跑通的是 retrieval-heavy 主量：

- 运行报告：[openclaw-cli-memory-benchmark-2026-04-14.md](./openclaw-cli-memory-benchmark-2026-04-14.md)
- 机器结果：`reports/openclaw-cli-memory-benchmark-2026-04-14.json`

结果：

- `111 / 111` 通过
- 类别明细：
  - `profile`: `11 / 11`
  - `preference`: `32 / 32`
  - `rule`: `12 / 12`
  - `project`: `28 / 28`
  - `temporal-current`: `19 / 19`
  - `temporal-history`: `9 / 9`

重要边界：

- 这 `111` 条主要验证的是 host-visible memory index / retrieval surface
- 当前宿主上的 raw `openclaw memory search` transport 仍不稳定，所以本轮 search-heavy benchmark 默认走的是同一份 OpenClaw agent sqlite index
- 这不是 registry 自说自话，而是 OpenClaw 正在消费的同一份索引

### 3.2 Answer-level current-path evidence

answer-level 的 live OpenClaw CLI 证据，当前仍主要来自前一轮已经完成的真实 `openclaw agent` 评测：

- [openclaw-cli-memory-eval-2026-04-13.md](./openclaw-cli-memory-eval-2026-04-13.md)

这部分结果仍然成立：

- 当前 production path：`20 / 20`
- 当前态问题：
  - editor -> `Zed`
  - deploy region -> `eu-west-1`
  - notebook -> `charcoal A5 notebook`
  - clinic demo -> `next Tuesday at 15:00 Shanghai time`
- 负向问题：
  - 不知道时返回 `I don't know based on current memory.`

### 3.3 A/B attribution evidence

能力来源归因继续看这份：

- [openclaw-contextengine-ab-eval-2026-04-14.md](./openclaw-contextengine-ab-eval-2026-04-14.md)

当前最重要的归因结论没有变：

- 普通项目事实检索：原生基线本来就有一部分能力
- bootstrap 信息利用：不是“只要有 `MEMORY.md` 就谁都能答出来”，`Unified Memory Core` 利用得更好
- 当前态覆盖旧值：这是扩展增益最清楚的地方

## 4. 这轮 benchmark 驱动出的真实修复

这轮不是 `111 / 111` 一次跑过。

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
- `111 / 111` 全绿

## 5. 对 `53-58` 的实际完成度

### 已完成

- `53` 建立 `100+` benchmark 设计与分层矩阵
- `54` 把当前 `20` 案例扩到 `129` 案例
- `55` 保持并补齐 `legacy / unified / bootstrap / retrieval` 归因报告
- `56` 把 benchmark 失败项转成算法问题，并做第一轮修复
- `57` 修复后重跑 benchmark、更新报告、写回 repo
- `58` 基于当前 benchmark 和 attribution 状态，结论仍是：**不要打开 runtime API / service-mode**

### 为什么 `58` 现在的结论仍然是“不打开”

不是因为功能没做完，而是因为：

- raw `openclaw memory search` transport 在当前宿主上仍不稳定
- answer-level live agent matrix 还没有自动化扩成与 `129` case 同规模
- 所以现在最稳的下一步仍然是继续沿 benchmark 主线扩展和固化，而不是跳去新的 phase

## 6. 下一轮最有价值的工作

如果继续沿现在这条执行线推进，最高价值的是：

1. 把 live `openclaw agent` answer-level matrix 自动化扩到更大规模，而不是只保留 20-case current-path + 关键 A/B
2. 继续把 retrieval-heavy benchmark 从 host index 扩到更多跨来源、冲突和 supersede 场景
3. 把 transport instability 本身纳入专门 watchlist，不让 raw `openclaw memory search` 的宿主问题继续污染算法判断
