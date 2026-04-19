# Codex 自动恢复提示

这份提示由 Project Assistant VS Code 宿主自动生成。

## 项目确认

- 项目名：`unified-memory-core`
- 工作区路径：`/Users/redcreen/Project/unified-memory-core`
- 最近匹配会话：`重做 Context Minor GC 体感测试 (019da335-a070-7972-b61e-6ba3a73ff633)`

如果当前线程上下文和上面的项目信息不一致，优先以上面的工作区路径为准。

## 当前任务

先读取附加的 resume 文件，确认当前 active slice，然后直接继续这个仓库里的工作。

不要重新从零做仓库总览；把下面这个 checkpoint 当成当前已知真相。

## 当前连续性

- 当前 checkpoint：`Codex VS Code live telemetry、experience-gap docs、Codex context GC state docs、current host views、targeted Codex GC tests`
- 下一动作：`保持 \`npm run umc:stage10 -- --format markdown\` 持续为绿。`
- 下一动作来源：`status.next-3`

收到这些恢复材料后，默认直接从“下一动作”切入，而不是重新开始一轮 resume 问答。

## 剩余执行任务

- `(none captured)`

除非我明确说 `做完手上工作停止`，否则默认持续推进，不要停在“等下一句指令”。

## 附加文件

- `codex-resume-pack.md`
- `continue.md`
- `handoff.md`
- `progress.md`
- `status.md`
- `plan.md`

## 恢复契约

1. 先读 `codex-resume-pack.md`、`continue.md`、`.codex/status.md`。
2. 把 `handoff.md`、`progress.md`、`.codex/plan.md` 当作辅助上下文。
3. 优先从“下一动作”进入真实实现推进，不要先回到一轮新的 resume 问答。
4. 不要把时间花在修改这个自动提交使用的 transport shim 文件上。

## 正确项目校验

1. 你当前要工作的 repo 就是上面这条 `工作区路径`。
2. 任何修改、读取、验证，都以这个工作区为准。
3. 如果你怀疑当前线程不是这个项目，先说明冲突，再按这个工作区继续。
