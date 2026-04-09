# Memory Context Claw 配置说明

## 一句话结论
`memory-context-claw` 的主配置分成两层：OpenClaw 插件挂载配置，以及插件自己的可选参数配置。

## 适用场景
- 当用户问“这个项目的配置应该怎么写”
- 当需要解释 `memory-context-claw` 怎么在 OpenClaw 里启用
- 当需要给出最小可用配置示例

## 最小配置
先安装插件：

```bash
openclaw plugins install -l .
```

然后在 `~/.openclaw/openclaw.json` 里至少写这段：

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

## 推荐搭配
这个插件通常与 OpenClaw 内置长期记忆一起使用：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        extraPaths: ["/Users/redcreen/Project/长记忆"]
      }
    }
  }
}
```

## 插件可选参数
如果要写插件自己的配置，位置在：

```json5
plugins.entries["memory-context-claw"].config
```

常见参数包括：

- `maxCandidates`
- `queryRewrite.enabled`
- `queryRewrite.maxQueries`
- `llmRerank.enabled`
- `excludePaths`

## 判断标准
- 只想启用插件：先写 `plugins.*`
- 想把长期记忆和 Workspace 一起接进来：再写 `agents.defaults.memorySearch.*`
- 想调插件行为：改 `plugins.entries["memory-context-claw"].config`
