# Brief

## Delivery Tier

- Tier: `large`
- Why this tier: 项目已经跨越插件运行时、memory search、治理工具、回归体系、文档系统和工作区结构；当前问题不是单点功能，而是跨模块架构边界、控制面与耐久文档需要持续收敛。
- Last reviewed: `2026-04-12`

## Outcome

把 `unified-memory-core` 维持成一层可长期维护的：

- 事实优先上下文层
- 长期记忆治理层
- 回归与质量保护层

并把当前仓库整改到一个更容易恢复、执行、交接的项目控制面。

## Scope

- 维持现有 `.codex` 控制面与耐久文档的一致性
- 明确主控制源与耐久文档边界
- 把后续工作固定到可执行顺序
- 继续沿既有 roadmap 扩稳定事实、治理 memory search、保持 smoke / governance 健康

## Non-Goals

- 不替换 OpenClaw 宿主内置 `memory_search`
- 不重写现有 docs 体系
- 不在这次整改里大规模移动 `reports/` 或历史证据文件
- 不修改其他插件或宿主实现

## Constraints

- 只做本项目和接口层整改，不改宿主
- 仓库内 Markdown 链接保持相对路径
- 文档要简洁，避免重复维护多个“当前状态”来源
- 运行时代码改动后必须测试并部署到本地 OpenClaw
- 不自动提交 git / github；是否提交由用户明确决定

## Definition of Done

- `.codex/brief.md`、`.codex/plan.md`、`.codex/status.md` 与当前仓库状态保持同步
- 项目当前状态、当前阶段、下一步顺序可在两次文件打开内恢复
- 现有主文档职责清楚：
  - `docs/roadmap.md` = 主 roadmap 包装页 / 里程碑入口
  - `docs/architecture.md` = 总体架构包装页
  - `docs/test-plan.md` = 测试入口
  - `docs/module-map.md` = 官方模块边界
  - `reports/*` = 专题/报告/证据
  - `.codex/*` = 当前执行控制面
