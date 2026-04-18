# Stage 9 收口报告

[English](stage9-guarded-smart-path-closeout-2026-04-18.md) | [中文](stage9-guarded-smart-path-closeout-2026-04-18.zh-CN.md)

## 目标

在**不修改 OpenClaw core**、并保持 `default-off` / opt-in only 的前提下，收口 `Stage 9. Guarded Smart-Path Promotion`：

- 证明 guarded smart path 已经不只是离线 answer A/B 结果
- 证明真实 OpenClaw CLI live 路径里，正例能激活、负例不误激活
- 证明 active-path 仍然有清晰 rollback boundary，不会越界成默认路径

## 已实现

- 新增 hermetic OpenClaw live A/B 入口：
  - [scripts/eval-openclaw-guarded-live-ab.js](../../scripts/eval-openclaw-guarded-live-ab.js)
  - [evals/openclaw-guarded-live-ab-cases.js](../../evals/openclaw-guarded-live-ab-cases.js)
- 比较面固定成两条：
  - `baseline`：当前 UMC path，但 `dialogueWorkingSetShadow=false`、`dialogueWorkingSetGuarded=false`
  - `guarded`：`dialogueWorkingSetShadow=true`、`dialogueWorkingSetGuarded=true`
- 两边都关闭了无关 learning / write-path 干扰，只保留 context-path 对比
- 当前 repo 也已重新 `deploy:local` 到本机 OpenClaw 宿主，插件 inspect 正常

## 验证

### 代码级

- `node --check scripts/eval-openclaw-guarded-live-ab.js`
- `node --test test/openclaw-guarded-live-ab-cases.test.js test/openclaw-plugin-manifest.test.js test/structured-decision-runner.test.js test/codex-structured-runner.test.js test/engine-dialogue-working-set-shadow.test.js test/rerank.test.js`
- 结果：`22 / 22` 通过

### 真实 OpenClaw CLI Live A/B

报告入口：

- [OpenClaw Guarded Live A/B](openclaw-guarded-live-ab-2026-04-18.md)

核心结果：

- baseline `4 / 4`
- guarded `4 / 4`
- guarded applied `2 / 4`
- activation matched `4 / 4`
- false activations `0`
- missed activations `0`
- average prompt reduction ratio `0.0306`
- average applied-only prompt reduction ratio `0.0067`
- average applied-only raw reduction ratio `0.7422`

逐项解释：

- 两个正例都真实激活 guarded：
  - `guarded-live-language-after-code-detour`
  - `guarded-live-style-pin-survives-detour`
- 两个负例都保持不激活：
  - `guarded-live-branch-negative`
  - `guarded-live-continue-negative`
- 正例里 final answer 仍然正确，同时 live `promptTokens` 仍有小幅下降
- 负例里虽然 `promptTokens` 仍会有少量 run-to-run 噪声，但 guarded activation 本身保持 `0` 误触发

### 本机宿主同步

- `npm run deploy:local`
- `openclaw plugins inspect unified-memory-core --json`
- 结果：宿主已加载 `0.2.1`，guarded/shadow config schema 与 UI hints 均存在

## 结论

`Stage 9` 现在可以关闭。

更准确地说：

- `guarded smart-path` 已经成为**真实宿主可观测的窄路径收益**
- 但它仍然是**极窄、default-off、opt-in only** 的实验面
- 这次 closeout 的意义不是“默认上线”，而是“bounded rollout / rollback contract 已成立”

当前结论已经满足 Stage 9 关闭条件：

1. context 优化不再只是 shadow telemetry
2. guarded experiment seam 有了真实 live A/B，且 activation matched `4 / 4`
3. rollout / rollback 边界继续清楚
4. feature 没有漂成默认路径
5. OpenClaw live runtime seam 已经不再是 blocker

## 下一条边界

Stage 9 关闭后，当前主线只剩：

1. `Stage 7 / 104` 的 harder eval matrix 现已完成，可以不再把它视为当前 blocker
2. 继续保持 guarded seam `default-off` / opt-in only，不扩大默认面
3. 后续重点切到 adoption / shared-foundation 维护态与更深的 realtime memory-intent 契约
