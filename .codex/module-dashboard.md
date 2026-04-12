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
- Active Module: Openclaw Adapter
- Main Risk: `todo.md` 当前仍是用户自留短记，不应与 `.codex/status.md` 重叠承担当前状态职责
- Active Slice: advance-openclaw-adapter-recall-quality

## Modules

| Module | Status | Completion % | Already Implemented | Remaining Steps | Next Checkpoint | Primary Entry |
| --- | --- | --- | --- | --- | --- | --- |
| Source System | baseline-complete | 85% (stable) | source contracts and manifest baseline; local-first source registration and normalization; ... | Revisit only if the next enhancement phase needs new source types or stronger replay/change inspection.; Harden additional adapters when independent-product operation requires them.; ... | Confirm whether the next enhancement phase introduces any new source requirements beyond the current local-first baseline. | [modules/source-system.md](modules/source-system.md) |
| Reflection System | baseline-complete / next-phase candidate | 78% (active) | reflection contract baseline; candidate extraction and reflection outputs; ... | Define the next self-learning phase beyond the current baseline.; Add explicit promotion, decay, and conflict behavior for learned artifacts.; ... | Name the next self-learning phase explicitly and decide whether it starts with promotion/decay rules or policy-input artifacts. | [modules/reflection-system.md](modules/reflection-system.md) |
| Memory Registry | baseline-complete | 85% (stable) | registry persistence baseline; source/candidate/stable artifact separation; ... | Define the host-neutral registry root contract and compatibility fallback.; Add richer update rules for promoted learning artifacts.; ... | Lock the host-neutral registry root and migration behavior before opening a deeper self-learning phase. | [modules/memory-registry.md](modules/memory-registry.md) |
| Projection System | baseline-complete | 85% (stable) | projection export contract baseline; visibility filtering; ... | Define the policy-input artifact contract.; Project promoted learning outputs into policy-facing artifacts.; ... | Decide the policy-input artifact shape before starting consumer-specific adaptation work. | [modules/projection-system.md](modules/projection-system.md) |
| Governance System | governing | 90% (stable) | formal audit, duplicate audit, and conflict audit; governance cycle and repair/replay primitives; ... | Keep governance signals readable and stable during ongoing work.; Add learning-specific governance reports, decay/conflict review paths, and time-window comparisons.; ... | Maintain stable governance outputs while the next plugin-runtime and learning changes are introduced. | [modules/governance-system.md](modules/governance-system.md) |
| Openclaw Adapter | active | 80% (active) | OpenClaw adapter runtime integration; memory-search phases A-E baseline; ... | Align OpenClaw runtime reads and writes with the future host-neutral canonical registry root.; Expand the next batch of stable facts and stable rules.; ... | Keep live OpenClaw behavior stable while newly aligned governance coverage moves into candidate smoke-promotion review. | [modules/openclaw-adapter.md](modules/openclaw-adapter.md) |
| Codex Adapter | baseline-complete / maintain | 95% (maintain) | Codex adapter runtime integration baseline; compatibility coverage across OpenClaw / Codex / governance surfaces; ... | Converge Codex on the same canonical registry root used by OpenClaw.; Define when Codex-specific policy adaptation should begin.; ... | Prove that Codex can read the same workspace memory from the shared canonical root. | [modules/codex-adapter.md](modules/codex-adapter.md) |

## Module Entry Rules

- 当前状态，以 [status.md](status.md) 为准
- 模块边界，以 [../docs/module-map.md](../docs/module-map.md) 为准
- 模块内状态，以 `modules/*.md` 为准
- `subprojects/*.md` 只保留给横切工作流，不替代官方模块状态
- `docs/roadmap.md` 负责总 roadmap 包装页，不负责当前执行点
- `reports/*` 负责证据和专题，不负责当前执行点

## Current Execution Order

1. 先确认 [subprojects/host-neutral-memory.md](subprojects/host-neutral-memory.md) 是否需要把 registry-root consistency 升成独立强门禁
2. 再推进 [modules/openclaw-adapter.md](modules/openclaw-adapter.md) 的 recall quality 和稳定事实扩面
3. 新的 memory-search 专项 case 一律先过 `npm run eval:smoke-promotion`
4. 继续让 [modules/governance-system.md](modules/governance-system.md) 维护 recalled context 质量，不只看 pass/fail
