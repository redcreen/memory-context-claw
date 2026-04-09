# Configuration

[English](#english) | [中文](#中文)

## English

### What Most Users Need

Most users only need to do three things:

1. install the plugin
2. set it as the active `contextEngine`
3. make sure OpenClaw long-memory indexing is working

Everything else should stay on defaults until there is a clear reason to tune.

### Quick Minimal Config

Use this in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    allow: ["memory-context-claw"],
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

If you are developing locally and want OpenClaw to load this repo directly:

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

### Minimal OpenClaw Memory Config

This plugin assumes OpenClaw long-memory indexing is already configured.

Minimal example:

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
          extraPaths: ["/ABSOLUTE/PATH/TO/context-assembly-claw/workspace"]
        }
      }
    ]
  }
}
```

If you keep memory files inside this repo, point `extraPaths` at the bundled
`workspace/` directory.

### Recommended Setup Order

Set things up in this order:

1. make sure OpenClaw memory indexing works
2. install and enable `memory-context-claw`
3. verify the plugin is loaded
4. only then start tuning plugin config

### Quick Verification

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "我爱吃什么"
```

### Config Keys

#### `enabled`

Turn the plugin on or off.

Default:

`true`

#### `openclawCommand`

Which `openclaw` binary to use for memory recall.

Default:

`"openclaw"`

#### `maxCandidates`

How many recall candidates are kept before reranking.

Default:

`18`

#### `maxSelectedChunks`

How many chunks can finally enter assembled context.

Default:

`4`

#### `maxChunksPerPath`

Limit repeated chunks from the same document.

Default:

`1`

#### `memoryBudgetRatio`

How much of the token budget is reserved for recalled memory.

Default:

`0.35`

#### `recentMessageCount`

How many recent conversation messages are always preserved.

Default:

`8`

#### `excludePaths`

Substring filters applied after recall. Useful for keeping engineering or plugin
repo noise out of user-facing memory context.

Default includes:

- `/memory-context-claw/`
- `/context-assembly-claw/`
- `/openclaw-task-system/`
- `/node_modules/`
- `/.git/`

#### `queryRewrite`

Controls rule-based retrieval query rewriting.

Default:

```json5
{
  enabled: true,
  maxQueries: 4
}
```

Use this when you want more stable recall across different phrasings.

#### `memoryDistillation`

Controls async candidate-memory extraction from recent dialogue.

Default:

```json5
{
  enabled: true,
  triggerBeforeCompaction: true,
  preCompactTriggerRatio: 0.72,
  compactFallback: true,
  cooldownMs: 300000,
  sessionLimit: 8,
  outputDir: ""
}
```

Meaning:

- `triggerBeforeCompaction`: trigger asynchronously before compaction
- `preCompactTriggerRatio`: how close to compaction to start pre-triggering
- `compactFallback`: fire one async fallback when compaction actually happens
- `cooldownMs`: minimum gap between triggers for the same session/stage
- `sessionLimit`: how many recent session files the standalone distill command scans
- `outputDir`: optional custom output directory for candidate-memory reports

#### `llmRerank`

Controls optional second-stage reranking with a model.

Default:

```json5
{
  enabled: false,
  topN: 6,
  model: "gpt-5.4",
  provider: "",
  timeoutMs: 20000,
  maxSnippetChars: 900,
  minScoreDeltaToSkip: 0.18
}
```

Recommended rule:

- keep this off unless first-stage behavior is already understandable

#### `weights`

Advanced first-stage heuristic weights.

Most users should not change these.

Current ranking intent is:

- relevance first
- recent session memory second
- `workspace/MEMORY.md` as the stable long-term floor

### Recommended Tuning Order

If you need to tune, do it in this order:

1. keep defaults first
2. adjust `excludePaths` if engineering noise enters recall
3. adjust `maxCandidates` and `maxSelectedChunks` if recall is too broad or too narrow
4. enable `llmRerank` only after first-stage behavior is already clear
5. tune `memoryDistillation.preCompactTriggerRatio` only if async extraction fires too early or too late
6. change `weights` only after you already have eval cases

### Common Recipes

#### I only want the plugin on

Use only:

- `enabled`
- `contextEngine`

Leave everything else on defaults.

#### I see too much engineering noise

Tune:

- `excludePaths`

#### I want broader recall before reranking

Tune:

- `maxCandidates`

#### I want fewer chunks entering final context

Tune:

- `maxSelectedChunks`
- `maxChunksPerPath`

#### I want to experiment with model rerank

Turn on:

- `llmRerank.enabled`

But do that only after non-LLM behavior is already understandable.

### Related Docs

- plugin overview:
  [README.md](README.md)
- system architecture:
  [system-architecture.md](system-architecture.md)
- project roadmap:
  [project-roadmap.md](project-roadmap.md)
- test suite:
  [testsuite.md](testsuite.md)

---

## 中文

### 大多数用户真正需要配什么

大多数用户只需要做 3 件事：

1. 安装插件
2. 把它设成当前 `contextEngine`
3. 确保 OpenClaw 自己的长期记忆索引是正常工作的

除此之外，大部分配置都应该先保持默认值。

### 最小可用配置

把下面这段放到 `~/.openclaw/openclaw.json`：

```json5
{
  plugins: {
    allow: ["memory-context-claw"],
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

如果你是在本地开发，并希望 OpenClaw 直接加载这个仓库：

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

### 最小长期记忆配置

这个插件默认建立在：OpenClaw 长期记忆索引已经正常工作 的前提上。

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
          extraPaths: ["/ABSOLUTE/PATH/TO/context-assembly-claw/workspace"]
        }
      }
    ]
  }
}
```

如果你把记忆文件也收进这个仓库，`extraPaths` 就直接指向项目里的
`workspace/` 目录。

### 推荐配置顺序

建议按这个顺序做：

1. 先确认 OpenClaw 自己的 memory index 正常
2. 再安装并启用 `memory-context-claw`
3. 再验证插件已经加载
4. 最后才考虑调插件参数

### 快速验证

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "我爱吃什么"
```

### 配置项说明

#### `enabled`

是否启用插件。

默认值：

`true`

#### `openclawCommand`

用于检索长期记忆时调用哪个 `openclaw` 命令。

默认值：

`"openclaw"`

#### `maxCandidates`

重排前最多保留多少个召回候选。

默认值：

`18`

#### `maxSelectedChunks`

最终最多允许多少个 chunk 进入上下文。

默认值：

`4`

#### `maxChunksPerPath`

限制同一个文件重复进入上下文的 chunk 数量。

默认值：

`1`

#### `memoryBudgetRatio`

最终 token budget 里，分给长期记忆上下文的比例。

默认值：

`0.35`

#### `recentMessageCount`

最近对话里，无论如何都保留多少条消息。

默认值：

`8`

#### `excludePaths`

召回后再做一次路径过滤，用来把工程目录、插件仓库之类的噪音挡在用户上下文之外。

默认包含：

- `/memory-context-claw/`
- `/context-assembly-claw/`
- `/openclaw-task-system/`
- `/node_modules/`
- `/.git/`

#### `queryRewrite`

控制基于规则的 query rewrite。

默认值：

```json5
{
  enabled: true,
  maxQueries: 4
}
```

适用于：

- 同一个问题有多种说法
- 希望检索稳定性更高

#### `memoryDistillation`

控制最近对话的异步候选记忆提炼。

默认值：

```json5
{
  enabled: true,
  triggerBeforeCompaction: true,
  preCompactTriggerRatio: 0.72,
  compactFallback: true,
  cooldownMs: 300000,
  sessionLimit: 8,
  outputDir: ""
}
```

含义：

- `triggerBeforeCompaction`：接近 compaction 时异步预触发
- `preCompactTriggerRatio`：离 compaction 多近时开始预触发
- `compactFallback`：真正 compaction 时再补一次兜底触发
- `cooldownMs`：同一个 session / stage 的最小触发间隔
- `sessionLimit`：独立 distill 命令默认扫描多少个最近 session 文件
- `outputDir`：候选记忆报告的可选自定义输出目录

#### `llmRerank`

控制可选的第二阶段模型重排。

默认值：

```json5
{
  enabled: false,
  topN: 6,
  model: "gpt-5.4",
  provider: "",
  timeoutMs: 20000,
  maxSnippetChars: 900,
  minScoreDeltaToSkip: 0.18
}
```

推荐原则：

- 只有在第一阶段行为已经足够可理解时，才考虑打开它

#### `weights`

高级启发式权重。

大多数用户不应该改它。

当前默认权重的意图是：

- 相关性第一
- 近期 session-memory 第二
- `workspace/MEMORY.md` 作为稳定长期事实的底座

### 推荐调参顺序

如果你真的要调，建议按这个顺序：

1. 先保留默认值
2. 如果工程噪音进入召回，先调 `excludePaths`
3. 如果候选太宽或太窄，再调 `maxCandidates` / `maxSelectedChunks`
4. 只有在第一阶段已经可理解时，才考虑打开 `llmRerank`
5. 只有在异步提炼触发过早或过晚时，才调 `memoryDistillation.preCompactTriggerRatio`
6. 只有在你已经有 eval case 时，才考虑改 `weights`

### 常见场景

#### 我只想把插件启起来

只需要关心：

- `enabled`
- `contextEngine`

其它全部保持默认。

#### 我看到太多工程噪音

优先调：

- `excludePaths`

#### 我想让重排前的候选更多一点

优先调：

- `maxCandidates`

#### 我想让最终上下文更短一点

优先调：

- `maxSelectedChunks`
- `maxChunksPerPath`

#### 我想试试模型重排

开启：

- `llmRerank.enabled`

但前提是，非 LLM 路径已经足够可理解。

### 相关文档

- 插件总览：
  [README.md](README.md)
- 总体架构：
  [system-architecture.md](system-architecture.md)
- 总 roadmap：
  [project-roadmap.md](project-roadmap.md)
- 测试说明：
  [testsuite.md](testsuite.md)
