# Unified Memory Core OpenClaw CLI Integration

[English](openclaw-cli-integration.md) | [中文](openclaw-cli-integration.zh-CN.md)

这份文档描述的是通过真实 OpenClaw CLI 做 `unified-memory-core` 宿主级集成 smoke。

它适合接在 Stage 3-4 的仓库内验收之后，用来确认：

- OpenClaw 宿主能在隔离 profile 里加载插件
- `contextEngine` 绑定在宿主配置里是生效的
- 配了这个插件之后，OpenClaw 宿主自己的 memory CLI 仍然正常

## 首选命令

```bash
npm run umc:openclaw-itest -- --format markdown
```

这条脚本会自动：

1. 创建一个隔离的 OpenClaw profile
2. 初始化最小 `openclaw.json`
3. 把 `unified-memory-core` 绑定到 `plugins.slots.contextEngine`
4. 通过 `openclaw config validate` 校验宿主配置
5. 通过 `openclaw plugins inspect` 和 `openclaw plugins list` 校验插件已加载
6. 写入一份 smoke `MEMORY.md`，执行 `openclaw memory index --force`，再检查 `openclaw memory search`
7. 默认清理临时 profile 和 workspace；如果你要排查，可加 `--keep-profile`

## 为什么这里不用 `plugins install -l .`

对于本地开发仓库，OpenClaw 的 safe-install policy 可能会拦截 `openclaw plugins install -l .`，因为仓库里有 deployment / verify 之类会调用 shell 的脚本。

这属于预期行为。对于本地集成 smoke，这个仓库走的是宿主配置加载：

- `plugins.load.paths`
- `plugins.allow`
- `plugins.slots.contextEngine`

这仍然是在测试真实的 OpenClaw 宿主加载器和真实的 OpenClaw CLI 路径。

## 可选的 Live Agent Probe

如果你还想顺手探一次 `openclaw agent --local`，可以跑：

```bash
npm run umc:openclaw-itest -- --agent-probe --format markdown
```

只有在这个隔离 profile 已经具备可用的 auth/provider 配置时才建议打开。默认 smoke 不跑它，因为 host auth 不应该成为 repo-level 验收的硬前置条件。

## 推荐总流程

1. 先跑仓库内 acceptance：

```bash
npm run umc:acceptance -- --format markdown
```

2. 再跑 OpenClaw 宿主集成 smoke：

```bash
npm run umc:openclaw-itest -- --format markdown
```

3. 如果你还想再补一层 UI 心智确认，再做一次手工 OpenClaw 黑盒 spot check。

## 相关文档

- [stage3-stage4-acceptance.zh-CN.md](stage3-stage4-acceptance.zh-CN.md)
- [README.zh-CN.md](README.zh-CN.md)
- [../../../../scripts/run-openclaw-cli-integration.js](../../../../scripts/run-openclaw-cli-integration.js)
