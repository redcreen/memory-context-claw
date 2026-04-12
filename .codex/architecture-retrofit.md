# Architecture Retrofit

## Trigger

- Tier: `large`
- Active Slice: `openclaw-adapter recall quality / natural-query governance expansion`
- Current Execution Line: n/a
- Architecture Signal: `yellow`
- Escalation Gate: `raise but continue`

## Primary Symptoms

- duplicate architecture-like docs exist outside the canonical owner set: docs/unified-memory-core/architecture/README.md, docs/unified-memory-core/architecture/codex-adapter.md, docs/unified-memory-core/architecture/governance-system.md, docs/unified-memory-core/architecture/independent-execution.md
- root markdown clutter is still present: project-roadmap.md, system-architecture.md
- blockers or open decisions are still recorded: `todo.md` 当前仍是用户自留短记，不应与 `.codex/status.md` 重叠承担当前状态职责
- architecture signal is yellow: current execution line is missing an objective; execution task board is missing; open blockers or architectural risks are still recorded

## Root-Cause Drivers

- Root Cause Hypothesis: the repo can drift back to local fixes if the current slice loses a visible architectural checkpoint
- Signal Basis: current execution line is missing an objective; execution task board is missing; open blockers or architectural risks are still recorded
- Correct Layer: control surface, validators, and reporting
- Rejected Shortcut: letting execution continue without a visible architecture signal

## Affected Boundaries

- control surface (`.codex/plan.md`, `.codex/status.md`, `.codex/brief.md`)
- canonical architecture ownership (`docs/architecture*.md` and doc-governance question owners)
- execution slices and architecture supervision state
- tests and validation gates that enforce the intended architecture
- module layer (`.codex/module-dashboard.md` and `.codex/modules/*.md`)
- legacy or competing architecture documents that need demotion, merge, move, or archive

## Current Architecture Sources

- Canonical Owners:
- docs/architecture.md
- docs/architecture.zh-CN.md
- docs/reference/code-memory-binding-architecture.md
- docs/workstreams/host-neutral-memory/architecture.md
- docs/workstreams/memory-search/architecture.md
- docs/workstreams/self-learning/architecture.md
- Additional Architecture-Like Docs:
- docs/unified-memory-core/architecture/README.md
- docs/unified-memory-core/architecture/codex-adapter.md
- docs/unified-memory-core/architecture/governance-system.md
- docs/unified-memory-core/architecture/independent-execution.md
- docs/unified-memory-core/architecture/memory-registry.md
- docs/unified-memory-core/architecture/openclaw-adapter.md
- docs/unified-memory-core/architecture/projection-system.md
- docs/unified-memory-core/architecture/reflection-system.md
- docs/unified-memory-core/architecture/source-system.md
- docs/unified-memory-core/architecture/standalone-mode.md
- system-architecture.md

## Current Risks / Open Decisions

- `todo.md` 当前仍是用户自留短记，不应与 `.codex/status.md` 重叠承担当前状态职责
- 是否要把 `reports/` 下部分高频专题文档再进一步按 `durable` / `generated` 分层，目前尚未执行
- canonical root 何时从 legacy fallback 正式切到 `~/.unified-memory-core/registry`，仍需明确迁移窗口
- 是否还要把 registry-root consistency 升成独立强门禁，目前仍待决定；但它已进入常规 governance cycle

## Target Architecture

- Keep one canonical architecture owner set and make all other architecture-like docs either reference, workstream, or archive material.
- Ensure execution, validation, and reporting all reflect the same root-cause hypothesis and correct layer.
- When the repo has first-class modules, keep the module layer aligned with the target architecture instead of letting module docs drift away from the source of truth.
- Treat architecture retrofit as a boundary correction exercise, not a chain of local bug fixes.

## Retrofit Scope

- move the architectural source of truth to one canonical owner set and demote duplicates to reference or archive
- replace local-only fixes with a reusable mechanism in the correct layer
- align execution slices, documentation, tests, and gates with the corrected architecture direction
- refresh progress and handoff outputs so the corrected architecture remains visible during execution
- realign module boundaries, ownership, and module progress artifacts to the target architecture

## Execution Strategy

- audit the current architecture signal, canonical owner docs, and duplicate architecture-like documents
- merge, move, or archive duplicate architecture owners so one primary architecture surface remains
- write down the target boundaries, correct layer, and rejected shortcuts before editing implementation details
- slice the retrofit so each slice changes one meaningful boundary and has explicit validation
- run `deep` gates during convergence and `release` gates before any architecture-sensitive release

## Validation

- `python3 scripts/validate_gate_set.py /path/to/repo --profile deep` passes
- architecture signal is green or explicitly justified before closing the retrofit
- release-sensitive changes also pass `python3 scripts/validate_gate_set.py /path/to/repo --profile release`
- progress and handoff reflect the corrected architecture signal and active execution line
- module dashboard and module files still match the corrected architecture boundaries

## Exit Conditions

- one canonical architecture owner set answers the main architecture question
- duplicate or conflicting architecture docs no longer compete as active owners
- execution slices and control-surface artifacts reflect the corrected layer and root cause
- the retrofit leaves behind fewer local-only fixes and clearer boundaries than it started with
- module boundaries, ownership, and progress artifacts match the target architecture

## Usable Now

- 恢复当前状态与下一步
- 模块视角进展面板
- 公开文档中英文切换
