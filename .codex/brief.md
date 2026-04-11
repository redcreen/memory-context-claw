# Brief

## Delivery Tier

- Tier: `large`
- Why this tier: 项目已经跨越插件运行时、memory search、治理工具、回归体系、文档系统和工作区结构；当前问题不是单点功能，而是长期交付控制面缺失。
- Last reviewed: `2026-04-11`

## Outcome

把 `unified-memory-core` 维持成一层可长期维护的：

- 事实优先上下文层
- 长期记忆治理层
- 回归与质量保护层

并把当前仓库整改到一个更容易恢复、执行、交接的项目控制面。

## Scope

- 为现有仓库建立最小 `.codex` 控制面
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
- 功能改完测试通过后自动提交 git / github

## Definition of Done

- `.codex/brief.md`、`.codex/plan.md`、`.codex/status.md` 建立完成
- 项目当前状态、当前阶段、下一步顺序可在两次文件打开内恢复
- 现有主文档职责清楚：
  - `project-roadmap.md` = 主 roadmap / 总索引
  - `system-architecture.md` = 总体架构
  - `testsuite.md` = 测试入口
  - `reports/*` = 专题/报告/证据
  - `.codex/*` = 当前执行控制面
