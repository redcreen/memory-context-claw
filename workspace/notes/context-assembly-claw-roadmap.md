# Context Assembly Claw 项目 Roadmap

## 一句话定位

这是一个面向 OpenClaw 的 `context engine` 插件。

它不替代 OpenClaw 已有的长期记忆能力，而是在长期记忆已经可用的前提下，专门解决另一层问题：

- 召回哪些内容
- 怎样把召回内容重排
- 怎样把最合适的内容装进当前上下文

一句话可以概括为：

`让 OpenClaw 的长期记忆，更稳定地变成当前轮真正可用的上下文。`

## 项目要解决的问题

OpenClaw 已经有长期记忆和 `memory search`，但真实使用时还会遇到这些问题：

- 能搜到，不等于每轮都能拿到最合适的内容
- 候选太多时，哪些内容应该先进上下文并不稳定
- 长期规则、近期过程、专题资料，优先级不一样
- 用户问法变化时，单次召回不一定稳
- 工程文件、插件文档之类的噪音内容，可能混进召回结果

这个项目的目标，就是在 OpenClaw 原生能力之上，加一层面向上下文组装的编排逻辑。

## 建议定位

我建议 GitHub 上把它定位成：

`An OpenClaw context-engine plugin for memory-first context assembly.`

中文可以写成：

`一个面向 OpenClaw 的长期记忆上下文组装插件。`

再具体一点的产品定位可以是：

- 面向已经启用 OpenClaw Memory 的用户
- 优化长期记忆到当前上下文的转化效率
- 支持规则重排、查询改写、可选 LLM rerank、路径过滤和评测

## 建议名字

### 第一推荐

`context-assembly-claw`

优点：

- 已经和当前实现一致
- 明确表达“上下文组装”
- 保留 OpenClaw 生态里的命名熟悉感

适合场景：

- 作为实际 GitHub 仓库名
- 作为插件名继续沿用

### 第二推荐

`memory-assembly-claw`

优点：

- 更强调“从长期记忆到上下文”
- 对第一次看到项目的人更容易理解

缺点：

- 会弱化它是 `context engine` 这一点

### 第三推荐

`claw-context-router`

优点：

- 更像编排器 / 路由器
- 适合以后往更复杂的上下文策略扩展

缺点：

- 不如 `context-assembly-claw` 直白

## 我的推荐结论

如果你准备马上在 GitHub 上创建项目，我建议：

- 仓库名：`context-assembly-claw`
- 副标题：`Memory-first context assembly for OpenClaw`

这是目前最稳、最贴合现状、也最容易延续的命名。

## 当前已经做完的事情

### 1. 插件骨架已经完成

已经做成可安装的 OpenClaw 插件，能挂到 `contextEngine` slot。

已具备：

- 插件入口
- 配置 schema
- OpenClaw 插件化加载

### 2. 第一阶段召回与重排已经完成

已经打通：

- 基于 `openclaw memory search --json` 的候选召回
- 规则重排
- 路径多样性控制
- token 预算控制
- 最终 `systemPromptAddition` 组装

### 3. 第二阶段 LLM rerank 已完成基础实现

已经支持：

- 可选开启第二阶段 LLM rerank
- 使用 `gpt-5.4` 作为 rerank 模型
- 候选截断
- 明显领先时自动跳过二阶段，减少延迟

### 4. 查询改写召回已经接入

已经支持规则版查询改写：

- 原始问题
- 意图增强版
- 对比表达版
- 关键词压缩版

然后将多路召回结果做融合、去重和排序。

### 5. 召回噪音治理已经完成

已经加入 `excludePaths` 机制，默认过滤：

- 插件自身目录
- `openclaw-task-system`
- `node_modules`
- `.git`

这样工程文件不会轻易进入用户上下文。

### 6. 本地 embedding 稳定性方案已跑通

在 Apple Silicon 本地 embedding 场景下，已经落地了更稳定的运行策略：

- 避免把策略写进 `~/.zshrc`
- 用服务级方式处理 `node-llama-cpp` 的 CPU-safe 运行
- 保留本地长期记忆能力，同时尽量避免 gateway 因 Metal 路径崩溃

### 7. 自动化测试与验证闭环已建立

目前已经有：

- 单元测试
- 集成测试
- 黄金样本评测
- compare / smoke 验证
- 一键 `verify`

当前状态下，自动化验证已经能覆盖：

- 规则重排
- 二阶段 rerank 触发与跳过
- 查询改写
- 路径过滤
- 配置 preset
- runtime 治理

## 当前项目状态

可以认为已经到了：

`可用的 alpha / 早期 beta 状态`

它已经不是概念验证，而是一个能安装、能运行、能验证的 OpenClaw 插件。

但它还没有完全到“开箱即用的大众发布版”。

## 接下来要做什么

### Phase 1：发布前整理

目标：让它更像一个可以公开放上 GitHub 的项目。

要做的事：

- 补 GitHub 首页 README
- 补 LICENSE
- 补发布说明和安装示例
- 清理只对本机有意义的说明
- 整理更简洁的默认配置示例

### Phase 2：性能治理

目标：让查询改写和多轮 recall 的成本更可控。

要做的事：

- 给查询改写加速度档位
- 控制默认改写数量
- 优化 `memory search` 的调用次数
- 尝试减少 CLI 调用开销
- 评估是否能从 CLI 方式切到更直接的内部调用

### Phase 3：效果评测升级

目标：从“能跑”走向“可量化优化”。

要做的事：

- 扩大黄金样本数据集
- 增加第一阶段 vs 第二阶段的对比评测
- 增加查询改写前后对比
- 记录更贴近真实使用的 Precision / MRR / nDCG 变化

### Phase 4：更强的查询改写

目标：让不同表达方式下的召回更稳。

要做的事：

- 从规则版改写升级到“规则 + 可选 LLM 改写”
- 根据问题类型选择不同改写策略
- 对比类问题、解释类问题、操作类问题分别优化

### Phase 5：更强的二阶段编排

目标：让进入上下文的内容更精准。

要做的事：

- 更细的候选去重
- 基于文档层级的分桶选取
- 更好的近期记忆与长期记忆平衡
- 更明确的 token budget 分配

### Phase 6：公开发布

目标：让别人可以按 OpenClaw 插件的习惯安装使用。

要做的事：

- 统一对外文档
- 统一默认配置
- 提供最小安装流程
- 给出常见场景示例
- 准备 issue 模板和 roadmap 公开版

## 推荐的 GitHub 项目描述

你可以直接用下面这一版：

`Memory-first context assembly for OpenClaw. Improve long-memory recall, reranking, query rewrite, and context packing without replacing OpenClaw's built-in memory.`

如果想更短一点，可以用：

`An OpenClaw context-engine plugin for better long-memory context assembly.`

## 推荐的中文项目描述

可以写成：

`一个面向 OpenClaw 的上下文组装插件，在不替代内置长期记忆的前提下，优化记忆召回、重排、查询改写与上下文装配。`

## 近期最优先事项

如果只看接下来最该做的 3 件事，我建议是：

1. 整理 GitHub 首页 README 和公开定位
2. 给查询改写加速度档位，降低默认延迟
3. 扩大 eval 数据集，做二阶段 rerank 的前后对比评测

## 当前一句话总结

这个项目已经完成了“从长期记忆到上下文组装”的主干能力，下一步重点不再是从零到一，而是：

`把它打磨成一个可发布、可解释、可度量、可扩展的 OpenClaw 插件。`
