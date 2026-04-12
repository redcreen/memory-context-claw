# Module Map

[English](module-map.md) | [中文](module-map.zh-CN.md)

## 目的

这份文档是仓库的**官方模块视角总图**。

它回答：

- 主要模块有哪些
- 每个模块主要看哪些文件
- 哪些官方一等模块是活跃模块，哪些模块主要进入维护态
- 恢复工作时应该先看哪里

配合这些文件一起看：

- 当前执行状态：[.codex/status.md](../.codex/status.md)
- 当前执行顺序：[.codex/plan.md](../.codex/plan.md)
- 模块控制面入口：[.codex/module-dashboard.md](../.codex/module-dashboard.md)
- 总体架构包装页：[architecture.zh-CN.md](architecture.zh-CN.md)

## 模块总览

| 模块 | 负责内容 | 主要路径 | 当前状态 |
| --- | --- | --- | --- |
| Source System | 受控 source ingestion、normalization、replayable source artifacts | `src/unified-memory-core/source-system.js`、对应 `test/unified-memory-core/` | baseline-complete |
| Reflection System | candidate generation、daily reflection、lifecycle review inputs、reflection outputs | `src/unified-memory-core/reflection-system.js`、`src/unified-memory-core/daily-reflection.js`、对应测试 | stage4 contract-mapped / stable |
| Memory Registry | source / candidate / stable artifacts、lifecycle transitions 与 decision trail | `src/unified-memory-core/memory-registry.js`、对应测试 | lifecycle + policy export compatible |
| Projection System | export shaping、visibility filtering、learning metadata、consumer policy projection | `src/unified-memory-core/projection-system.js`、`src/unified-memory-core/policy-adaptation.js`、对应测试 | stage4-complete / stable |
| Governance System | audit / repair / replay / governance cycle / lifecycle + policy reporting | `src/unified-memory-core/governance-system.js`、`src/*audit*.js`、相关脚本与测试 | governing / stage4-complete |
| OpenClaw Adapter | OpenClaw 侧 retrieval / assembly / scoring / runtime integration | `src/openclaw-adapter.js`、`src/assembly.js`、`src/retrieval*.js`、相关测试 | stage4-complete / stable |
| Codex Adapter | Codex 侧 adapter integration 与 compatibility | `src/codex-adapter.js`、对应测试 | stage4-complete / stable |

## 恢复顺序

后续恢复时，按这个顺序看：

1. [.codex/status.md](../.codex/status.md)
2. [.codex/module-dashboard.md](../.codex/module-dashboard.md)
3. [.codex/modules/](../.codex/modules/) 里的活跃模块状态
4. 本文档
5. 再去看更深的 roadmap / reports

## 当前活跃模块

1. **Source System**
   当前重点：打开 `Step 39` 的 source-adapter hardening。
2. **Governance System**
   当前重点：在 Stage 5 打开时，保持 Stage 4 policy evidence 稳定。
3. **Projection System**
   当前重点：把 policy-export reproducibility 带进 Stage 5，但不改变 contract 边界。

## 术语边界

- `core-product` 是产品主干伞层，覆盖 `Source System`、`Reflection System`、`Memory Registry`、`Projection System`、`Governance System`。
- `plugin-runtime` 指当前面向 OpenClaw 的运行时路径，核心就是 `OpenClaw Adapter`。
- `self-learning` 不是 `core-product` 的同义词；它只是这条产品主干里最可能优先开启的下一增强方向。
