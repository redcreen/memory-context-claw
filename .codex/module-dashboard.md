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

- Overall: stage closeout / Stage 5 complete
- Average Completion: 87%
- Active Module: Source System
- Main Risk: none at the implementation layer
- Active Slice: hold-post-stage5-roadmap-state-aligned

## Modules

| Module | Status | Completion % | Already Implemented | Remaining Steps | Next Checkpoint | Primary Entry |
| --- | --- | --- | --- | --- | --- | --- |
| Source System | stage5-complete / stable | 100% (maintain) | source contracts and manifest baseline; local-first source registration and normalization; ... | 保持 source replay / manifest shape 稳定，不为单个 consumer 做特例。; 继续让 mixed-source Stage 5 acceptance 保持绿色。; ... | Keep `umc:stage5` proving mixed-source acceptance without regressions. | [modules/source-system.md](modules/source-system.md) |
| Reflection System | stage5-compatible / stable | 60% (forming) | reflection contract baseline; candidate extraction and reflection outputs; ... | Keep promotion / decay review semantics readable in post-Stage-5 maintenance.; Add future feedback hooks only through governed artifacts, not hidden consumer-local state.; ... | Keep proving that no reflection-local shortcut is needed outside governed artifacts. | [modules/reflection-system.md](modules/reflection-system.md) |
| Memory Registry | stable / policy-fixed | 60% (forming) | registry persistence baseline; source/candidate/stable artifact separation; ... | Keep canonical root active as the default operator target.; Preserve the explicit rule that legacy divergence is advisory when runtime already resolves to canonical.; ... | Keep `registry inspect` at `operatorPolicy = adopt_canonical_root` or `canonical_root_active`; do not let later work reintroduce legacy-mirroring as a hard requirement. | [modules/memory-registry.md](modules/memory-registry.md) |
| Projection System | stage5-complete / stable | 100% (maintain) | projection export contract baseline; visibility filtering; ... | Keep consumer-specific projection differences explicit and comparable.; Avoid pushing policy behavior back into adapters outside export boundaries.; ... | Keep `export reproducibility` as a stable regression surface without changing the contract boundary. | [modules/projection-system.md](modules/projection-system.md) |
| Governance System | governing / stage5-complete | 90% (stable) | formal audit, duplicate audit, and conflict audit; governance cycle and repair/replay primitives; ... | Keep lifecycle, policy, maintenance, and split-readiness reports readable and durable.; Decide whether high-frequency lifecycle / policy outputs need a clearer durable/generated split.; ... | Carry current lifecycle + policy + maintenance reports forward as the required post-Stage-5 evidence surface. | [modules/governance-system.md](modules/governance-system.md) |
| Openclaw Adapter | stage4-complete / stable | 100% (maintain) | OpenClaw adapter runtime integration; memory-search phases A-E baseline; ... | Align OpenClaw runtime reads and writes with the future host-neutral canonical registry root.; Keep supporting context clean while Stage 4 compact-mode policy stays live.; ... | Keep live OpenClaw behavior stable while Stage 4 policy guidance becomes a fixed regression surface. | [modules/openclaw-adapter.md](modules/openclaw-adapter.md) |
| Codex Adapter | stage4-complete / stable | 100% (maintain) | Codex adapter runtime integration baseline; compatibility coverage across OpenClaw / Codex / governance surfaces; ... | Converge Codex on the same canonical registry root used by OpenClaw.; Keep task-side policy consumption on governed exports, not Codex-local heuristics.; ... | Prove that Codex can keep reading the same governed policy memory as root policy converges. | [modules/codex-adapter.md](modules/codex-adapter.md) |

## Module Entry Rules

- 当前状态，以 [status.md](status.md) 为准
- 模块边界，以 [../docs/module-map.md](../docs/module-map.md) 为准
- 模块内状态，以 `modules/*.md` 为准
- `subprojects/*.md` 只保留给横切工作流，不替代官方模块状态
- `docs/roadmap.md` 负责 milestone 包装页，不负责当前执行点
- `reports/*` 负责证据和专题，不负责当前执行点

## Current Execution Order

1. 保持 `umc:release-preflight`、`umc:openclaw-install-verify`、`umc:openclaw-itest`、`umc:stage5` 为绿
2. 做人类验收与后续提交/发布决策
3. 仅在 operator 需要时，再决定 legacy root archive / cleanup 窗口
