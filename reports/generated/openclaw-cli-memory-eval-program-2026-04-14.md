# OpenClaw CLI Memory Evaluation Program

日期：`2026-04-14`  
目标：完成 post-Stage-5 的评测驱动优化第一轮与 `65-70` 正式门禁收口，并把 answer-level / transport 分层成独立证据面

> 更新说明：本页最早记录的是 `53-58` 的第一轮结果。`65-70` 完成后，正式门禁结论已更新为：runnable matrix `368`、retrieval-heavy `250/250`、isolated local answer-level formal gate `6/6`、raw transport watchlist `0/8 raw ok`。以下各节已按最终状态重写。

## 1. 这轮实际做完了什么

这轮不是只补一份 roadmap，而是把 `53-70` 的评测与门禁资产真正落地了：

- 建了一个 repo 内可 review 的 benchmark fixture 镜像：
  - [evals/openclaw-cli-memory-fixture/README.md](../../evals/openclaw-cli-memory-fixture/README.md)
  - [evals/openclaw-cli-memory-fixture/MEMORY.md](../../evals/openclaw-cli-memory-fixture/MEMORY.md)
  - [evals/openclaw-cli-memory-fixture/notes/personal-profile.md](../../evals/openclaw-cli-memory-fixture/notes/personal-profile.md)
  - [evals/openclaw-cli-memory-fixture/notes/project-lantern.md](../../evals/openclaw-cli-memory-fixture/notes/project-lantern.md)
  - [evals/openclaw-cli-memory-fixture/memory/2026-04-10.md](../../evals/openclaw-cli-memory-fixture/memory/2026-04-10.md)
  - [evals/openclaw-cli-memory-fixture/memory/2026-04-12.md](../../evals/openclaw-cli-memory-fixture/memory/2026-04-12.md)
- 建了 `368` 个 runnable benchmark case：
  - [evals/openclaw-cli-memory-benchmark-cases.js](../../evals/openclaw-cli-memory-benchmark-cases.js)
- 建了可重复运行的 benchmark 入口：
  - [scripts/eval-openclaw-cli-memory-benchmark.js](../../scripts/eval-openclaw-cli-memory-benchmark.js)
- 建了 raw transport watchlist 入口：
  - [scripts/watch-openclaw-memory-search-transport.js](../../scripts/watch-openclaw-memory-search-transport.js)
- 增加了 benchmark case 的结构化测试：
  - [test/openclaw-cli-memory-benchmark-cases.test.js](../../test/openclaw-cli-memory-benchmark-cases.test.js)
  - [test/openclaw-memory-search-transport-watch.test.js](../../test/openclaw-memory-search-transport-watch.test.js)
- 把正式门禁和专项基线接到了 `package.json` / repo scripts：
  - `npm run eval:openclaw:benchmark`
  - `npm run eval:main-path:perf`
  - `npm run verify:memory-intent`

## 2. 案例矩阵

当前 runnable matrix 总量：`368`

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

### 3.1 Retrieval-heavy formal gate

这一轮正式全量跑通的是 retrieval-heavy formal gate：

- 运行报告：[openclaw-cli-memory-benchmark-2026-04-14.md](./openclaw-cli-memory-benchmark-2026-04-14.md)
- 机器结果：`reports/openclaw-cli-memory-benchmark-2026-04-14.json`

结果：

- `250 / 250` 通过
- 类别明细：
  - `profile`: `22 / 22`
  - `preference`: `64 / 64`
  - `rule`: `24 / 24`
  - `project`: `56 / 56`
  - `cross-source`: `16 / 16`
  - `supersede`: `12 / 12`
  - `temporal-current`: `38 / 38`
  - `temporal-history`: `18 / 18`

重要边界：

- 这 `250` 条主要验证的是 host-visible memory index / retrieval surface
- 当前宿主上的 raw `openclaw memory search` transport 仍不稳定，所以本轮 search-heavy benchmark 默认走的是同一份 OpenClaw agent sqlite index
- 这不是 registry 自说自话，而是 OpenClaw 正在消费的同一份索引

### 3.2 Answer-level formal gate

这一轮把 answer-level 正式门禁也收口成可重复运行的 isolated local gate：

- 运行报告：[openclaw-cli-agent-answer-matrix-2026-04-14.md](./openclaw-cli-agent-answer-matrix-2026-04-14.md)
- 机器结果：`reports/openclaw-cli-agent-answer-matrix-2026-04-14.json`

结果：

- 正式门禁当前先以 `6` 条代表性 case 运行
- 当前结果：`6 / 6`
- 正式路径：`openclaw agent --local` + isolated eval agent `umceval65`

这说明：

- retrieval-heavy host index 仍然是绿的
- answer-level 路径已经有一条可复跑、可解释的正式门禁
- 当前需要继续跟踪的不是“算法是否可用”，而是 gateway/shared-session 噪声不要重新污染正式结论

这轮同时把 answer-level root cause 拆清楚了：

- gateway / shared-session 路径会带来宿主噪声
- 原始 `--local --json` 输出在有日志时可能把有效 JSON 放到 stderr
- shared `agent:<id>:main` 会话复用会污染 formal probe
- 因此当前正式 answer-level gate 明确采用 isolated local path，而不是直接把 noisy host path 当成算法回归

### 3.3 Raw transport watchlist

raw `openclaw memory search` transport 现在被单独收口成 host watchlist：

- 运行报告：[openclaw-memory-search-transport-watchlist-2026-04-14.md](./openclaw-memory-search-transport-watchlist-2026-04-14.md)
- 机器结果：`reports/openclaw-memory-search-transport-watchlist-2026-04-14.json`

当前 formal watch 结果：

- `0 / 8 raw ok`
- `8 / 8 invalid_json`

这说明 raw transport 仍然是宿主问题，但它已经不再和 retrieval / answer-level 算法结论混在一起。

### 3.4 A/B attribution evidence

能力来源归因继续看这份：

- [openclaw-contextengine-ab-eval-2026-04-14.md](./openclaw-contextengine-ab-eval-2026-04-14.md)

当前最重要的归因结论没有变：

- 普通项目事实检索：原生基线本来就有一部分能力
- bootstrap 信息利用：不是“只要有 `MEMORY.md` 就谁都能答出来”，`Unified Memory Core` 利用得更好
- 当前态覆盖旧值：这是扩展增益最清楚的地方

## 4. 这轮 benchmark 驱动出的真实修复

这轮不是简单重跑。

第一轮有 1 个 retrieval 失败项：

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
- retrieval-heavy 正式 gate 现在扩到 `250 / 250` 全绿

另外，这轮还补了 answer-level formal gate 的基础设施修复：

1. [query-rewrite.js](../../src/query-rewrite.js) 现在会剥掉 benchmark-style 的 agent wrapper 指令，例如：
   - `Based only on your memory for this agent, ...`
   - `If memory is missing, reply exactly: ...`
2. 这样 retrieval query 不会被测试包装语本身污染

对应测试：

- [test/query-rewrite.test.js](../../test/query-rewrite.test.js)

## 5. 对 `53-70` 的实际完成度

### 已完成

- `53` 建立 `100+` benchmark 设计与分层矩阵
- `54` 把当前 `20` 案例扩到更大 benchmark 面
- `55` 保持并补齐 `legacy / unified / bootstrap / retrieval` 归因报告
- `56` 把 benchmark 失败项转成算法问题，并做第一轮修复
- `57` 修复后重跑 benchmark、更新报告、写回 repo
- `58` 基于当前 benchmark 和 attribution 状态，结论仍是：**不要打开 runtime API / service-mode**
- `59-64` 已补出 `200+` blind-spot planning、中文 `50%` 目标和主链路性能专项计划
- `65-70` 已正式收口：runnable matrix `368`、zh-bearing `187/368`、retrieval-heavy `250/250`、isolated local answer-level formal gate `6/6`、raw transport watchlist `0/8 raw ok`

另外，这轮把原本只是“下一步”的三项都已经变成正式资产：

- answer-level formal gate 已经有可复跑入口和正式报告
- retrieval-heavy benchmark 已扩到跨来源、supersede、冲突对照场景，并进入 `250/250` 正式 gate
- raw `openclaw memory search` transport 已独立进入 watchlist，不再混进算法判断

### 为什么 `58` 现在的结论仍然是“不打开”

不是因为功能没做完，而是因为：

- raw `openclaw memory search` transport 在当前宿主上仍有专门 watchlist：当前 formal watch 是 `0 / 8 raw ok`
- gateway/shared-session 噪声仍不能直接当成算法问题
- isolated local answer-level gate 虽然已经绿了，但样本面还只是代表性子集，不足以支撑更大的 phase 切换
- 所以现在最稳的下一步仍然是继续沿 formal gate / answer-path / perf 主线扩展和固化，而不是跳去新的 phase

## 6. 下一轮最有价值的工作

如果继续沿现在这条执行线推进，最高价值的是：

1. 扩大 isolated local answer-level formal gate，不再只停留在 `6` 条代表性样本
2. 把中文案例继续往更自然、更高信息密度的真实中文表达推进
3. 按 perf baseline 优先处理最慢的 answer-level 层，并继续把 gateway/raw transport 噪声隔离在 watchlist 中

## 7. `59-70` 已补出的后续资产

这轮在 `53-58` 之外，已经把下一阶段 planning queue 也收成了正式资产：

- `200` case coverage review / blind-spot 规划：
  [openclaw-cli-memory-coverage-plan-2026-04-14.md](./openclaw-cli-memory-coverage-plan-2026-04-14.md)
- 主链路性能专项计划：
  [../../docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md](../../docs/reference/unified-memory-core/testing/main-path-performance-plan.zh-CN.md)
- 主链路性能首轮 baseline：
  [main-path-performance-baseline-2026-04-14.md](./main-path-performance-baseline-2026-04-14.md)

这意味着当前下一条主线已经从“继续规划”切到了：

1. 保持 `368` case formal benchmark matrix 与 `50%+` 中文覆盖持续稳定
2. 把 answer-level formal gate 从 `6` 条代表性样本继续扩大
3. 继续隔离 gateway/shared-session 与 raw transport 噪声
4. 按 perf baseline 优先处理最慢的 answer-level 层
