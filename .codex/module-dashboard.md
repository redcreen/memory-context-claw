# Module Dashboard

## Purpose

这是当前仓库的模块级控制面总入口。

恢复时默认按这个顺序看：

1. [status.md](status.md)
2. 本文档
3. [../docs/module-map.md](../docs/module-map.md)
4. `.codex/modules/*.md`
5. `.codex/subprojects/*.md`（仅横切工作流需要时）

## Summary

- Overall: `stage transition / Stage 4 unlocked`
- Average Completion: `90%`
- Active Module: `Projection System`
- Main Risk: `policy-input artifact` contract 还未冻结
- Active Slice: `unlock-stage4-policy-adaptation-contract`

## Modules

| Module | Status | Completion % | Already Implemented | Remaining Steps | Next Checkpoint | Primary Entry |
| --- | --- | --- | --- | --- | --- | --- |
| Source System | baseline-complete | 88% (stable) | source contracts and manifest baseline; local-first source registration and normalization; replayable source artifacts | 只在 Stage 5 需要新 source type 时再回看；保持 current replay shape 稳定 | 确认 Stage 4 不需要额外 source contract | [modules/source-system.md](modules/source-system.md) |
| Reflection System | lifecycle-baseline complete / stage4 candidate | 92% (active) | reflection candidate generation; explicit promotion review; daily reflection; lifecycle metadata; learning-specific candidate evaluation | 进入 Stage 4 时，把 current candidate/review outputs 映射到 policy-input artifacts；保持 promotion/decay readable | 冻结 `policy-input artifact` contract | [modules/reflection-system.md](modules/reflection-system.md) |
| Memory Registry | lifecycle-baseline complete | 92% (stable) | source/candidate/stable separation; promotion/decay/conflict/update rules; local governed lifecycle loop | 继续 host-neutral root cutover；保持 lifecycle state transitions 和 lineage metadata 稳定 | 决定 canonical root hard-gate 与 Stage 4 export compatibility | [modules/memory-registry.md](modules/memory-registry.md) |
| Projection System | baseline-complete / stage4 next | 88% (next) | generic / OpenClaw / Codex export paths; learning metadata in exports; OpenClaw consumption validation shape | 定义 `policy-input artifact` contract；开始 consumer-specific adaptation projections | 命名并冻结 Step `31` contract | [modules/projection-system.md](modules/projection-system.md) |
| Governance System | governing / lifecycle-baseline complete | 93% (stable) | formal audit; repair/replay primitives; learning-specific audit / compare / repair / replay; OpenClaw validation | 保持 report readability；支持 Stage 4 rollback / compatibility checks | 把 Stage 3 lifecycle reports 固定成后续阶段的回归证据面 | [modules/governance-system.md](modules/governance-system.md) |
| Openclaw Adapter | active | 85% (stable) | governed export consumption; agent sub namespace; Stage 3 promoted-artifact validation | Stage 4 决定是否开始 retrieval / assembly policy adaptation | 如果它是 Stage 4 first consumer path，就定义第一条 reversible policy loop | [modules/openclaw-adapter.md](modules/openclaw-adapter.md) |
| Codex Adapter | baseline-complete / maintain | 95% (maintain) | shared namespace / registry compatibility; write-back signals into self-learning; compatibility coverage | Stage 4 决定是否开始 task-side policy adaptation | 如果它不是 first path，则保持 compatibility，不先做 consumer-local heuristics | [modules/codex-adapter.md](modules/codex-adapter.md) |

## Module Entry Rules

- 当前状态，以 [status.md](status.md) 为准
- 模块边界，以 [../docs/module-map.md](../docs/module-map.md) 为准
- 模块内状态，以 `modules/*.md` 为准
- `subprojects/*.md` 只保留给横切工作流，不替代官方模块状态
- `docs/roadmap.md` 负责 milestone 包装页，不负责当前执行点
- `reports/*` 负责证据和专题，不负责当前执行点

## Current Execution Order

1. 保持 Stage 3 lifecycle baseline 稳定
2. 定义 `policy-input artifact` contract
3. 选择 Stage 4 的 first consumer path
4. 再决定 registry-root consistency 是否升成独立强门禁
