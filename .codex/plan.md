# Plan

## Current Phase

`governed execution / module-view active`

## Slices

- Slice: `advance-openclaw-adapter-recall-quality`
  - Objective: 继续扩稳定事实 / 稳定规则，同时保持 recalled context 干净
  - Dependencies: `.codex/modules/openclaw-adapter.md`、smoke surfaces、promotion helper
  - Risks: supporting context 再次变脏，或 smoke 面扩张过快
  - Validation: `npm run smoke:eval`、相关 targeted tests、`npm run eval:smoke-promotion`
  - Exit Condition: 新 stable facts / rules 进入稳定面，并保持 smoke 质量稳定

- Slice: `stabilize-memory-search-governance`
  - Objective: 继续保持 `memory search` 从“能答对”推进到“上下文纯度稳定”
  - Dependencies: `reports/memory-search-governance-latest.json`、`eval:smoke-promotion`
  - Risks: 新增 case 升格过快，导致 smoke 面变脆
  - Validation: `npm run eval:memory-search:governance -- --write`、`npm run eval:smoke-promotion`
  - Exit Condition: 新 stable fact/rule 的升格有明确建议规则，不靠临时判断

- Slice: `plan-next-learning-phase`
  - Objective: 给 `reflection-system` 主导的下一增强 phase 明确命名、范围和验证方式
  - Dependencies: `.codex/modules/reflection-system.md`、`.codex/modules/projection-system.md`、`.codex/modules/memory-registry.md`、`project-roadmap.md`
  - Risks: 产品主干长期停留在“等待下一 phase”，后续立项继续模糊
  - Validation: 下一增强 phase 被命名，并有单独的目标与验证方式
  - Exit Condition: 相关模块不再只写“waiting next phase”

## Execution Order

1. 先继续 `openclaw-adapter` 的稳定事实 / 规则扩面
2. 同步维持 `governance-system` 与 smoke promotion
3. 再为 `reflection-system` 打开下一增强 phase
