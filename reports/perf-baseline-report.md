# 性能基线报告

日期：2026-04-05  
命令：

```bash
npm run eval:perf -- --timeout-ms 15000
```

## 结论

第一版性能基线已经跑通，但结果很差，当前属于：

- 功能正确性逐步稳定
- 性能严重超预算
- 瓶颈几乎全部集中在 `retrieval`

当前 5 条 perf case：

- `softExceeded = 5/5`
- `hardExceeded = 5/5`
- `averageTotalMs = 25002`

## 各用例结果

| case | totalMs | retrievalMs | scoringMs | assemblyMs | candidates | 结论 |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `food-preference-latency` | 22507 | 22504 | 2 | 1 | 18 | 超 soft / hard |
| `identity-name-latency` | 24529 | 24527 | 1 | 0 | 18 | 超 soft / hard |
| `memory-md-scope-latency` | 25910 | 25909 | 0 | 0 | 0 | 超 soft / hard，且一次 rewritten query 失败 |
| `project-positioning-latency` | 29387 | 29386 | 1 | 0 | 18 | 超 soft / hard |
| `daughter-profile-latency` | 22675 | 22675 | 0 | 0 | 18 | 超 soft / hard |

## 当前判断

### 1. 主要瓶颈不在 scoring / assembly

`scoringMs` 和 `assemblyMs` 基本都在 `0-2ms`，可以忽略。  
当前性能问题几乎完全来自：

- `retrieveMemoryCandidates()`
- 里面的 `openclaw memory search`
- query rewrite 带来的多次搜索 fan-out

### 2. 现在的时延不是偶发抖动，而是结构性偏慢

五条 case 都在 `22s-29s`，说明问题不是单一脏 case，而是当前 retrieval 路径整体偏慢。

### 3. `memory-md-scope` 暴露了另一类风险

这条不仅慢，还出现了 rewritten query 失败，最终 `candidateCount = 0`。  
这说明性能问题和稳定性问题已经开始交织：

- query rewrite 放大了耗时
- 同时也放大了失败面

## 当前最值得继续查的方向

1. 量化 query rewrite 的成本  
2. 判断哪些意图必须走完整 recall，哪些应该优先走 `cardArtifact` 快路径  
3. 给 perf-critical queries 增加“快路径优先”验证  
4. 研究是否要让 perf eval 对 rewrite fan-out 单独打点

## 暂定结论

当前系统已经进入这样一个阶段：

- 正确性开始站住
- 但性能已经成为一等公民问题

后续如果不继续压 retrieval 时延，功能越丰富，体验只会越慢。

## 2026-04-05 第二版：`cardArtifact` 快路径验证

这轮在插件侧新增了一个很克制的快路径：

- 只针对已经有稳定 card 的事实型查询
- 只在 top card 分数足够高时短路
- 不魔改宿主，也不改 `memory_search`
- 只是让插件优先消费自己已经整理好的事实卡片

命令：

```bash
npm run eval:perf -- --timeout-ms 15000
```

第二版结果：

- `softExceeded = 1/5`
- `hardExceeded = 0/5`
- `averageTotalMs = 3091`

### 前后对比

| case | 第一版 totalMs | 第二版 totalMs | 变化 |
| --- | ---: | ---: | --- |
| `food-preference-latency` | 22507 | 13 | 大幅下降 |
| `identity-name-latency` | 24529 | 6 | 大幅下降 |
| `memory-md-scope-latency` | 25910 | 5 | 大幅下降 |
| `project-positioning-latency` | 29387 | 15426 | 仍慢，但已不再超 hard |
| `daughter-profile-latency` | 22675 | 5 | 大幅下降 |

### 当前判断

这次说明性能的主矛盾已经被拆开了：

1. 绝大多数事实型问题，本来就不该走慢的 `memory search + rewrite fan-out`
2. `cardArtifact` 快路径对这类问题是对路的
3. 现在剩下的主要性能缺口，已经收敛到：
   - `project-positioning-latency`
   - 也就是“项目型 card 为什么没有稳定命中快路径”

### 下一步

1. 单独排查 `project-positioning` 为什么没走快路径
2. 视情况扩一层：
   - 项目定位 card 生成质量
   - 项目意图识别
   - 项目类卡片阈值

## 2026-04-05 第三版：项目定位快路径补齐

这轮没有再动宿主检索，而是补齐了项目定位的 stable card 来源：

- 从插件自己的 `README.md`
- 从插件自己的 `project-roadmap.md`

提炼出统一项目定位 card：

`这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。`

然后再次跑：

```bash
npm run eval:perf -- --timeout-ms 15000
```

第三版结果：

- `softExceeded = 0/5`
- `hardExceeded = 0/5`
- `averageTotalMs = 4`

### 各 case 最新结果

| case | totalMs | retrievalMs | scoringMs | assemblyMs |
| --- | ---: | ---: | ---: | ---: |
| `food-preference-latency` | 10 | 7 | 2 | 1 |
| `identity-name-latency` | 3 | 3 | 0 | 0 |
| `memory-md-scope-latency` | 2 | 2 | 0 | 0 |
| `project-positioning-latency` | 2 | 1 | 0 | 0 |
| `daughter-profile-latency` | 2 | 2 | 0 | 0 |

### 当前判断

现在这批 perf-critical facts / rules / project queries，已经全部成功走到插件层的快路径。

这说明：

1. 不魔改宿主，也能把关键查询时延压到毫秒级
2. 真正有效的手段不是继续调 `memory_search` 参数
3. 而是：
   - 让稳定事实长成 `cardArtifact`
   - 让适合的 query 优先消费 card

### 新的阶段结论

对这批关键 query 来说，性能问题已经从“结构性失败”变成“已建立稳定快路径”。
