# Module Map

[English](#english) | [中文](#中文)

## English

## Purpose

This document is the durable module-level map for the repo.

It answers:

- what the major modules are
- which files belong to each module
- which modules are active vs maintain-only
- where to look first when resuming work

Use this together with:

- current execution state: [.codex/status.md](../.codex/status.md)
- execution order: [.codex/plan.md](../.codex/plan.md)
- top-level architecture: [system-architecture.md](../system-architecture.md)

## Module Overview

| Module | Responsibility | Main Paths | Status |
| --- | --- | --- | --- |
| Core Product | source system, reflection, registry, projection, governance core | `src/unified-memory-core/`, `test/unified-memory-core/` | active |
| Plugin Runtime | retrieval, rerank, assembly, scoring, engine behavior | `src/assembly.js`, `src/retrieval*.js`, `src/scoring.js`, `src/engine.js`, `test/assembly.test.js`, `test/retrieval*.test.js`, `test/scoring.test.js`, `test/engine.test.js` | active |
| Adapters | OpenClaw / Codex adapter bindings and compatibility | `src/openclaw-adapter.js`, `src/codex-adapter.js`, `src/adapters/README.md`, `test/openclaw-adapter.test.js`, `test/codex-adapter.test.js`, `test/adapter-compatibility.test.js` | maintain |
| Memory Governance | audits, cleanup, governance cycle, promotion signals | `src/*audit*.js`, `src/*governance*.js`, `src/session-memory-exit-audit.js`, `src/smoke-promotion.js`, `scripts/run-governance-cycle.js`, `scripts/run-memory-search-governance.js` | active |
| Distillation & Workspace | candidate extraction, conversation-memory cards, workspace memory handling | `src/conversation-memory.js`, `src/distillation-manager.js`, `scripts/distill-session-memory.js`, `scripts/apply-daily-memory.js`, `workspace/` | maintain |
| Docs & Control Surface | roadmap, architecture, testsuite, current execution control | `README.md`, `project-roadmap.md`, `system-architecture.md`, `testsuite.md`, `.codex/` | active |

## Resume Order

When resuming, read in this order:

1. [.codex/status.md](../.codex/status.md)
2. this file
3. the active subproject file under [.codex/subprojects/](../.codex/subprojects/)
4. only then the deeper roadmap / reports

## Current Active Modules

### 1. Core Product

Current focus:

- keep the product spine stable
- prepare the next enhancement phase without mixing it into old baseline docs

### 2. Plugin Runtime

Current focus:

- keep recalled context clean
- expand stable facts / stable rules carefully
- avoid introducing noisy supporting candidates

### 3. Memory Governance

Current focus:

- maintain `memory-search governance`
- use `eval:smoke-promotion` as a controlled promotion helper
- keep reports useful as evidence, not as the primary control surface

## Chinese

## 目的

这份文档是仓库的**模块视角总图**。

它回答：

- 主要模块有哪些
- 每个模块主要看哪些文件
- 哪些模块是活跃模块，哪些模块主要进入维护态
- 恢复工作时应该先看哪里

配合这些文件一起看：

- 当前执行状态：[.codex/status.md](../.codex/status.md)
- 当前执行顺序：[.codex/plan.md](../.codex/plan.md)
- 模块控制面入口：[.codex/module-dashboard.md](../.codex/module-dashboard.md)
- 总体架构：[system-architecture.md](../system-architecture.md)

## 模块总览

| 模块 | 负责内容 | 主要路径 | 当前状态 |
| --- | --- | --- | --- |
| Core Product | source system、reflection、registry、projection、治理核心 | `src/unified-memory-core/`、`test/unified-memory-core/` | active |
| Plugin Runtime | retrieval、rerank、assembly、scoring、engine 行为 | `src/assembly.js`、`src/retrieval*.js`、`src/scoring.js`、`src/engine.js`、对应 `test/` | active |
| Adapters | OpenClaw / Codex 适配层与兼容性 | `src/openclaw-adapter.js`、`src/codex-adapter.js`、`src/adapters/README.md`、对应 `test/` | maintain |
| Memory Governance | audit、cleanup、governance cycle、升格信号 | `src/*audit*.js`、`src/*governance*.js`、`src/session-memory-exit-audit.js`、`src/smoke-promotion.js`、相关 `scripts/` | active |
| Distillation & Workspace | 候选提炼、conversation-memory cards、workspace 记忆流转 | `src/conversation-memory.js`、`src/distillation-manager.js`、相关 `scripts/`、`workspace/` | maintain |
| Docs & Control Surface | roadmap、architecture、testsuite、当前执行控制面 | `README.md`、`project-roadmap.md`、`system-architecture.md`、`testsuite.md`、`.codex/` | active |

## 恢复顺序

后续恢复时，按这个顺序看：

1. [.codex/status.md](../.codex/status.md)
2. [.codex/module-dashboard.md](../.codex/module-dashboard.md)
3. 本文档
4. [.codex/subprojects/](../.codex/subprojects/) 里的活跃模块状态
5. 再去看更深的 roadmap / reports

## 当前活跃模块

### 1. Core Product

当前重点：

- 保持产品主干稳定
- 规划下一阶段增强，而不是继续把新内容塞进旧 baseline 文档

### 2. Plugin Runtime

当前重点：

- 保持 recalled context 干净
- 稳定扩新的 stable facts / stable rules
- 避免 supporting candidates 重新变脏

### 3. Memory Governance

当前重点：

- 维持 `memory-search governance`
- 用 `eval:smoke-promotion` 做保守升格建议
- 让 reports 继续作为证据，而不是当前控制面
