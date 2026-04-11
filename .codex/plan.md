# Plan

## Current Phase

`governed execution / module-view operation`

## Slices

- Slice: `operate-from-module-view`
  - Objective: 后续恢复和执行默认从模块地图与子项目状态出发，而不是先掉进散乱报告
  - Dependencies: `.codex/module-dashboard.md`、`docs/module-map.md`、`.codex/subprojects/*.md`
  - Risks: 如果主入口文档不挂模块入口，控制面会重新失效
  - Validation: 恢复时优先读取模块 dashboard、模块地图与子项目状态即可判断当前执行点
  - Exit Condition: README / COMMANDS / status 都把模块视角作为默认入口

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

1. 先完成模块视角控制面的收口与入口接线
2. 再继续 `memory search` 治理与 smoke promotion
3. 然后扩下一批稳定事实 / 稳定规则
