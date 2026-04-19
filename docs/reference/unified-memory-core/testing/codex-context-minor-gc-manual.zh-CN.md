# Codex Context Minor GC 手工验收

这份文档只回答一件事：

- `Codex Context Minor GC` 在真实对话里是否已经正常工作
- 它是否真的做了 working-set 选择，而不是单纯把历史越堆越厚

适用场景：

- 你想直接在 VS Code 的 Codex 对话窗口里做人工验收
- 你想验证 topic switch 之后 context 是否明显变小
- 你想验证 durable fact / preference 没有因为裁剪而丢失
- 你想确认 branch / continue 这类场景没有明显误杀主线

## 能不能直接在当前窗口测

可以，但要分清楚你在测什么。

当前窗口适合验证：

- `switch / resolve / continue` 场景下，GC 是否会在连续对话里做选择
- topic switch 之后 context 是否相对变薄
- 回答正确性是否仍然保持

当前窗口不适合验证：

- 新线程冷启动时前几轮的 `not_enough_turns`
- “完全没有旧历史干扰”的最干净基线

如果你只想确认“换题后能不能明显缩小，而且答案没坏”，直接在当前窗口测就够了。

## 每轮看什么

优先盯这 4 个信号：

- `applied`
- `relation`
- `promptReductionRatio`
- `baseline_context_estimate` 与 `effective_context_estimate`

查看方法：

```bash
npm run codex:vscode:gc:header --silent
```

```bash
npm run codex:vscode:gc --silent
```

详细 JSON 在：

- [../../../../reports/generated/codex-vscode-context-minor-gc/live-context-size.json](../../../../reports/generated/codex-vscode-context-minor-gc/live-context-size.json)
- [../../../../reports/generated/codex-vscode-context-minor-gc/codex-telemetry.jsonl](../../../../reports/generated/codex-vscode-context-minor-gc/codex-telemetry.jsonl)

最小通过标准：

- 连续 3 到 5 轮后，至少出现一次 `applied=true`
- 一旦 `applied=true`，应看到 `effective_context_estimate < baseline_context_estimate`
- topic switch 正向 case 里，`promptReductionRatio` 最好大于 `0.12`
- 最后一问必须答对，不能因为 context 变小而把关键事实答丢

## 当前窗口测试规则

为了让当前窗口里的信号更容易读，建议固定遵守这 4 条：

- 每个 case 都带唯一前缀，例如 `[GC-A1]`
- 一个 case 跑完再切下一个，不要交叉发消息
- 中间不要插 unrelated 问题
- 每个 case 跑完后立刻看一次 `npm run codex:vscode:gc --silent`

## Case A：换题后明显缩小

目标：

- 验证 detour 结束后，GC 能把旧 raw 历史明显收薄
- 验证 durable preference 还能答对

按顺序发送：

```text
[GC-A1] 以后默认给我中文，结论优先。
```

```text
[GC-A1] 再记一下：我坐飞机喜欢靠过道。
```

```text
[GC-A1] 现在切到代码：这轮先只做 shadow，不接管主路径。
```

```text
[GC-A1] 代码 detour 已经结束。回到偏好：我坐飞机喜欢什么位置？
```

预期：

- 最后一轮答案应包含 `靠过道`
- `applied` 大概率为 `true`
- `relation` 常见为 `switch`、`resolve` 或 `continue`
- `promptReductionRatio` 最好明显大于 `0.12`

## Case B：连续对话里 context 不应一路涨

目标：

- 验证更密的多 topic 连续对话里，context 不是单调堆积
- 验证旧旅行事实能从 detour 之后正确回收

按顺序发送：

```text
[GC-B1] 我们先聊旅行。记一下：预算 2 万元，更想住京都，最好靠近地铁站。
```

```text
[GC-B1] 现在切到代码：给我一个 Python 正则，提取 foo123bar 里的数字。
```

```text
[GC-B1] 继续代码：如果只取第一个数字分组，写法怎么更短？
```

```text
[GC-B1] 先不聊代码了。刚才旅行那段里，我更想住哪座城市？
```

预期：

- 最后一轮答案应包含 `京都`
- `applied` 大概率为 `true`
- `effective_context_estimate` 应小于 `baseline_context_estimate`
- 这组通常比 Case A 更容易看出“系统做了选择”

## Case C：负例，别误杀 branch 返回

目标：

- 验证 branch return 仍然答对
- 验证系统不会为了压缩而把主线结构搞丢

按顺序发送：

```text
[GC-C1] 把发布验收拆成版本、安装、回滚三部分。
```

```text
[GC-C1] 插一句，我的时区是 Asia/Shanghai，记住。
```

```text
[GC-C1] 先回到刚才的发布验收，那三部分是什么？
```

预期：

- 回答必须包含 `版本`、`安装`、`回滚`
- 如果这里答错，说明 working-set 选择太激进
- 是否 `applied=true` 不是第一优先级，答对才是

## Case D：新事实必须赢过旧事实

目标：

- 验证最新状态覆盖旧状态
- 验证切题后回收时不会把 superseded fact 回答错

按顺序发送：

```text
[GC-D1] 记一下：我以前默认编辑器是 Vim。
```

```text
[GC-D1] 更新一下：我现在默认编辑器是 Zed。
```

```text
[GC-D1] 切个话题。为什么 shadow mode 默认先不开？
```

```text
[GC-D1] 回到编辑器问题。我现在默认编辑器是什么？
```

预期：

- 最后一轮必须回答 `Zed`
- 不能回 `Vim`
- 如果压缩发生，最新事实关系仍应保持正确

## 推荐最小集合

如果你只想在当前窗口快速验证一遍，先跑这 3 组：

1. `Case A`
2. `Case B`
3. `Case D`

这 3 组已经覆盖：

- topic switch 后 context 变薄
- 多轮 detour 后仍能回到正确事实
- 新事实覆盖旧事实

## 自动回放对照

如果手工现象和体感一致，再用仓库现成 case 做对照：

```bash
node scripts/eval-codex-context-minor-gc-live.js --format markdown
```

相关 case 定义：

- [../../../../evals/codex-context-minor-gc-live-cases.js](../../../../evals/codex-context-minor-gc-live-cases.js)
- [../../../../evals/openclaw-context-minor-gc-live-cases.js](../../../../evals/openclaw-context-minor-gc-live-cases.js)
- [../../../../evals/openclaw-guarded-live-ab-cases.js](../../../../evals/openclaw-guarded-live-ab-cases.js)

## 如果你现在就想在这个窗口开测

直接从 `Case A` 第一条开始发即可。

更具体地说：

1. 先发 `Case A` 的 4 条消息
2. 第 4 条发完后，运行一次 `npm run codex:vscode:gc --silent`
3. 看 `applied / relation / promptReductionRatio`
4. 再跑 `Case B`

如果你想把这次当前窗口测试收成一次可 grep 的记录，继续沿用同一批前缀：

- `[GC-A1]`
- `[GC-B1]`
- `[GC-C1]`
- `[GC-D1]`
