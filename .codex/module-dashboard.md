# Module Dashboard

## Purpose

这是当前仓库的模块级控制面总入口。

恢复时默认按这个顺序看：

1. [status.md](status.md)
2. 本文档
3. [../docs/module-map.md](../docs/module-map.md)
4. `.codex/subprojects/*.md`

## Active Modules

| Module | Status | Main Focus | Primary Entry |
| --- | --- | --- | --- |
| Core Product | active / waiting-next-phase | 给 `src/unified-memory-core/` 规划下一增强 phase | [subprojects/core-product.md](subprojects/core-product.md) |
| Plugin Runtime | active | 扩 stable facts / rules，继续保持 clean assembly | [subprojects/plugin-runtime.md](subprojects/plugin-runtime.md) |
| Memory Governance | active | 保持 governance 指标和 smoke promotion 稳定 | [subprojects/memory-governance.md](subprojects/memory-governance.md) |

## Module Entry Rules

- 当前状态，以 [status.md](status.md) 为准
- 模块边界，以 [../docs/module-map.md](../docs/module-map.md) 为准
- 模块内下一步，以 `subprojects/*.md` 为准
- `project-roadmap.md` 负责总 roadmap，不负责当前执行点
- `reports/*` 负责证据和专题，不负责当前执行点

## Current Execution Order

1. 先从 [subprojects/plugin-runtime.md](subprojects/plugin-runtime.md) 继续扩下一批稳定事实 / 稳定规则
2. 新的 memory-search 专项 case 一律先过 `npm run eval:smoke-promotion`
3. 继续让 `memory-search governance` 维护 recalled context 质量，不只看 pass/fail
4. 为 [subprojects/core-product.md](subprojects/core-product.md) 打开下一增强 phase
