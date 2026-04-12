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
| Reflection System | candidate generation、daily reflection、lifecycle review inputs、reflection outputs | `src/unified-memory-core/reflection-system.js`、`src/unified-memory-core/daily-reflection.js`、对应测试 | lifecycle-baseline complete / stage4 candidate |
| Memory Registry | source / candidate / stable artifacts、lifecycle transitions 与 decision trail | `src/unified-memory-core/memory-registry.js`、对应测试 | lifecycle-baseline complete |
| Projection System | export shaping、visibility filtering、learning metadata、future consumer projection | `src/unified-memory-core/projection-system.js`、对应测试 | baseline-complete / stage4 next |
| Governance System | audit / repair / replay / governance cycle / lifecycle reporting | `src/unified-memory-core/governance-system.js`、`src/*audit*.js`、相关脚本与测试 | governing / lifecycle-baseline complete |
| OpenClaw Adapter | OpenClaw 侧 retrieval / assembly / scoring / runtime integration | `src/openclaw-adapter.js`、`src/assembly.js`、`src/retrieval*.js`、相关测试 | active |
| Codex Adapter | Codex 侧 adapter integration 与 compatibility | `src/codex-adapter.js`、对应测试 | baseline-complete / maintain |

## 恢复顺序

后续恢复时，按这个顺序看：

1. [.codex/status.md](../.codex/status.md)
2. [.codex/module-dashboard.md](../.codex/module-dashboard.md)
3. [.codex/modules/](../.codex/modules/) 里的活跃模块状态
4. 本文档
5. 再去看更深的 roadmap / reports

## 当前活跃模块

1. **Projection System**
   当前重点：定义 Stage 4 的 `policy-input artifact` contract。
2. **Governance System**
   当前重点：在 Stage 4 打开前，保持 Stage 3 lifecycle report 与 validation 稳定。
3. **Reflection System**
   当前重点：把 current candidate/review outputs 映射到未来的 policy-input contract。

## 术语边界

- `core-product` 是产品主干伞层，覆盖 `Source System`、`Reflection System`、`Memory Registry`、`Projection System`、`Governance System`。
- `plugin-runtime` 指当前面向 OpenClaw 的运行时路径，核心就是 `OpenClaw Adapter`。
- `self-learning` 不是 `core-product` 的同义词；它只是这条产品主干里最可能优先开启的下一增强方向。
