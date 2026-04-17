# OpenClaw Docker Hermetic Eval

[English](openclaw-docker-hermetic-eval.md) | [中文](openclaw-docker-hermetic-eval.zh-CN.md)

这份文档描述的是通过 Docker 容器跑 OpenClaw 记忆评测的 hermetic 路径。

目标不是把宿主 `~/.openclaw` 搬进容器，而是：

- 每个评测容器都从 repo 内 fixture 启动
- 每个容器都写自己的临时 OpenClaw state
- 每个 case 都从预配置 base state 再 clone 一份干净状态
- 默认不启动 gateway，只跑 `memory index` / `memory search` / `agent --local`

## 默认测试策略

从现在开始，这个仓库里的 A/B 与 CLI 评测默认先走 Docker hermetic 路径。

原因很简单：

- A/B 的第一要求是避免自己骗自己
- Docker 更适合把 `legacy` 和 `current` 分到严格独立的 state root 里
- 只有先把隔离和可复现性守住，后面的结果才有解释价值

只有在明确需要“真实宿主体验”时，才应该额外跑 host live。

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
- 每个 mode 会先在 repo 挂载目录下准备一个持久化模板缓存
- 每个 case 再从这个预配置模板直接 clone 独立 state root，而不是重新生成 `openclaw.json`、fixture copy 和目录骨架
- 每个 capture / recall turn 都带显式 `30s` timeout budget

当前快路径还有 3 个默认加速器：

- 预热模板：
  base state 会先跑一条低信号 warmup turn，再作为模板缓存下来
- fast-fail：
  capture 一旦超时或失败，就直接跳过 registry wait 与 recall
- shard 并行：
  ordinary-conversation scenario 默认按 `4` 个 shard 并行跑完整轮次

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

当前 ordinary-conversation runner 默认会把模板缓存写到：

- `.cache/openclaw-ordinary-state-templates`

这个目录不会进 git，但会跟着 repo mount 进容器，所以跨 Docker run 也能复用。
如果需要强制重建，可以传：

```bash
--refresh-template-cache
```

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

- current: `0 / 40`
- legacy: `0 / 40`
- `UMC-only = 0`
- `both-fail = 40`

这个结果不能简单读成“Memory Core 没提升”。
更准确的解释是：

- hermetic 隔离层本身是干净的
- 但在 Docker 下、当前这条 `30s` 快路径里，answer-level capture turn 本身仍然跑不完
- legacy `40 / 40` capture timeout
- current `40 / 40` capture timeout

所以这条 ordinary-conversation Docker 快路径，现在承担的是 `infra/perf watch`，不是最终的能力排序面。

更直白地说：

- 它现在已经足够快，也足够干净
- 但它测到的主要是“在严格预算下，这条 answer path 还跑不跑得完”
- 不能直接拿来替代 host live 或更宽预算下的能力结论

## 为什么仍然值得保留这条快路径

因为它已经解决了这几个最关键的问题：

- case 之间有没有串记忆：当前证据是 `没有`
- legacy / current 是否共用 state：当前证据是 `没有`
- 每次重建配置是不是主要瓶颈：当前证据是 `不是`
- 当前 40 case 是否能在可接受 wall-clock 内跑完：当前证据是 `可以`

当前速度面已经可以这样理解：

- 旧路径：虽然逐题逻辑简单，但 wall-clock 非常差
- 新路径：通过模板缓存、warmup、fast-fail、4-shard 并行，把整轮 `40` case 压到约 `10` 分钟

代价是：

- 这条快路径现在更适合作为 infra / perf / contamination gate
- 不再适合作为 ordinary-conversation answer-level 能力的最终定量结论

如果后面要继续把 Docker ordinary-conversation A/B 收回“能力结论面”，正确方向是：

- 引入真正的 steady-state 长驻运行形态
- 避免每题都重新冷起 answer path
- 在保证隔离为零污染的前提下，再重跑更宽预算的 ordinary-conversation 能力对比

所以这条报告现在承担的是两个职责：

1. 证明 Docker 路径已经足够干净，可当作可复现 A/B 基线
2. 证明 host 结果与 Docker 结果的分叉，当前主要来自 answer-level latency / timeout budget，而不是串记忆

## 相关文件

- [../../../../scripts/openclaw-hermetic-state.js](../../../../scripts/openclaw-hermetic-state.js)
- [../../../../scripts/eval-openclaw-cli-memory-benchmark.js](../../../../scripts/eval-openclaw-cli-memory-benchmark.js)
- [../../../../scripts/eval-openclaw-memory-improvement-ab.js](../../../../scripts/eval-openclaw-memory-improvement-ab.js)
- [../../../../evals/openclaw-cli-memory-fixture/README.md](../../../../evals/openclaw-cli-memory-fixture/README.md)
