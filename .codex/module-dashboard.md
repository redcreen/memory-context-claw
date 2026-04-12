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

- Overall: `stage closeout / Stage 5 complete`
- Average Completion: `98%`
- Active Module: `Governance System`
- Main Risk: `registry-root cutover policy` 仍是后续 operator 决策项
- Active Slice: `hold-release-preflight-evidence-stable`

## Modules

| Module | Status | Completion % | Already Implemented | Remaining Steps | Next Checkpoint | Primary Entry |
| --- | --- | --- | --- | --- | --- | --- |
| Source System | stage5-complete / stable | 98% (stable) | source contracts；local-first source registration；replayable artifacts；`file / directory / url / image` hardening；multi-source manifest support | 保持 source replay shape 稳定 | 用 `umc:stage5` 持续证明 mixed-source acceptance 不回退 | [modules/source-system.md](modules/source-system.md) |
| Reflection System | stable / maintenance | 97% (stable) | reflection candidate generation；explicit promotion review；daily reflection；lifecycle metadata；new source payloads continue through governed artifacts | 保持 signal extraction readable | 证明 later phase 不需要 reflection-local shortcut | [modules/reflection-system.md](modules/reflection-system.md) |
| Memory Registry | stable / cutover-watch | 95% (stable) | lifecycle lineage；promotion/decay/conflict/update rules；policy-export compatibility；migration rehearsal compatibility | 明确 canonical root cutover 与 hard-gate policy | 决定 registry-root operator policy | [modules/memory-registry.md](modules/memory-registry.md) |
| Projection System | stage5-complete / stable | 98% (stable) | generic / OpenClaw / Codex exports；policy inputs；payload fingerprints；reproducibility evidence | 保持 export-level reproducibility 为绿 | 固定 `export reproducibility` audit 为后续证据面 | [modules/projection-system.md](modules/projection-system.md) |
| Governance System | stage5-complete / monitoring | 98% (stable) | lifecycle audit；policy audit；repair/replay；maintenance workflow；release-boundary and split-readiness evidence；release-preflight gate | 保持报告可读 | 用 `umc:release-preflight` 继续证明 operator path 稳定 | [modules/governance-system.md](modules/governance-system.md) |
| Openclaw Adapter | stable / regression-held | 95% (stable) | governed export consumption；policy context + assembly adaptation；host smoke path；real bundle install path | 保持 recall quality、host smoke、bundle install 稳定 | 持续通过 `umc:openclaw-itest` 与 `umc:openclaw-install-verify` | [modules/openclaw-adapter.md](modules/openclaw-adapter.md) |
| Codex Adapter | stable / regression-held | 98% (stable) | shared namespace / registry compatibility；governed `policy_block / task_defaults`；Stage 5 reproducibility compatibility | 保持 task-side consumption 走 governed inputs | 在 later phase 之前不引入 consumer-local fallback heuristics | [modules/codex-adapter.md](modules/codex-adapter.md) |

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
3. 决定 registry-root consistency 是否升成独立强门禁
