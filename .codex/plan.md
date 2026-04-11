# Plan

## Current Phase

`governed execution / module-view active`

## Slices

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

- Slice: `plan-next-core-product-phase`
  - Objective: 给 `src/unified-memory-core/` 明确下一增强 phase，而不是继续把新目标挂在 baseline 完成态
  - Dependencies: `.codex/subprojects/core-product.md`、`project-roadmap.md`
  - Risks: 产品主干长期停留在“等待下一 phase”，后续立项会继续模糊
  - Validation: 下一增强 phase 被命名，并有单独的目标与验证方式
  - Exit Condition: `core-product` 不再只写“waiting-next-phase”

## Execution Order

1. 先继续 `plugin-runtime` 的稳定事实 / 规则扩面
2. 同步维持 `memory-search governance` 与 smoke promotion
3. 再为 `core-product` 打开下一增强 phase
