# Configuration

[English](#english) | [中文](#中文)

## English

### Philosophy

The plugin should work with sensible defaults.

Most users should only need to configure:

- the plugin install path
- the `contextEngine` slot
- long-memory indexing in OpenClaw itself

Everything else should stay on defaults until there is a clear reason to tune.

### Minimal Plugin Config

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
  }
}
```

### Config Keys

#### `enabled`

Enable or disable the plugin.

Default:

`true`

#### `openclawCommand`

Which `openclaw` binary to use for memory recall.

Default:

`"openclaw"`

#### `maxCandidates`

How many recall candidates to keep before reranking.

Default:

`18`

#### `maxSelectedChunks`

How many memory chunks can finally enter assembled context.

Default:

`4`

#### `maxChunksPerPath`

Limit repeated chunks from the same file.

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

Substring filters applied after recall. Useful for excluding plugin repos,
engineering directories, and other non-user-facing content.

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

#### `weights`

Advanced heuristic weights for first-stage reranking. Most users should leave
them unchanged.

### Recommended Tuning Order

Only tune in this order:

1. keep defaults first
2. adjust `excludePaths` if noise enters recall
3. adjust `maxCandidates` and `maxSelectedChunks` if recall is too broad or too narrow
4. enable `llmRerank` only after first-stage behavior is already understandable
5. change `weights` only after you have eval cases

## 中文

### 配置原则

这个插件应该尽量依赖默认值工作。

对大多数用户来说，真正需要手动配置的通常只有：

- 插件安装路径
- `contextEngine` 插槽
- OpenClaw 自身的长期记忆索引配置

除此之外，其它配置项都应该先用默认值，除非你已经明确知道自己为什么要调。

### 最小插件配置

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
  }
}
```

### 配置项说明

#### `enabled`

是否启用插件。

默认值：

`true`

#### `openclawCommand`

用于召回记忆时调用的 `openclaw` 命令。

默认值：

`"openclaw"`

#### `maxCandidates`

第一阶段召回后保留多少候选，再进入重排。

默认值：

`18`

#### `maxSelectedChunks`

最终最多多少片段能进入上下文。

默认值：

`4`

#### `maxChunksPerPath`

限制同一个文件最多贡献多少片段。

默认值：

`1`

#### `memoryBudgetRatio`

为召回记忆预留多少 token 预算。

默认值：

`0.35`

#### `recentMessageCount`

始终保留多少条最近对话消息。

默认值：

`8`

#### `excludePaths`

召回后路径过滤规则。适合用来排除插件目录、工程目录以及不该进入用户上下文的文件。

默认包含：

- `/memory-context-claw/`
- `/context-assembly-claw/`
- `/openclaw-task-system/`
- `/node_modules/`
- `/.git/`

#### `queryRewrite`

控制规则版查询改写召回。

默认值：

```json5
{
  enabled: true,
  maxQueries: 4
}
```

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

#### `weights`

第一阶段规则重排的高级权重。绝大多数用户都不需要改。

### 推荐调参顺序

建议只按这个顺序调：

1. 先保持默认值
2. 如果召回有噪音，再调整 `excludePaths`
3. 如果召回过宽或过窄，再调整 `maxCandidates` 和 `maxSelectedChunks`
4. 第一阶段行为已经可理解后，再考虑启用 `llmRerank`
5. 只有你已经有评测样本时，再去改 `weights`
