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

- Overall: governed execution / module-view active
- Average Completion: 85%
- Active Module: Memory Registry / Adapter Boundary
- Main Risk: host-neutral registry 迁移如果处理不好，会让 live OpenClaw 路径与未来 Codex 共享路径继续分叉
- Active Slice: host-neutral registry-root hardening implemented; monitor live topology and decide cutover

## Modules

| Module | Status | Completion % | Already Implemented | Remaining Steps | Next Checkpoint | Primary Entry |
| --- | --- | --- | --- | --- | --- | --- |
| Source System | baseline-complete | 85% (stable) | source contracts and manifest baseline; local-first source registration and normalization; ... | Revisit only if the next enhancement phase needs new source types or stronger replay/change inspection.; Harden additional adapters when independent-product operation requires them.; ... | Confirm whether the next enhancement phase introduces any new source requirements beyond the current local-first baseline. | [modules/source-system.md](modules/source-system.md) |
| Reflection System | baseline-complete / next-phase candidate | 78% (active) | reflection contract baseline; candidate extraction and reflection outputs; ... | Define the next self-learning phase beyond the current baseline.; Add promotion, decay, and conflict behavior for learned artifacts.; ... | Name the next self-learning phase explicitly and decide whether it starts with promotion/decay rules or policy-input artifacts. | [modules/reflection-system.md](modules/reflection-system.md) |
| Memory Registry | baseline-complete | 85% (stable) | registry persistence baseline; source/candidate/stable artifact separation; ... | Add update rules for promoted learning artifacts.; Refine conflict and superseded-record handling for future learning phases.; ... | Lock the promoted-learning update rules before opening a deeper self-learning phase. | [modules/memory-registry.md](modules/memory-registry.md) |
| Projection System | baseline-complete | 85% (stable) | projection export contract baseline; visibility filtering; ... | Define the policy-input artifact contract.; Project promoted learning outputs into policy-facing artifacts.; ... | Decide the policy-input artifact shape before starting consumer-specific adaptation work. | [modules/projection-system.md](modules/projection-system.md) |
| Governance System | governing | 90% (stable) | formal audit, duplicate audit, and conflict audit; governance cycle and repair/replay primitives; ... | Keep governance signals readable and stable during ongoing work.; Add learning-specific governance reports and repair paths when the next learning phase begins.; ... | Maintain stable governance outputs while the next plugin-runtime and learning changes are introduced. | [modules/governance-system.md](modules/governance-system.md) |
| Openclaw Adapter | active | 80% (active) | OpenClaw adapter runtime integration; memory-search phases A-E baseline; ... | Expand the next batch of stable facts and stable rules.; Keep supporting context clean while expanding recall coverage.; ... | Promote the next stable-fact batch without making the smoke surface brittle. | [modules/openclaw-adapter.md](modules/openclaw-adapter.md) |
| Codex Adapter | baseline-complete / maintain | 95% (maintain) | Codex adapter runtime integration baseline; compatibility coverage across OpenClaw / Codex / governance surfaces; ... | Define when Codex-specific policy adaptation should begin.; Validate future consumer-specific exports once policy-input artifacts exist.; ... | Reopen this module when the policy-input artifact contract is defined. | [modules/codex-adapter.md](modules/codex-adapter.md) |

## Cross-Cutting Subprojects

| Subproject | Status | Goal | Primary Entry |
| --- | --- | --- | --- |
| Host-Neutral Memory | implementation-active / migration-and-governance-ready | decouple canonical storage from OpenClaw host semantics and converge OpenClaw / Codex on one shared registry | [subprojects/host-neutral-memory.md](subprojects/host-neutral-memory.md) |
| Core Product | baseline-complete / next-phase candidate | keep the shared memory product core independent from any one adapter | [subprojects/core-product.md](subprojects/core-product.md) |
| Plugin Runtime | active | keep OpenClaw retrieval / assembly clean while runtime behavior evolves | [subprojects/plugin-runtime.md](subprojects/plugin-runtime.md) |
| Memory Governance | stable | keep governance readable, low-noise, and comparable | [subprojects/memory-governance.md](subprojects/memory-governance.md) |

## Module Entry Rules

- 当前状态，以 [status.md](status.md) 为准
- 模块边界，以 [../docs/module-map.md](../docs/module-map.md) 为准
- 模块内状态，以 `modules/*.md` 为准
- `subprojects/*.md` 只保留给横切工作流，不替代官方模块状态
- `project-roadmap.md` 负责总 roadmap，不负责当前执行点
- `reports/*` 负责证据和专题，不负责当前执行点

## Current Execution Order

1. 先确认 [subprojects/host-neutral-memory.md](subprojects/host-neutral-memory.md) 是否需要把 registry-root consistency 升成独立强门禁
2. 再推进 [modules/openclaw-adapter.md](modules/openclaw-adapter.md) 的 recall quality 和稳定事实扩面
3. 新的 memory-search 专项 case 一律先过 `npm run eval:smoke-promotion`
4. 继续让 [modules/governance-system.md](modules/governance-system.md) 维护 recalled context 质量，不只看 pass/fail
