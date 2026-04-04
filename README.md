# Memory Context Claw

Memory-first context assembly for OpenClaw.

面向 OpenClaw 的长期记忆上下文组装插件。

## Overview | 项目概览

`memory-context-claw` is an OpenClaw `context engine` plugin. It does not
replace OpenClaw's built-in long memory. Instead, it improves the layer between
long-memory retrieval and the final prompt the model actually sees.

`memory-context-claw` 是一个 OpenClaw 的 `context engine` 插件。它不替代
OpenClaw 内置的长期记忆，而是专门优化“长期记忆检索结果”到“当前轮真正进入模型上下文”
之间的这一层。

This project exists for one reason:

这个项目的核心目标只有一个：

`turn long memory into better working context`

`把长期记忆更稳定地变成当前轮可用的上下文`

## Why This Project Exists | 为什么要做这个项目

OpenClaw already has long memory and memory search. But in real usage, another
problem appears immediately:

OpenClaw 已经有长期记忆和 `memory search`，但真实使用时很快会出现另一层问题：

- Finding something is not the same as selecting the best context.
- 搜得到，不等于能拿到最合适的上下文。
- Long-term rules, recent notes, and topic documents should not have equal weight.
- 长期规则、近期过程、专题资料，不应该一视同仁。
- Different phrasings of the same question can lead to unstable recall.
- 同一个问题的不同说法，可能导致召回不稳定。
- Engineering files and plugin docs can pollute results when the workspace is broad.
- 当工作区很大时，工程文件和插件文档也可能污染召回结果。

This plugin is designed to solve that layer.

这个插件就是为了解决这一层而设计的。

## What It Does | 它做什么

Today the project already includes:

当前版本已经具备：

- Memory recall through the existing `openclaw memory search --json` flow.
- 基于 `openclaw memory search --json` 的长期记忆召回。
- Structure-aware heuristic reranking for `MEMORY.md`, `memory/`, and workspace docs.
- 面向 `MEMORY.md`、`memory/`、Workspace 文档的结构化规则重排。
- Optional second-stage LLM rerank.
- 可选的第二阶段 LLM 重排。
- Token-budget-aware context packing.
- 基于 token 预算的上下文装配。
- Query rewrite recall for more stable retrieval across different phrasings.
- 查询改写召回，用来提高不同表达方式下的检索稳定性。
- Post-retrieval path filtering to keep engineering noise out of user-facing context.
- 召回后路径过滤，避免工程噪音进入用户上下文。
- Validation tooling for tests, smoke checks, and golden-case evaluation.
- 自动化验证工具，包括测试、smoke 和黄金样本评测。

## Project Status | 项目状态

Current status:

当前状态：

`usable alpha / early beta`

The project is beyond proof-of-concept. It is installable, testable, and
already useful in real usage. But it is not yet a fully polished public release.

这个项目已经不是概念验证，而是一个能安装、能测试、能在真实场景中使用的早期版本。
不过它还没有到“打磨完成的公开发布版”。

## Architecture | 架构思路

The current pipeline is:

当前主链路是：

1. Recall memory candidates from the current OpenClaw agent memory index.
2. 从当前 OpenClaw agent 的记忆索引里召回候选内容。
3. Rewrite the query into a few nearby retrieval variants when useful.
4. 在合适时先把问题改写成几个相近检索问法。
5. Filter noisy paths such as plugin repos or engineering directories.
6. 过滤插件目录、工程目录等噪音路径。
7. Rerank with heuristics tuned for long-term rules, daily notes, and topic docs.
8. 用面向长期规则、每日笔记、专题资料的规则分数进行重排。
9. Optionally rerank the top candidates again with an LLM.
10. 可选地用 LLM 对 top candidates 做第二阶段重排。
11. Pack the final snippets into `systemPromptAddition`.
12. 把最终片段装配进 `systemPromptAddition`。

## Core Features | 核心能力

### 1. Memory-First Reranking | 记忆优先重排

Stable rules from `MEMORY.md`, recent daily notes from `memory/`, and general
workspace documents are treated differently on purpose.

`MEMORY.md` 中的稳定规则、`memory/` 中的近期记录、以及普通 Workspace 文档，
会被有意地区别对待，而不是统一排序。

### 2. Query Rewrite Recall | 查询改写召回

The plugin can expand one user query into a few retrieval variants before
fusion and dedupe.

插件会在召回前，把一个用户问题扩展成几个相近的检索表达，再做融合与去重。

### 3. Optional LLM Rerank | 可选 LLM 二阶段重排

When heuristic ranking is not clearly decisive, the plugin can invoke a model
such as `gpt-5.4` for a second-stage rerank.

当第一阶段规则排序还不够明确时，插件可以进一步调用如 `gpt-5.4` 这样的模型做
第二阶段重排。

### 4. Path Noise Filtering | 路径噪音过滤

Engineering paths such as plugin repos, `node_modules`, and `.git` are filtered
from retrieval results by default.

像插件目录、`node_modules`、`.git` 这样的工程路径，默认会在召回结果里被过滤掉。

### 5. Verification Tooling | 验证工具链

The repo already includes:

仓库当前已经提供：

- unit tests / 单元测试
- integration tests / 集成测试
- golden-case eval / 黄金样本评测
- smoke compare / 召回与重排对比验证
- one-command verify flow / 一键验证入口

## Installation | 安装方式

Install it like a normal OpenClaw plugin:

按照 OpenClaw 普通插件的方式安装：

```bash
openclaw plugins install -l .
```

Then configure it as the active `contextEngine` in `~/.openclaw/openclaw.json`.

然后在 `~/.openclaw/openclaw.json` 里把它配置为当前激活的 `contextEngine`。

Minimal example:

最小示例：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        memorySearch: {
          provider: "local",
          fallback: "none",
          local: {
            modelPath: "/ABSOLUTE/PATH/TO/embeddinggemma-300m-qat-Q8_0.gguf"
          },
          sync: {
            watch: true
          },
          extraPaths: ["/ABSOLUTE/PATH/TO/YOUR-WORKSPACE"]
        }
      }
    ]
  },
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
        enabled: true,
        config: {
          enabled: true,
          maxCandidates: 18,
          maxSelectedChunks: 4,
          maxChunksPerPath: 1,
          memoryBudgetRatio: 0.35,
          recentMessageCount: 8,
          excludePaths: [
            "/memory-context-claw/",
            "/context-assembly-claw/",
            "/openclaw-task-system/",
            "/node_modules/",
            "/.git/"
          ],
          queryRewrite: {
            enabled: true,
            maxQueries: 4
          },
          llmRerank: {
            enabled: false,
            topN: 6,
            model: "gpt-5.4",
            timeoutMs: 20000,
            maxSnippetChars: 900,
            minScoreDeltaToSkip: 0.18
          }
        }
      }
    }
  }
}
```

Templates:

模板文件：

- [openclaw.context-assembly.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.llm-rerank.example.json)

## Normal Usage | 日常使用

After installation, users should not need special plugin commands.

安装完成后，用户正常使用时不需要额外记插件命令。

The normal flow is:

日常流程就是：

- keep stable rules in `MEMORY.md`
- 把稳定规则写到 `MEMORY.md`
- keep daily notes in `memory/*.md`
- 把每日过程记录写到 `memory/*.md`
- keep topic docs in the workspace
- 把专题资料放在 Workspace 中
- keep chatting with OpenClaw
- 继续像平时一样使用 OpenClaw

## Validation | 如何验证

OpenClaw-native checks:

优先用 OpenClaw 原生检查：

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "你的测试问题"
```

Project-maintainer checks:

项目维护者常用验证：

```bash
npm test
npm run eval
npm run smoke:compare -- "Lossless 插件 和 长期记忆 的区别"
npm run verify
```

## Local Embeddings Note | 本地 Embedding 说明

If OpenClaw uses `memorySearch.provider = "local"` on Apple Silicon, runtime
stability should be handled at the service level, not by polluting `~/.zshrc`.

如果在 Apple Silicon 上使用 `memorySearch.provider = "local"`，稳定性策略应该放在
服务级，而不是把环境变量写进 `~/.zshrc` 之类的全局 shell 配置。

This repo already includes helper scripts for maintainers:

仓库里已经提供了对应的维护脚本：

```bash
npm run runtime:check
npm run runtime:apply
npm run runtime:remove
```

## Roadmap | 路线图

### Phase 1

Public repo readiness.

公开仓库打磨。

### Phase 2

Performance control for query rewrite and multi-recall flows.

查询改写与多次召回链路的性能治理。

### Phase 3

Better evaluation coverage for rerank and rewrite quality.

扩展对 rerank 与查询改写效果的评测覆盖。

### Phase 4

Stronger query rewrite, including optional LLM-assisted rewriting.

更强的查询改写能力，包括可选的 LLM 改写。

### Phase 5

Stronger final context assembly and token allocation.

更强的最终上下文装配与 token 分配策略。

See [PROJECT_ROADMAP.md](/Users/redcreen/Project/长记忆/context-assembly-claw/PROJECT_ROADMAP.md) for the longer version.

完整路线图见 [PROJECT_ROADMAP.md](/Users/redcreen/Project/长记忆/context-assembly-claw/PROJECT_ROADMAP.md)。

## Naming Direction | 命名方向

The selected public-facing name is `memory-context-claw`.

当前对外命名采用 `memory-context-claw`。

Name candidates are collected in:

命名备选见：

[NAME_CANDIDATES.md](/Users/redcreen/Project/长记忆/context-assembly-claw/NAME_CANDIDATES.md)

## License | 许可证

License is not added yet.

当前还没有补充 LICENSE。

That should be one of the next public-release tasks.

这是公开发布前应该优先补齐的一项内容。
