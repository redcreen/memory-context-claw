# Configuration

[English](configuration.md) | [中文](configuration.zh-CN.md)

### 大多数用户真正需要配什么

大多数用户只需要做 3 件事：

1. 安装插件
2. 把它设成当前 `contextEngine`
3. 确保 OpenClaw 自己的长期记忆索引是正常工作的

除此之外，大部分配置都应该先保持默认值。

这也包括 nightly self-learning：插件现在默认会在本地时间 `00:00` 自动跑一轮 self-learning，所以大多数用户不需要额外再配。

### 最小可用配置

把下面这段放到 `~/.openclaw/openclaw.json`：

```json5
{
  plugins: {
    allow: ["unified-memory-core"],
    slots: {
      contextEngine: "unified-memory-core"
    },
    entries: {
      "unified-memory-core": {
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
    allow: ["unified-memory-core"],
    load: {
      paths: ["/ABSOLUTE/PATH/TO/unified-memory-core"]
    },
    slots: {
      contextEngine: "unified-memory-core"
    },
    entries: {
      "unified-memory-core": {
        enabled: true
      }
    }
  }
}
```

如果你想覆盖 nightly self-learning 行为，建议也尽量保持最小配置：

```json5
{
  plugins: {
    entries: {
      "unified-memory-core": {
        enabled: true,
        selfLearning: {
          enabled: true,
          localTime: "00:00"
        }
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
          extraPaths: ["/ABSOLUTE/PATH/TO/unified-memory-core/workspace"]
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
2. 再安装并启用 `unified-memory-core`
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

- `/unified-memory-core/`
- `/unified-memory-core/`
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

#### `openclawAdapter`

控制 OpenClaw 侧的 governed export 加载边界。

默认值：

```json5
{
  enabled: true,
  governedExports: {
    enabled: true,
    registryDir: "",
    workspaceId: "",
    agentWorkspaceIds: {},
    agentNamespace: {
      enabled: false
    },
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    host: "",
    allowedVisibilities: ["private", "workspace", "shared", "public"],
    allowedStates: ["stable"],
    maxCandidates: 4
  }
}
```

当你希望 OpenClaw adapter 在合并内置 recall 结果之前，先从本地 registry 加载 governed stable exports 时，就用这一组配置。

关键规则：

- `workspaceId` 是这个插件实例的共享 workspace 层
- 如果你只设置 `workspaceId`，OpenClaw 的所有 agent 仍然会共用这层 shared workspace
- 如果只想让某个 agent，比如 `code`，进入另一套 workspace namespace，而不影响其他 agent，就用 `agentWorkspaceIds`

示例：

```json5
{
  openclawAdapter: {
    governedExports: {
      workspaceId: "default-workspace",
      agentWorkspaceIds: {
        code: "code-workspace"
      },
      agentNamespace: {
        enabled: true
      }
    }
  }
}
```

如果开启 `openclawAdapter.governedExports.agentNamespace.enabled`，OpenClaw 会变成双层结构：

- 共享 workspace namespace：所有 agent 都能读
- 可选 agent 子 namespace：只有当前 agent 会读，nightly self-learning 也会把 agent 专属学习结果写进去

现在 registry root 的解析顺序是：

1. 显式 `registryDir`
2. 环境变量 `UMC_REGISTRY_DIR`
3. canonical host-neutral root：`~/.unified-memory-core/registry`
4. 兼容回退：`~/.openclaw/unified-memory-core/registry`

这样做的目的是：在朝 host-neutral canonical root 迁移时，不打断当前 OpenClaw 本地安装。

运维命令：

- 查看当前 topology / findings：
  - `node scripts/unified-memory-core-cli.js registry inspect --format markdown`
- 规划或执行非破坏性迁移到 canonical root：
  - `node scripts/unified-memory-core-cli.js registry migrate --format markdown`
  - `node scripts/unified-memory-core-cli.js registry migrate --apply --format markdown`

#### `selfLearning`

控制插件层 nightly self-learning。

默认值：

```json5
{
  enabled: true,
  localTime: "00:00"
}
```

行为：

- 在本地午夜扫描最近的 OpenClaw 会话记忆
- 从最近对话里提取受治理的长期学习候选
- 复用现有 daily reflection 管线
- 对达到基线阈值的 stable candidates 自动晋升
- 在本地 registry 下持久化 scheduler state 和 latest reflection reports

推荐原则：

- 除非你明确不想要自动受治理学习，否则就保持开启

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
