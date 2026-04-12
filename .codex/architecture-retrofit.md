# Architecture Retrofit

## Trigger

- Tier: `large`
- Active Slice: `canonical-doc-owner-convergence`
- Current Execution Line: align the control surface and durable docs with the actual canonical `docs/*` owner set
- Architecture Signal: `green`
- Escalation Gate: `continue automatically`

## Primary Symptoms

- control-surface docs and durable docs still refer to retired root doc names such as `project-roadmap.md`, `system-architecture.md`, and `testsuite.md` even though the canonical owners already live under `docs/`
- some durable links still point at nonexistent or archived paths such as `docs/unified-memory-core/*` and `RELEASE.md`
- the detailed `docs/reference/unified-memory-core/architecture/*` tree is legitimate reference material, but stale retrofit notes still treat it as a competing owner set instead of the deeper reference stack

## Root-Cause Drivers

- Root Cause Hypothesis: the earlier docs retrofit moved the file tree, but naming convergence across control-surface docs, durable wrappers, and deeper references did not fully close
- Signal Basis: the same architectural questions were answered by both the current `docs/*` wrappers and retired root-level names, which made the owner set ambiguous
- Correct Layer: control surface, durable docs, release navigation, and reference-link maintenance
- Rejected Shortcut: updating only a few visible wrappers while leaving deeper durable docs on stale names

## Affected Boundaries

- control surface (`.codex/plan.md`, `.codex/status.md`, `.codex/brief.md`)
- canonical architecture ownership (`docs/architecture*.md`, `docs/roadmap*.md`, `docs/test-plan*.md`, and doc-governance question owners)
- module layer (`.codex/module-dashboard.md` and `.codex/modules/*.md`)
- release and docs landing pages
- reference and workstream docs that still point to retired names

## Current Architecture Sources

- Canonical Owners:
- docs/architecture.md
- docs/architecture.zh-CN.md
- docs/roadmap.md
- docs/roadmap.zh-CN.md
- docs/test-plan.md
- docs/test-plan.zh-CN.md
- docs/module-map.md
- docs/module-map.zh-CN.md
- docs/reference/code-memory-binding-architecture.md
- docs/workstreams/host-neutral-memory/architecture.md
- docs/workstreams/memory-search/architecture.md
- docs/workstreams/self-learning/architecture.md
- Detailed Reference Stack:
- docs/reference/unified-memory-core/architecture/README.md
- docs/reference/unified-memory-core/roadmaps/README.md
- docs/reference/unified-memory-core/testing/README.md
- Archived Predecessors:
- docs/archive/unified-memory-core-architecture.md
- docs/archive/unified-memory-core-roadmap.md
- docs/archive/unified-memory-core.md

## Current Risks / Open Decisions

- archive 内部仍会保留历史命名；这是可接受的历史痕迹，不再作为 active owner 处理
- canonical-root operator policy 已显式收口：`~/.unified-memory-core/registry` 是默认目标，只有 `legacy_fallback` 或 canonical root 缺失才算真正 block；这不再是未决设计问题
- 剩余的产品侧决定只有 operator 是否以及何时 archive / cleanup 过时的 legacy root 副本；这不是本次文档 owner 收敛的 blocker
- 后续维护仍需防止文档重新把 legacy divergence 表述成独立 hard gate；这属于持续一致性风险，而不是架构未定

## Target Architecture

- Keep one canonical architecture owner set and make all other architecture-like docs either reference, workstream, or archive material.
- Keep the current `docs/*` wrappers as the first answer for top-level architecture, roadmap, module, and test questions.
- Treat `docs/reference/unified-memory-core/*` as the detailed reference stack, not as a competing public owner set.
- Ensure the control surface, durable docs, release checklist, and bilingual landing pages all use the same canonical names.

## Retrofit Scope

- refresh control-surface docs so they point to the real durable owners now in `docs/`
- normalize durable wrappers and release docs to the current canonical paths
- update non-archive reference/workstream docs that still rely on retired root-level names
- leave archive content historical, but stop non-archive docs from competing with the canonical owner set

## Execution Strategy

- audit non-archive docs for stale owner names and broken durable links
- update control-surface files before touching deeper references so the canonical owner set is explicit
- converge durable wrappers and workstream/reference docs onto the same naming model
- validate by rescanning non-archive docs for retired names and checking the touched navigation links

## Validation

- non-archive docs no longer use retired owner names such as `project-roadmap.md`, `system-architecture.md`, or `testsuite.md` except for clearly historical archive references
- docs and release landing pages resolve to existing files instead of nonexistent placeholders such as `RELEASE.md`
- control-surface docs and module/dashboard notes use the same canonical owner set
- architecture retrofit note reflects the actual remaining risks instead of already-fixed historical symptoms

## Exit Conditions

- one canonical architecture owner set answers the main architecture question
- non-archive durable docs no longer compete with retired root-level names
- control-surface artifacts reflect the corrected layer and root cause
- module boundaries, ownership, and progress artifacts match the target architecture naming

## Usable Now

- 恢复当前状态与下一步
- 模块视角进展面板
- 公开文档中英文切换
- 一套一致的 `docs/*` canonical owner 命名
