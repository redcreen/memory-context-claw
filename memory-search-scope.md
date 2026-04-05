# Memory Search Scope

## 结论

把 `memory search` 独立成一条工作流，是一个正确决策。

但这里要分两层：

1. **工作流 / 文档 / 案例 / 验证入口独立**
   - 现在就应该做
   - 已经开始做

2. **源码大规模物理拆目录**
   - 现在还不适合一次性大搬家
   - 等接口更稳、边界更清楚后再做

一句话：

`memory search 应该先在“工程视角”独立，再在“文件物理结构”上逐步独立。`

## 当前现状

### 已经独立出来的

- 工作流说明：
  [memory-search-workstream.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-workstream.md)
- 专项案例：
  [memory-search-cases.json](/Users/redcreen/Project/长记忆/context-assembly-claw/evals/memory-search-cases.json)
- Roadmap 主焦点：
  [project-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/project-roadmap.md)
- Todo 主线：
  [investigation-todo.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/investigation-todo.md)

### 还没有物理独立的

核心逻辑目前仍散落在这些源文件里：

- [retrieval.js](/Users/redcreen/Project/长记忆/context-assembly-claw/src/retrieval.js)
- [scoring.js](/Users/redcreen/Project/长记忆/context-assembly-claw/src/scoring.js)
- [query-rewrite.js](/Users/redcreen/Project/长记忆/context-assembly-claw/src/query-rewrite.js)
- [conversation-memory.js](/Users/redcreen/Project/长记忆/context-assembly-claw/src/conversation-memory.js)
- [engine.js](/Users/redcreen/Project/长记忆/context-assembly-claw/src/engine.js)

对应测试也还是分散的：

- [retrieval.test.js](/Users/redcreen/Project/长记忆/context-assembly-claw/test/retrieval.test.js)
- [scoring.test.js](/Users/redcreen/Project/长记忆/context-assembly-claw/test/scoring.test.js)
- [query-rewrite.test.js](/Users/redcreen/Project/长记忆/context-assembly-claw/test/query-rewrite.test.js)
- [conversation-memory.test.js](/Users/redcreen/Project/长记忆/context-assembly-claw/test/conversation-memory.test.js)
- [engine.test.js](/Users/redcreen/Project/长记忆/context-assembly-claw/test/engine.test.js)

## 为什么现在不建议立刻大搬家

### 1. 当前边界还是“工程上清楚，代码上耦合”

`memory search` 相关逻辑现在实际跨了几层：

- recall / retrieval
- scoring
- query rewrite
- card fast path
- session-memory 输入形态
- engine 装配

如果现在一次性把源码全搬进新目录，很容易带来：

- import 大量波动
- 测试路径大面积改动
- 部署风险升高
- 结构“看起来更清楚”，但真实边界还没完全稳定

### 2. 当前最重要的是把根因拆清，不是先追求目录漂亮

现在真正要解决的是：

- 宿主 builtin `memory_search` 的缺口到底在哪
- `session-memory` 文件形态问题
- source competition
- 插件层 retrieval policy 的稳定补强

这几件事先跑稳，比先移动文件更重要。

## 推荐做法

### 阶段 1：先独立“工作流资产”

这一步已经开始：

- 独立文档
- 独立 case 集
- 独立 roadmap/todo 主线
- 独立测试入口说明

### 阶段 2：再独立“targeted 脚本”

当专项 case 再长一批之后，可以加：

- `scripts/eval-memory-search-cases.js`
- `reports/memory-search-*.md`

这一步风险低，收益高。

### 阶段 3：最后再独立“源码目录”

等边界更稳定后，再考虑把这些抽成：

- `src/memory-search/retrieval.js`
- `src/memory-search/scoring.js`
- `src/memory-search/query-rewrite.js`
- `src/memory-search/card-fast-path.js`

以及对应：

- `test/memory-search/*.test.js`

## 当前判断

### 是正确决策的部分

- 把 `memory search` 当成独立主线
- 把案例和工作流独立出来
- 在 roadmap / todo / testsuite 里单列

### 还不该立刻做的部分

- 大规模搬源码
- 为了“看起来整洁”提前拆目录

## 当前建议

现在先保持：

- **工作流独立**
- **源码暂不大搬**
- **下一步先补 targeted memory-search 脚本**

等 memory-search 的根源实验再跑一轮，边界更稳定后，再做物理目录拆分。
