# OpenClaw Gateway Context Optimization Validation

## Summary

- 宿主配置已从 `~/.openclaw/openclaw.json.bak.1` 恢复。
- `openclaw gateway status` 显示本机 gateway 服务已恢复到 `running`，RPC probe `ok`。
- gateway 两轮最小 smoke 通过：
  - turn 1: `确认`
  - turn 2: `确认`
- 但 Stage 7 / Stage 9 的 live shadow / guarded decision 在真实 gateway 多话题会话里仍然全部失败。

## What Was Verified

### 1. OpenClaw gateway path itself is usable again

- service: `LaunchAgent (loaded)`
- runtime: `running`
- RPC probe: `ok`

这说明剩下的问题不是“gateway 根本跑不起来”。

### 2. Gateway answer path can complete multiple turns

在恢复配置并重启 gateway 后，最小两轮 smoke 通过：

- `只回复确认` -> `确认`
- `再回复确认` -> `确认`

这说明 gateway agent 交互主链路是活的。

### 3. Runtime working-set shadow still cannot execute live decisions

对同一条多话题会话打开：

- `dialogueWorkingSetShadow.enabled=true`
- `dialogueWorkingSetGuarded.enabled=true`

生成了 `5` 个 gateway export，但全部为 `error`：

- `agent-main-main-shadow-1776432591977-70a6ly.json`
- `agent-main-main-shadow-1776432623672-5djk37.json`
- `agent-main-main-shadow-1776432655531-d5g1pg.json`
- `agent-main-main-shadow-1776432686558-p31prn.json`
- `agent-main-main-shadow-1776432715983-rnfb9w.json`

统一失败原因：

`Error: Plugin runtime subagent methods are only available during a gateway request.`

## Interpretation

这次验证把剩余问题压缩到了一个更精确的结论：

- Stage 7 / 9 的配置面已经能被 OpenClaw live config 正确接受。
- OpenClaw gateway 主链路也能正常跑会话。
- 但 **当前 OpenClaw 给到 context-engine / plugin 的 runtime seam，仍然不足以让 runtime shadow 调用 subagent decision path。**

所以当前阻塞点不是：

- 文档没写
- 配置没暴露
- gateway 没起来
- agent 主链路不能回答

而是：

- **宿主 runtime 还没有把所需 subagent capability 暴露到这条 context optimization seam。**

## Impact On Product Readiness

这对用户视角的影响是：

- “更轻更快”的工程证据已经有了。
- “可配置、可部署”的 OpenClaw live 接线也补上了。
- 但默认用户收益仍然没有完全落地，因为 live shadow / guarded decision 还不能在真实宿主 runtime 里执行。

## Next Required Fix

下一步不是继续加规则，而是补宿主接缝：

1. 要么让 context optimization runtime 在 assembly 时可安全调用 subagent decision。
2. 要么提供一个不依赖当前 subagent seam 的 host-side LLM decision bridge。

在这件事解决之前：

- Stage 7 还不能正式 closeout
- Stage 9 也不能从 `default-off / opt-in only` 往外扩

