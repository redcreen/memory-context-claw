# Stage 7 / Step 108 收口报告

[English](stage7-step108-context-minor-gc-closeout-2026-04-18.md) | [中文](stage7-step108-context-minor-gc-closeout-2026-04-18.zh-CN.md)

## 目标

在**不修改 OpenClaw core** 的前提下，收口 `Stage 7 / Step 108`：

- 替换绑定在宿主 `runtime.subagent` 上的 decision transport
- 让 `Context Minor GC` 保持在插件层自托管
- 证明真实 OpenClaw gateway 会话能够重新稳定产出 shadow decision

## 已实现

- 落地插件内自托管 structured decision runner，支持：
  - inline test runner
  - `codex_exec`
  - legacy `runtime_subagent` fallback
- 把 `Context Minor GC` shadow decision 改接到这条新 runner
- 把 LLM rerank 也切到同一条 transport surface
- 增加 `codex_exec` 恢复逻辑：
  - 即使子进程表面失败，只要 `stdout` 里已经有合法结构化 payload，就恢复为成功
  - `codex_exec` 失败时，用新的最小 `CODEX_HOME` 受控重试一次
- 在 `openclaw.plugin.json` 里暴露新的 transport / reasoning 配置

## 验证

### 代码级

- `node --check src/codex-structured-runner.js src/structured-decision-runner.js src/dialogue-working-set-runtime-shadow.js src/rerank.js src/engine.js src/config.js`
- `node --test test/codex-structured-runner.test.js test/structured-decision-runner.test.js test/engine-dialogue-working-set-shadow.test.js test/rerank.test.js test/openclaw-plugin-manifest.test.js`
- 结果：`19 / 19` 通过

### Hermetic OpenClaw Gateway

- 环境：
  - 隔离 `OPENCLAW_STATE_DIR`
  - 前台 gateway，设置 `OPENCLAW_DISABLE_BONJOUR=1`
  - 插件配置：`dialogueWorkingSetShadow.enabled=true`、`transport=codex_exec`、`model=gpt-5.4-mini`
- live soak：
  - `5 / 5` captured
  - relation 分布：`switch`、`resolve`、`resolve`、`resolve`、`continue`
  - average raw reduction ratio：`0.5817`
  - average package reduction ratio：`0.4827`
  - average total elapsed：`18479.2ms`
- 本地 artifacts 目录：
  - `reports/generated/openclaw-hermetic-context-minor-gc-2026-04-18/`

### 本机真实 OpenClaw Service

- 用 `npm run deploy:local` 部署当前 repo
- 重启本机 gateway service，并通过真实 service endpoint 重跑 live 调用
- 最新 service smoke：
  - `3 / 3` captured
  - relation 分布：`continue`、`resolve`、`continue`
  - average reduction ratio：`0.5096`
  - average total elapsed：`20016.7ms`
- 本地 artifacts 目录：
  - `reports/generated/openclaw-gateway-context-minor-gc-2026-04-18/`

## 结论

`Stage 7 / Step 108` 现在可以关闭。

对应变化：

- `108.a` 已完成：插件内自托管 `decision runner` 契约已存在
- `108.b` 已完成：`Context Minor GC` working-set decision transport 不再依赖宿主 `runtime.subagent`
- `108.c` 已完成：真实 gateway live soak 已重跑为绿（hermetic gateway `5 / 5` captured，本机 service smoke `3 / 3` captured）
- `108.d` 已完成：仓库可以在**不修改 OpenClaw core** 的前提下继续推进 Stage 7

但这**不表示**：

- Stage 7 整个阶段已经全部关闭
- `104` 的 harder eval matrix 已完成
- Stage 9 可以默认开启

## 下一条边界

Stage 7 剩下的问题，已经不再是“打通宿主接缝”。
现在变成：

1. 设计并落地下一轮 harder eval matrix
2. 继续用同一套 operator scorecard 衡量 `Context Minor GC`
3. 只有 harder matrix 持续为绿后，才扩大 guarded experiment
