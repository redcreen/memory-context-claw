# Context Optimization User-Value Review

## Verdict

- 从工程落地看，Stage 7 `context optimization scorecard` 和 Stage 9 `guarded opt-in seam` 已经进入 **可运行、可验证、可回退** 状态。
- 从默认用户收益看，这项工作还没有完全跨过“装上就明显更轻、更快”的门槛。
- 更准确地说：
  - **工程完成度**：约 `70%`
  - **默认用户可感知收益完成度**：约 `45%`

## What Improved For Users

### 1. It is no longer just a report idea

Before Stage 7 / 9:

- context optimization 主要还是 `shadow findings`
- 还没有统一 scorecard
- 也没有 bounded、guarded 的 opt-in path

After Stage 7 / 9:

- Stage 7 scorecard 已经固定下来：
  - captured: `16 / 16`
  - average raw reduction ratio: `0.4191`
  - average package reduction ratio: `0.1151`
- Stage 9 guarded A/B 已经落地：
  - baseline: `5 / 5`
  - shadow: `5 / 5`
  - guarded: `5 / 5`
  - guarded applied: `2 / 5`

这意味着：这条线已经从“方向正确”进到“有 rollout / rollback contract 的正式主线”。

### 2. OpenClaw live config seam now actually accepts Stage 7 / 9 config

本轮 live OpenClaw 验证里，先暴露出一个真实缺口：

- `openclaw.plugin.json` 还没有暴露 `dialogueWorkingSetShadow`
- `openclaw.plugin.json` 还没有暴露 `dialogueWorkingSetGuarded`

这会导致 OpenClaw 直接把这两个配置判成 invalid，用户根本开不起来。

这个缺口现在已经补上，并通过单测验证：

- `test/openclaw-plugin-manifest.test.js`: `2 / 2`

所以现在至少不是“文档里说有，OpenClaw 实际不让配”。

### 3. Real OpenClaw multi-topic smoke stays behaviorally correct

本轮真实 OpenClaw `agent --local` 多话题 smoke 跑了 5 轮：

1. 日本旅行预算/偏好
2. 继续旅行细化
3. 切到 Python 正则
4. 继续 Python 正则
5. 再切到低油晚餐

实际回复没有出现明显行为回归：

- turn 1: `确认`
- turn 2: `确认`
- turn 3: ``re.search(r'foo(\\d+)bar', s).group(1)``
- turn 4: ``re.search(r'\\d+', s).group(0)``
- turn 5: `清蒸鲈鱼 / 蒜蓉西兰花 / 番茄豆腐汤`

这说明：把 Stage 7 / 9 接线补到 live OpenClaw 后，至少没有把多话题会话答坏。

## What Is Still Weak

### 1. The default daily path is still not “lighter and faster” enough

同一轮 live smoke 里，OpenClaw `agent --local` 的输入 prompt 仍然很厚：

- prompt tokens: `39429` 到 `41493`
- system prompt chars: `49589` 到 `49636`

这说明：

- context optimization 现在已经有内部证据
- 但还没有把宿主层的大 prompt thickness 真正打下来
- 从用户体感上，`轻快` 还没有完全兑现

### 2. `agent --local` still cannot execute the shadow decision itself

本轮 live smoke 里，shadow sidecar exports 已经能写出来，共 `6` 个。

但这些 export 的 `status` 都是 `error`，核心原因一致：

- `Plugin runtime subagent methods are only available during a gateway request.`

这意味着：

- Stage 7 / 9 的 runtime shadow / guarded decision 在当前 OpenClaw `--local` transport 下还不能完整执行
- 真正的 live decision soak 仍然需要 gateway request 路径

所以这条线现在的状态不是“不能用”，而是：

- **OpenClaw live config seam 已可用**
- **local transport full decision path 仍受宿主 runtime 限制**

### 3. User-visible gain is still narrow

Stage 9 虽然已经有 guarded opt-in seam，但目前仍然是：

- `default-off`
- `opt-in only`
- 窄条件触发

所以从用户视角，它现在更像：

- 已经准备好进入真实用户收益阶段

而不是：

- 已经默认让所有长对话明显变轻、明显变快

## User-Facing Comparison

### Before

- 只能说“我们认为 context 可以更聪明地裁剪”
- 还很难说“这件事已经可运营、可回退、可部署”
- OpenClaw live config 连这两个新能力都没法正确接受

### Now

- 可以说“这条线已经是正式工程主线，不再只是概念验证”
- 可以说“OpenClaw live config seam 已经补齐”
- 可以说“bounded、guarded、rollback-safe 的窄路径已经存在”
- 还不能说“默认用户每天已经明显更轻、更快”

## User-Value Bottom Line

如果从用户视角只问一句：

**这项工作现在是不是更有用了？**

答案是：

- **是，更有用了。**
- 但主要体现在：它已经从“研究方向”变成“可部署、可验证、可回退的产品能力雏形”。
- 还没有完全体现在：默认用户一上手就明显感觉更轻、更快。

## Recommended Next Move

下一步最值得做的不是再扩概念，而是把剩下这两个缺口收掉：

1. 用 gateway request 路径完成 Stage 7 / 9 的真实 live soak，而不是只停在 `agent --local`。
2. 继续压宿主层 prompt thickness，让 `轻快` 变成默认用户收益，而不是 operator-only evidence。

## Evidence

- [dialogue-working-set-stage7-shadow-2026-04-17.md](dialogue-working-set-stage7-shadow-2026-04-17.md)
- [dialogue-working-set-scorecard-2026-04-17.md](dialogue-working-set-scorecard-2026-04-17.md)
- [dialogue-working-set-guarded-answer-ab-2026-04-17.md](dialogue-working-set-guarded-answer-ab-2026-04-17.md)
- [dialogue-working-set-stage7-stage9-2026-04-17.md](dialogue-working-set-stage7-stage9-2026-04-17.md)

