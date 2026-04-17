# OpenClaw Docker Hermetic Eval

[English](openclaw-docker-hermetic-eval.md) | [中文](openclaw-docker-hermetic-eval.zh-CN.md)

这份文档描述的是通过 Docker 容器跑 OpenClaw 记忆评测的 hermetic 路径。

目标不是把宿主 `~/.openclaw` 搬进容器，而是：

- 每个评测容器都从 repo 内 fixture 启动
- 每个容器都写自己的临时 OpenClaw state
- 每个 case 都从 base state 再 clone 一份干净状态
- 默认不启动 gateway，只跑 `memory index` / `memory search` / `agent --local`

## 为什么默认不用 gateway

主 benchmark 要测的是记忆、检索、上下文和 answer path，不是在线服务路径。

默认关闭 gateway 可以避免引入这些额外变量：

- 端口占用
- HTTP/session path
- gateway 重试与超时
- 额外会话锁
- 宿主 auth 状态漂移

如果后面需要补 OpenClaw 在线路径 smoke，可以单独加 `gateway smoke` profile，但不要把它混进主 A/B。

## 前置条件

1. 本机有可用的 Docker / Docker Compose
2. 本机有一个可读的 embedding GGUF 文件
3. 本机有一个可读的 OpenClaw `auth-profiles.json`

默认 runner 会优先读取宿主 `openclaw --version`，并拉取同 tag 的官方镜像
`ghcr.io/openclaw/openclaw:<host-version>`。如果宿主 CLI 不可用，才回退到 `latest`。
当前默认 scenario 也已经显式固定了 `agentModel`，避免容器落回宿主的漂移默认值。

## 首选命令

```bash
npm run eval:openclaw:docker -- \
  --scenario memory-improvement-ab \
  --embed-model-path ~/.openclaw/models/embeddinggemma-300m-qat-Q8_0.gguf \
  --auth-profiles-path ~/.openclaw/agents/main/agent/auth-profiles.json
```

这条命令会：

1. 拉取和宿主 OpenClaw 版本对齐的官方镜像
2. 把 repo 挂进 `/workspace`
3. 把 embedding 模型只读挂进容器
4. 把宿主 `auth-profiles.json` 只读挂进容器
5. 用 scenario 定义的脚本、cases、fixture、preset 启动容器
6. 把报告写回 repo 的 `reports/` 与 `reports/generated/`

## 普通对话实时写记忆专项

如果要重跑当前最敏感的 ordinary-conversation `40` case A/B，推荐直接跑：

```bash
UMC_EVAL_TIMEOUT_MS=30000 npm run eval:openclaw:docker -- \
  --scenario ordinary-conversation-memory-intent-ab \
  --embed-model-path ~/.openclaw/models/embeddinggemma-300m-qat-Q8_0.gguf \
  --auth-profiles-path ~/.openclaw/agents/main/agent/auth-profiles.json
```

这条命令的关键约束是：

- 先完整跑 `legacy builtin`
- 删除那一整轮 legacy 的隔离状态
- 再完整跑 `unified-memory-core current`
- 每个 case 仍然使用独立 temp state root
- 每个 capture / recall turn 都带显式 `30s` timeout budget

这让结果同时回答两件事：

- 记忆到底有没有跨 case 串写
- 在固定 answer-level 时延预算下，两边谁还能保住 recall

## Scenario 真相位置

- [evals/openclaw-docker-scenarios.js](../../../../evals/openclaw-docker-scenarios.js)

每个 scenario 至少定义：

- `id`
- `script`
- `cases`
- `agent`
- `agentModel`
- `preset`
- `writeJson`
- `writeMarkdown`

这样你就可以给不同的容器指定不同的测试案例和配置，而不需要再改 runner 代码。

当前 ordinary-conversation scenario 还会显式固定：

- `fixtureRoot = evals/openclaw-ordinary-conversation-fixture`
- `agentModel = openai-codex/gpt-5.4-mini`
- `preset = safe-local`

这样做的目的，是把 host 漂移因素压到最低。

## Compose 与入口

- Compose 文件：[docker-compose.openclaw-eval.yml](../../../../docker-compose.openclaw-eval.yml)
- 容器入口：[scripts/run-openclaw-docker-entry.js](../../../../scripts/run-openclaw-docker-entry.js)
- 宿主调度器：[scripts/run-openclaw-docker-eval.js](../../../../scripts/run-openclaw-docker-eval.js)

默认服务只有一个：

- `openclaw-eval`

它不会启动 gateway，而是直接在容器里调用 repo 内的评测脚本。
默认镜像来自官方 `ghcr.io/openclaw/openclaw`，不再在本地 Dockerfile 里重新 `npm install -g openclaw`。

## 推荐用法

1. 先跑 targeted scenario，例如 history cleanup：

```bash
npm run eval:openclaw:docker -- \
  --scenario memory-improvement-history-cleanup \
  --embed-model-path ~/.openclaw/models/embeddinggemma-300m-qat-Q8_0.gguf \
  --auth-profiles-path ~/.openclaw/agents/main/agent/auth-profiles.json
```

2. 再跑完整的 `memory-improvement-ab`

3. 如果后面真的需要在线路径确认，再单独补一个 gateway smoke 容器

4. 对 ordinary-conversation 写侧问题，优先跑 `ordinary-conversation-memory-intent-ab`

## 如何判断 Docker 隔离是否仍然互相污染

这是这条路径的根基。如果这一层不稳，所有 A/B 结论都不能信。

当前 ordinary-conversation Docker runner 用这几条硬约束来判定 contamination：

- `duplicateStateRoots = 0`
  说明每个 legacy/current run 都用了新的 temp OpenClaw state root
- `duplicateRegistryRoots = 0`
  说明 current-mode 的 governed registry 没有跨 case 复用
- `cleanupFailed = 0`
  说明每个 case 结束后 temp state root 都被删掉了
- `sessionClearFailed = 0`
  说明 recall 前 session transcript 已经清干净

另外需要注意一个容易误判的点：

- OpenClaw 会在每个 fresh state root 里自动生成 `AGENTS.md`、`MEMORY.md`、daily memory 等 bootstrap 文件
- 这些文件是“每个新状态都会重新生成”的 runtime bootstrap
- 它们不是宿主 `~/.openclaw` 被挂进来了，也不是前一个 case 泄漏进后一个 case

因此，判定污染时要区分：

- `deterministic bootstrap`
- `host-seeded memory contamination`

前者允许存在，后者必须为零。

## 当前 ordinary-conversation Docker 结论

最新 hermetic Docker rerun 的 focused `40` case 结果是：

- current: `3 / 40`
- legacy: `0 / 40`
- `UMC-only = 3`
- `both-fail = 37`

这个结果不能简单读成“Memory Core 只提升了 3 条”。更准确的解释是：

- hermetic 隔离层本身是干净的
- 但在 Docker 下、`30s` turn budget 内，answer-level latency 已经变成主瓶颈
- legacy `40 / 40` 都超时
- current `36 / 40` 也超时，只剩 `3` 条 current 还能在预算内稳定答对

所以这条报告现在承担的是两个职责：

1. 证明 Docker 路径已经足够干净，可当作可复现 A/B 基线
2. 证明 host 结果与 Docker 结果的分叉，当前主要来自 answer-level latency / timeout budget，而不是串记忆

## 相关文件

- [../../../../scripts/openclaw-hermetic-state.js](../../../../scripts/openclaw-hermetic-state.js)
- [../../../../scripts/eval-openclaw-cli-memory-benchmark.js](../../../../scripts/eval-openclaw-cli-memory-benchmark.js)
- [../../../../scripts/eval-openclaw-memory-improvement-ab.js](../../../../scripts/eval-openclaw-memory-improvement-ab.js)
- [../../../../evals/openclaw-cli-memory-fixture/README.md](../../../../evals/openclaw-cli-memory-fixture/README.md)
