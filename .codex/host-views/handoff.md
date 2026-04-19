# 项目助手交接

## 摘要
| 项目 | 当前值 |
| --- | --- |
| 仓库 | `/Users/redcreen/Project/unified-memory-core` |
| 层级 | `大型` |
| 当前阶段 | stage11-context-minor-gc-user-visible-closeout-reopened |
| 当前切片 | group-11g-host-visible-validation-and-closeout |
| 当前执行线 | 只解决“用户体感不明显”的问题；先把宿主增长源控住，再把 carry-forward 收成 summary-first，最后用 host-visible 指标重新判定 closeout |
| 执行进度 | `0 / 0` |
| 架构信号 | `黄色` |
| 自动触发 | 当前没有自动触发 |
| 升级 Gate | `提醒后继续` |
| 战略方向 | 保持 post-Stage-5 路线图状态对齐 |
| 战略状态 | `活跃` |
| 下一战略检查 | 确认 roadmap、development plan、当前切片和 Next 3 仍在同一条主线里。 |
| 程序编排方向 | 保持 post-Stage-5 路线图状态对齐 |
| 程序编排状态 | `活跃` |
| 下一程序检查 | 确认当前 active slice、执行线和 supporting backlog 仍保持同一套排序真相。 |
| 长期交付方向 | 收口阶段 / Stage 5 已完成 |
| 长期交付状态 | `活跃` |
| 下一长期交付检查 | 确认每轮 checkpoint 都会刷新 status / progress / continue / handoff，而不是只更新其中一部分。 |
| PTL 监督方向 | 收口阶段 / Stage 5 已完成 |
| PTL 监督状态 | `活跃` |
| 下一 PTL 检查 | 确认 worker 停下后，PTL 能从 durable 真相恢复当前工作，而不是退回聊天记忆。 |
| worker 接续方向 | 收口阶段 / Stage 5 已完成 |
| worker 接续状态 | `活跃` |
| 下一 handoff 检查 | 确认 worker 停下后的接续、回流和升级都能靠 durable 真相完成。 |
| 当前模块 | `来源系统` |
| 当前主要风险 | raw `openclaw memory search` transport 仍是显式 watchlist：`3/8 raw ok`，其余为 `4` 条 `missing_json_payload` 与 `1` 条 `empty_results` |
| 升级原因 | 当前方向可以继续，但监督状态需要保持可见 |

## Usable Now
- 恢复当前状态与下一步
- 默认架构监督与升级 gate
- 文档整改与 Markdown 治理
- 开发日志索引与自动沉淀
- 战略评估层与 review contract
- 程序编排层与 durable program board
- 长期受监督交付层与 checkpoint rhythm
- PTL 监督环与持续巡检 contract
- worker 接续与回流 contract
- 统一工具前门、版本 preflight 与结构化入口 contract
- 模块视角进展面板
- 公开文档中英文切换

## Human Windows
### Chinese
- `项目助手 菜单`
- `项目助手 进展`
- `项目助手 架构`
- `项目助手 开发日志`

### English
- `project assistant menu`
- `project assistant progress`
- `project assistant architecture`
- `project assistant devlog`

## Restore Order
1. `.codex/status.md`
2. `.codex/plan.md`
3. `.codex/strategy.md`
4. `.codex/program-board.md`
5. `.codex/delivery-supervision.md`
6. `.codex/module-dashboard.md`
7. `.codex/ptl-supervision.md`
8. `.codex/worker-handoff.md`

## Copy-Paste Commands

### Chinese
```text
项目助手 继续。先读取 .codex/status.md、.codex/plan.md、.codex/strategy.md、.codex/program-board.md、.codex/delivery-supervision.md、.codex/module-dashboard.md、.codex/ptl-supervision.md、.codex/worker-handoff.md；然后继续当前执行线：只解决“用户体感不明显”的问题；先把宿主增长源控住，再把 carry-forward 收成 summary-first，最后用 host-visible 指标重新判定 closeout。
项目助手 告诉我这个项目当前进展，用全局视角、模块视角和图示输出。
项目助手 继续当前执行线，并先运行验证：npm test；补充检查：npm run eval:smoke-promotion。
```

### English
```text
project assistant continue. Read .codex/status.md, .codex/plan.md, .codex/strategy.md, .codex/program-board.md, .codex/delivery-supervision.md, .codex/module-dashboard.md, .codex/ptl-supervision.md, .codex/worker-handoff.md first; then continue the current execution line: stage11-context-minor-gc-user-visible-closeout-reopened / group-11g-host-visible-validation-and-closeout.
project assistant progress
project assistant continue the current execution line and run validation first: npm test; extra checks: npm run eval:smoke-promotion.
```

## Next 3 Actions
1. 保持 `npm run umc:stage10 -- --format markdown` 持续为绿。
2. 保持 Docker hermetic baseline、Stage 7、Stage 8、Stage 9、Stage 10 的证据面一致。
3. 只有在新的明确产品目标出现时，才打开新的编号阶段。

## Notes
- Start a new thread with this output and the repo path when you need a clean context.
- For large projects, read `.codex/module-dashboard.md` before `modules/*.md` after restore.
- 如果使用中文继续，也可以直接复制上面的中文命令。
