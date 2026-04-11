# Plan

## Current Phase

`retrofit / control-surface alignment`

## Slices

- Slice: `establish-control-surface`
  - Objective: 建立 `.codex` 最小控制面，让项目目标、当前阶段、下一步顺序有单一入口
  - Dependencies: 当前主文档已存在且可读
  - Risks: 如果与现有 roadmap / todo 职责重复，会造成新的控制面冲突
  - Validation: `.codex/brief.md`、`.codex/plan.md`、`.codex/status.md` 都能独立回答目标/阶段/下一步
  - Exit Condition: `.codex` 文件落地，且职责边界明确

- Slice: `stabilize-memory-search-governance`
  - Objective: 继续保持 `memory search` 从“能答对”推进到“上下文纯度稳定”
  - Dependencies: `reports/memory-search-governance-latest.json`、`eval:smoke-promotion`
  - Risks: 新增 case 升格过快，导致 smoke 面变脆
  - Validation: `npm run eval:memory-search:governance -- --write`、`npm run eval:smoke-promotion`
  - Exit Condition: 新 stable fact/rule 的升格有明确建议规则，不靠临时判断

- Slice: `expand-stable-facts-and-rules`
  - Objective: 继续把新的稳定事实 / 稳定规则扩进 smoke 与 stable card
  - Dependencies: 现有 retrieval / assembly / smoke 体系
  - Risks: notes 或概念卡再次变成噪音来源
  - Validation: `npm run smoke:eval`、相关 targeted tests
  - Exit Condition: 新增事实/规则进入 stable card，并有清晰验证与文档同步

## Execution Order

1. 先完成 `.codex` 控制面整改
2. 再继续 `memory search` 治理与 smoke promotion
3. 然后扩下一批稳定事实 / 稳定规则
