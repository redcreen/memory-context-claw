# Memory Context Claw

[English](#english) | [中文](#中文)

Memory-first context assembly and reranking for OpenClaw.

面向 OpenClaw 的长期记忆上下文组装与重排插件。

## English

### Overview

`memory-context-claw` is an OpenClaw `context engine` plugin. It does not
replace OpenClaw's built-in long memory. Instead, it improves the layer between
long-memory retrieval and the final prompt the model actually sees.

The project exists for one reason:

`turn long memory into better working context`

### Why This Project Exists

OpenClaw already has long memory and memory search. But real usage quickly runs
into a second problem:

- finding something is not the same as selecting the best context
- long-term rules, recent notes, and topic documents should not have equal weight
- different phrasings of the same question can lead to unstable recall
- engineering files and plugin docs can pollute results when the workspace is broad

This plugin is designed to solve that layer.

### What It Does

Current capabilities include:

- recall through `openclaw memory search --json`
- structure-aware heuristic reranking for `MEMORY.md`, `memory/`, and workspace docs
- optional second-stage LLM rerank
- token-budget-aware context packing
- query rewrite recall for more stable retrieval across phrasing differences
- post-retrieval path filtering to keep engineering noise out of user-facing context
- validation tooling for tests, smoke checks, and golden-case evaluation

### Project Status

Current status:

`usable alpha / early beta`

The project is beyond proof-of-concept. It is installable, testable, and
already useful in real usage, but it is not yet a fully polished public
release.

### Architecture

Current pipeline:

1. Recall memory candidates from the current OpenClaw agent memory index.
2. Rewrite the query into a few nearby retrieval variants when useful.
3. Filter noisy paths such as plugin repos or engineering directories.
4. Rerank with heuristics tuned for long-term rules, daily notes, and topic docs.
5. Optionally rerank top candidates again with an LLM.
6. Pack final snippets into `systemPromptAddition`.

### Installation

Install it like a normal OpenClaw plugin:

```bash
openclaw plugins install -l .
```

Then configure it as the active `contextEngine` in `~/.openclaw/openclaw.json`.

For a safer local workflow, keep development and runtime separate:

```bash
npm run deploy:local
```

This copies the current repo into `~/.openclaw/extensions/memory-context-claw`, so editing the repo does not immediately change the live OpenClaw plugin.

Minimal example:

```json5
{
  plugins: {
    allow: ["memory-context-claw"],
    load: {
      paths: ["/ABSOLUTE/PATH/TO/memory-context-claw"]
    },
    slots: {
      contextEngine: "memory-context-claw"
    },
    entries: {
      "memory-context-claw": {
        enabled: true
      }
    }
  }
}
```

Templates:

- [openclaw.context-assembly.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.llm-rerank.example.json)

Configuration details:

- [configuration.md](/Users/redcreen/Project/长记忆/context-assembly-claw/configuration.md)

### Normal Usage

After installation, users should not need special plugin commands.

Normal flow:

- keep stable rules in `MEMORY.md`
- keep daily notes in `memory/*.md`
- keep topic docs in the workspace
- keep chatting with OpenClaw

### Validation

OpenClaw-native checks:

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "your test query"
```

Maintainer checks:

```bash
npm test
npm run eval
npm run eval:hot
npm run eval:hot:critical
npm run eval:toggle
npm run memory:distill
npm run smoke:compare -- "Lossless plugin vs long memory"
npm run verify
```

`npm run eval:hot` runs live questions against the real `main` agent. It
reports both content quality and source checks when configured, but the default
pass/fail focuses on answer quality to keep the suite stable across normal
answer phrasing differences.

`npm run eval:hot:critical` is the lighter hot-session regression path for the two
most important user-fact cases right now:

- `我爱吃什么？`
- `你怎么称呼我？`

Important caveat:

`eval:hot*` is currently a **hot-session check**, not a guaranteed isolated-session baseline for `main`.
The output now includes:

- `requestedSessionId`
- `observedSessionKey`
- `observedSessionId`
- `hotSession.isolated`

On this machine, the `main` agent still tends to collapse back to `agent:main:main`.

### Local Embeddings Note

If OpenClaw uses `memorySearch.provider = "local"` on Apple Silicon, runtime
stability should be handled at the service level, not by polluting `~/.zshrc`.

This repo includes helper scripts for maintainers:

```bash
npm run runtime:check
npm run runtime:apply
npm run runtime:remove
```

### Roadmap

The short roadmap is:

- public repo readiness
- performance control for query rewrite and multi-recall flows
- better evaluation coverage for rerank and rewrite quality
- stronger query rewrite, including optional LLM-assisted rewriting
- stronger final context assembly and token allocation

See [project-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/project-roadmap.md) for details.

### Naming

The selected public-facing name is `memory-context-claw`.

Other naming options are collected in:

[name-candidates.md](/Users/redcreen/Project/长记忆/context-assembly-claw/name-candidates.md)

## 中文

### 项目概览

`memory-context-claw` 是一个 OpenClaw 的 `context engine` 插件。它不替代
OpenClaw 内置的长期记忆，而是专门优化“长期记忆检索结果”到“当前轮真正进入模型上下文”
之间的这一层。

这个项目的核心目标只有一个：

`把长期记忆更稳定地变成当前轮可用的上下文`

### 为什么要做这个项目

OpenClaw 已经有长期记忆和 `memory search`，但真实使用时很快会出现另一层问题：

- 搜得到，不等于能拿到最合适的上下文
- 长期规则、近期过程、专题资料，不应该一视同仁
- 同一个问题的不同说法，可能导致召回不稳定
- 当工作区很大时，工程文件和插件文档也可能污染召回结果

这个插件就是为了解决这一层而设计的。

### 对话记忆沉淀

当前仓库也提供了一个“从最近对话里抽取候选记忆”的维护命令：

```bash
npm run memory:distill
```

它不会把整段聊天直接写进 `MEMORY.md`，而是先把最近会话里更像“可沉淀记忆”的内容抽成一份审阅文件，分成：

- 长期规则候选
- 当日过程记忆候选

默认输出文件：

- [conversation-memory-candidates.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/conversation-memory-candidates.md)

默认还会在两种时机异步触发候选提炼：

- 接近 compaction 阈值时预触发
- 真正 compaction 时再补一次兜底触发

这两次触发都不会阻塞 compaction，本身是后台动作。

### 当前能力

当前版本已经具备：

- 基于 `openclaw memory search --json` 的长期记忆召回
- 面向 `MEMORY.md`、`memory/`、Workspace 文档的结构化规则重排
- 可选的第二阶段 LLM 重排
- 基于 token 预算的上下文装配
- 查询改写召回，用来提高不同表达方式下的检索稳定性
- 召回后路径过滤，避免工程噪音进入用户上下文
- 自动化验证工具，包括测试、smoke 和黄金样本评测

### 项目状态

当前状态：

`可用的 alpha / 早期 beta`

这个项目已经不是概念验证，而是一个能安装、能测试、能在真实场景中使用的早期版本。
不过它还没有到“打磨完成的公开发布版”。

### 架构思路

当前主链路是：

1. 从当前 OpenClaw agent 的记忆索引里召回候选内容。
2. 在合适时先把问题改写成几个相近检索问法。
3. 过滤插件目录、工程目录等噪音路径。
4. 用面向长期规则、每日笔记、专题资料的规则分数进行重排。
5. 可选地用 LLM 对 top candidates 做第二阶段重排。
6. 把最终片段装配进 `systemPromptAddition`。

### 安装方式

按照 OpenClaw 普通插件的方式安装：

```bash
openclaw plugins install -l .
```

然后在 `~/.openclaw/openclaw.json` 里把它配置为当前激活的 `contextEngine`。

如果你想把“开发态”和“运行态”分开，推荐本地用这条命令显式发布：

```bash
npm run deploy:local
```

它会把当前仓库复制到 `~/.openclaw/extensions/memory-context-claw`，这样你继续改仓库代码时，不会直接影响正在运行的 OpenClaw 插件。

最小示例：

```json5
{
  plugins: {
    allow: ["memory-context-claw"],
    load: {
      paths: ["/ABSOLUTE/PATH/TO/memory-context-claw"]
    },
    slots: {
      contextEngine: "memory-context-claw"
    },
    entries: {
      "memory-context-claw": {
        enabled: true
      }
    }
  }
}
```

模板文件：

- [openclaw.context-assembly.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.llm-rerank.example.json)

配置说明文档：

- [configuration.md](/Users/redcreen/Project/长记忆/context-assembly-claw/configuration.md)

### 日常使用

安装完成后，用户正常使用时不需要额外记插件命令。

日常流程就是：

- 把稳定规则写到 `MEMORY.md`
- 把每日过程记录写到 `memory/*.md`
- 把专题资料放在 Workspace 中
- 继续像平时一样使用 OpenClaw

### 如何验证

优先用 OpenClaw 原生检查：

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "你的测试问题"
```

项目维护者常用验证：

```bash
npm test
npm run eval
npm run eval:hot
npm run eval:hot:critical
npm run eval:toggle
npm run smoke:compare -- "Lossless 插件 和 长期记忆 的区别"
npm run verify
```

`npm run eval:hot` 会直接向真实的 `main` agent 发送回归问题。它会同时
报告内容命中和来源命中；如果某个 case 没有显式要求来源，默认是否通过以
回答内容质量为主，避免真实链路回归因为措辞变化而过于脆弱。

`npm run eval:hot:critical` 是更轻量的热会话回归路径，当前专门盯两类最关键的
主体事实问题：

- `我爱吃什么？`
- `你怎么称呼我？`

### 本地 Embedding 说明

如果在 Apple Silicon 上使用 `memorySearch.provider = "local"`，稳定性策略应该放在
服务级，而不是把环境变量写进 `~/.zshrc` 之类的全局 shell 配置。

仓库里已经提供了对应的维护脚本：

```bash
npm run runtime:check
npm run runtime:apply
npm run runtime:remove
```

### 路线图

当前短期路线图是：

- 公开仓库打磨
- 查询改写与多次召回链路的性能治理
- 扩展对 rerank 与查询改写效果的评测覆盖
- 更强的查询改写能力，包括可选的 LLM 改写
- 更强的最终上下文装配与 token 分配策略

完整路线图见 [project-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/project-roadmap.md)。

### 命名

当前对外命名采用 `memory-context-claw`。

其他命名备选见：

[name-candidates.md](/Users/redcreen/Project/长记忆/context-assembly-claw/name-candidates.md)
