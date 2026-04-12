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

- Overall: `stage transition / Stage 5 unlocked`
- Average Completion: `94%`
- Active Module: `Source System`
- Main Risk: `Stage 5 execution order` 与 `registry-root cutover policy` 还未冻结
- Active Slice: `unlock-stage5-product-hardening-baseline`

## Modules

| Module | Status | Completion % | Already Implemented | Remaining Steps | Next Checkpoint | Primary Entry |
| --- | --- | --- | --- | --- | --- | --- |
| Source System | baseline-complete / stage5 next | 90% (next) | source contracts and manifest baseline; local-first source registration and normalization; replayable source artifacts | 打开 Stage 5 时补 file / directory / URL / image hardening，保持 source replay shape 稳定 | 命名 `Step 39` 的 source hardening slice | [modules/source-system.md](modules/source-system.md) |
| Reflection System | stage4 contract-mapped / stable | 96% (stable) | reflection candidate generation; explicit promotion review; daily reflection; lifecycle metadata; policy-input mapping through governed exports | 保持 signal extraction readable；只通过 governed artifacts 接入后续 feedback | 证明 Stage 5 不需要额外 reflection-local heuristics | [modules/reflection-system.md](modules/reflection-system.md) |
| Memory Registry | lifecycle + policy export compatible | 94% (stable) | source/candidate/stable separation; promotion/decay/conflict/update rules; lineage metadata; Stage 4 policy-export compatibility | 继续 host-neutral root cutover；保持 lineage metadata 和 stable update rules 稳定 | 决定 canonical root hard-gate | [modules/memory-registry.md](modules/memory-registry.md) |
| Projection System | stage4-complete / stable | 94% (stable) | generic / OpenClaw / Codex export paths; learning metadata; `policy-input artifact` contract; consumer policy projections | 在 Stage 5 增加 reproducibility / rollback checks，保持 policy projection 可比较 | 固定 export-level reproducibility evidence | [modules/projection-system.md](modules/projection-system.md) |
| Governance System | governing / stage4-complete | 96% (stable) | formal audit; repair/replay primitives; lifecycle audit / compare; policy compatibility / rollback report | 保持 report readability；把 Stage 4 policy audit 固定成 Stage 5 证据面 | 连接 release-boundary / reproducibility checks | [modules/governance-system.md](modules/governance-system.md) |
| Openclaw Adapter | stage4-complete / stable | 90% (stable) | governed export consumption; agent sub namespace; policy context + assembly adaptation | 保持 recall quality 干净；继续 root alignment；不要回退成 adapter-local policy state | 用 Stage 4 policy loop 作为后续回归面 | [modules/openclaw-adapter.md](modules/openclaw-adapter.md) |
| Codex Adapter | stage4-complete / stable | 97% (stable) | shared namespace / registry compatibility; write-back signals; governed `policy_block / task_defaults` | 保持 task-side consumption 走 governed policy inputs；继续 root alignment | 证明 Stage 5 不需要 consumer-local fallback heuristics | [modules/codex-adapter.md](modules/codex-adapter.md) |

## Module Entry Rules

- 当前状态，以 [status.md](status.md) 为准
- 模块边界，以 [../docs/module-map.md](../docs/module-map.md) 为准
- 模块内状态，以 `modules/*.md` 为准
- `subprojects/*.md` 只保留给横切工作流，不替代官方模块状态
- `docs/roadmap.md` 负责 milestone 包装页，不负责当前执行点
- `reports/*` 负责证据和专题，不负责当前执行点

## Current Execution Order

1. 保持 Stage 4 policy loop 稳定
2. 定义 Stage 5 的 first hardening slice
3. 决定 registry-root consistency 是否升成独立强门禁
4. 再展开 source adapters / maintenance / release-boundary 的正式执行顺序
