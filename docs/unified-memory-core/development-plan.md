# Unified Memory Core Development Plan

[English](#english) | [中文](#中文)

## English

## Purpose

This document is the execution queue for `Unified Memory Core`.

It should answer one practical question clearly:

`what do we build next, in what exact order, and where should work resume today?`

Related documents:

- [../../project-roadmap.md](../../project-roadmap.md)
- [../../system-architecture.md](../../system-architecture.md)
- [../../unified-memory-core-architecture.md](../../unified-memory-core-architecture.md)
- [../../unified-memory-core-roadmap.md](../../unified-memory-core-roadmap.md)
- [deployment-topology.md](deployment-topology.md)
- [architecture/README.md](architecture/README.md)
- [roadmaps/README.md](roadmaps/README.md)
- [blueprints/README.md](blueprints/README.md)
- [testing/README.md](testing/README.md)

## Final Target

`Unified Memory Core` should become:

- a governed shared-memory foundation
- a reusable product core for OpenClaw, Codex, and future tools
- a multi-adapter system with explicit namespaces, visibility rules, and repairable artifacts
- a product that can run in embedded mode and standalone mode

## How To Use This Plan

Read this document as one ordered build queue.

Rules:

1. finish the current stage before starting the next stage
2. execute steps in numeric order
3. if a step is marked `completed`, do not reopen it unless a bug forces it
4. if a step is marked `next`, that is the exact place to resume work
5. anything outside the current stage stays deferred

## Current Position

Current status:

- `Stage 1`: completed
- `Stage 2`: completed
- current pointer: `Step 21`
- current recommendation: resume from `Stage 3`

Already implemented in the current baseline:

- shared contracts
- `Source System` MVP
- `Memory Registry` MVP
- local `source -> candidate` pipeline
- `Projection System` MVP
- `Governance System` MVP
- OpenClaw adapter runtime integration
- Codex adapter runtime integration
- reflection / daily learning baseline
- standalone runtime / CLI baseline
- audit / repair / replay / export inspect baseline
- independent execution review baseline

Execution constraints that still apply:

- keep the implementation `local-first`
- keep the implementation `network-ready`, not `network-required`
- do not jump ahead of the current step pointer

## Stage Map

| Stage | Step Range | Goal | Status |
| --- | --- | --- | --- |
| Stage 1 | `1-10` | freeze product shape and documentation baseline | `completed` |
| Stage 2 | `11-20` | complete the first local-first implementation baseline | `completed` |
| Stage 3 | `21-30` | complete the self-learning lifecycle baseline | `next` |
| Stage 4 | `31-38` | connect governed learning outputs into adapter policy use | `later` |
| Stage 5 | `39-46` | harden product operations and split-ready execution | `later` |

## Sequential Build Plan

### Stage 1. Design And Documentation Baseline

Stage complete when:

- product shape is explicit
- documents are aligned
- testing surfaces are defined

1. `completed` Freeze product naming, boundary, and repo direction.
2. `completed` Align top-level architecture and master roadmap.
3. `completed` Define first-class module boundaries.
4. `completed` Complete module architecture documents.
5. `completed` Complete module roadmaps, blueprints, and todo pages.
6. `completed` Define testing surfaces and case matrix.
7. `completed` Define deployment topology and multi-runtime model.
8. `completed` Define shared contracts for artifacts, namespace, visibility, and exports.
9. `completed` Define OpenClaw and Codex adapter boundaries.
10. `completed` Define self-learning, standalone mode, and independent-execution boundaries.

### Stage 2. Local-First Implementation Baseline

Stage complete when:

- one local-first product loop works end to end
- adapters consume governed exports
- standalone mode is usable

11. `completed` Implement shared contracts and contract tests.
12. `completed` Implement `Source System` MVP.
13. `completed` Implement `Memory Registry` MVP.
14. `completed` Implement the local `source -> candidate` pipeline and registry tests.
15. `completed` Implement `Projection System` MVP.
16. `completed` Implement `Governance System` MVP with audit / repair / replay primitives.
17. `completed` Implement OpenClaw adapter runtime integration.
18. `completed` Implement Codex adapter runtime integration.
19. `completed` Implement `Reflection System` MVP and the daily reflection baseline.
20. `completed` Implement standalone CLI, export / audit / repair / replay surfaces, and independent-execution review.

### Stage 3. Self-Learning Lifecycle Baseline

Stage complete when:

- observation candidates can move through a governed lifecycle
- promotion and decay are explicit
- learning-specific governance is testable

21. `next` Implement promotion rules for learning candidates.
22. `later` Implement decay and expiry rules for weak or stale signals.
23. `later` Implement conflict detection and conflict reporting for learned artifacts.
24. `later` Implement stable registry update rules for promoted learning artifacts.
25. `later` Add learning-specific audit reports.
26. `later` Add learning-specific replay and repair paths.
27. `later` Add time-window comparison reports for learning outcomes.
28. `later` Add regression coverage for the learning lifecycle.
29. `later` Validate OpenClaw consumption of promoted learning artifacts.
30. `later` Close the stage with one governed `observation -> stable` loop running locally end to end.

### Stage 4. Policy Adaptation And Multi-Consumer Use

Stage complete when:

- governed learning outputs can influence consumer behavior explicitly
- adapter-side policy use stays reversible and testable

31. `later` Define the `policy-input artifact` contract.
32. `later` Implement policy-input projections from promoted learning artifacts.
33. `later` Adapt OpenClaw retrieval / assembly behavior from governed learning signals.
34. `later` Adapt Codex task-side consumption from governed learning signals.
35. `later` Add policy adaptation tests and rollback protections.
36. `later` Add consumer-specific export compatibility reports.
37. `later` Validate namespace and visibility behavior across adapters for learned artifacts.
38. `later` Close the stage with one reproducible policy-adaptation loop.

### Stage 5. Product Hardening And Independent Operation

Stage complete when:

- the product is operationally maintainable
- split-ready execution is validated
- future service mode can be discussed from a stable base

39. `later` Harden standalone source adapters for file / directory / URL / image inputs.
40. `later` Add scheduled-job-friendly workflows for reflection and governance runs.
41. `later` Add self-learning maintenance workflow docs and CLI support.
42. `later` Add release-boundary validation checks.
43. `later` Add migration and repo-split rehearsal.
44. `later` Add reproducibility and rollback checks for learning exports.
45. `later` Review prerequisites for runtime API or network service mode.
46. `later` Close the stage with an independent-product readiness review.

## Current Next Build

Resume exactly from here:

1. start at `Step 21`
2. finish `Stage 3` completely before touching `Stage 4`
3. treat `Stage 4-5` as locked until `Stage 3` closes

Do not start with:

- runtime API
- multi-host network service
- advanced network-required architecture
- repo split execution work beyond what is already documented

## Review Checklist

Review this document with these questions:

1. Is the current pointer obvious enough?
2. Is every stage closed before the next one starts?
3. Is any step still too large and worth splitting again?
4. Is anything listed too early?
5. Can a maintainer resume from the step number alone?

## 中文

## 目的

这份文档是 `Unified Memory Core` 的顺序执行队列。

它应该只回答一个实际问题：

`接下来到底先做什么、后做什么、今天应该从第几步恢复？`

相关文档：

- [../../project-roadmap.md](../../project-roadmap.md)
- [../../system-architecture.md](../../system-architecture.md)
- [../../unified-memory-core-architecture.md](../../unified-memory-core-architecture.md)
- [../../unified-memory-core-roadmap.md](../../unified-memory-core-roadmap.md)
- [deployment-topology.md](deployment-topology.md)
- [architecture/README.md](architecture/README.md)
- [roadmaps/README.md](roadmaps/README.md)
- [blueprints/README.md](blueprints/README.md)
- [testing/README.md](testing/README.md)

## 最终目标

`Unified Memory Core` 最终应该成为：

- 一套受治理的共享记忆底座
- 一个可被 OpenClaw、Codex 和后续工具复用的产品核心层
- 一个具备显式 namespace、可见性规则、可修复工件的多 adapter 系统
- 一个既能嵌入宿主，也能独立运行的产品

## 怎么使用这份计划

把这份文档当成一条单线执行队列来看。

规则：

1. 先做完当前阶段，再开始下一个阶段
2. 严格按编号顺序推进
3. 标记为 `completed` 的步骤，不要重开，除非出现 bug 必须返工
4. 标记为 `next` 的步骤，就是当前准确的恢复点
5. 当前阶段之外的事项一律延后

## 当前位置

当前状态：

- `Stage 1`：已完成
- `Stage 2`：已完成
- 当前指针：`Step 21`
- 当前建议：从 `Stage 3` 恢复继续

当前 baseline 已经落地：

- shared contracts
- `Source System` MVP
- `Memory Registry` MVP
- 本地 `source -> candidate` pipeline
- `Projection System` MVP
- `Governance System` MVP
- OpenClaw adapter runtime integration
- Codex adapter runtime integration
- reflection / daily learning baseline
- standalone runtime / CLI baseline
- audit / repair / replay / export inspect baseline
- independent execution review baseline

仍然生效的执行约束：

- 实现继续保持 `local-first`
- 实现继续保持 `network-ready`，但不要求 `network-required`
- 不要跳过当前 step pointer

## 阶段总览

| 阶段 | 步骤范围 | 目标 | 状态 |
| --- | --- | --- | --- |
| Stage 1 | `1-10` | 冻结产品形态与文档基线 | `completed` |
| Stage 2 | `11-20` | 完成第一条 local-first 实现基线 | `completed` |
| Stage 3 | `21-30` | 完成 self-learning 生命周期基线 | `next` |
| Stage 4 | `31-38` | 把受治理学习结果接到 adapter 策略使用 | `later` |
| Stage 5 | `39-46` | 补齐产品运维与 split-ready 执行 | `later` |

## 顺序开发计划

### Stage 1. 设计与文档基线

阶段完成标准：

- 产品形态明确
- 文档对齐完成
- 测试面定义完成

1. `completed` 冻结产品命名、边界和仓库方向。
2. `completed` 对齐顶层架构和主 roadmap。
3. `completed` 定义一等模块边界。
4. `completed` 补齐模块架构文档。
5. `completed` 补齐模块 roadmap、blueprint 和 todo。
6. `completed` 定义 testing surfaces 和 case matrix。
7. `completed` 定义 deployment topology 和多 runtime 模型。
8. `completed` 定义 artifacts、namespace、visibility、exports 的 shared contracts。
9. `completed` 定义 OpenClaw 和 Codex adapter 边界。
10. `completed` 定义 self-learning、standalone mode、independent execution 边界。

### Stage 2. Local-First 实现基线

阶段完成标准：

- 至少一条 local-first 产品闭环可以端到端运行
- adapters 能消费 governed exports
- standalone mode 可用

11. `completed` 实现 shared contracts 与 contract tests。
12. `completed` 实现 `Source System` MVP。
13. `completed` 实现 `Memory Registry` MVP。
14. `completed` 实现本地 `source -> candidate` pipeline 与 registry tests。
15. `completed` 实现 `Projection System` MVP。
16. `completed` 实现带 audit / repair / replay primitives 的 `Governance System` MVP。
17. `completed` 实现 OpenClaw adapter runtime integration。
18. `completed` 实现 Codex adapter runtime integration。
19. `completed` 实现 `Reflection System` MVP 与 daily reflection baseline。
20. `completed` 实现 standalone CLI、export / audit / repair / replay 面和 independent-execution review。

### Stage 3. Self-Learning 生命周期基线

阶段完成标准：

- observation candidates 可以进入受治理生命周期
- promotion 和 decay 明确可见
- learning-specific governance 可测试

21. `next` 实现 learning candidates 的 promotion rules。
22. `later` 实现弱信号和陈旧信号的 decay / expiry rules。
23. `later` 实现 learned artifacts 的 conflict detection 和 conflict report。
24. `later` 实现 promoted learning artifacts 的 stable registry update rules。
25. `later` 增加 learning-specific audit reports。
26. `later` 增加 learning-specific replay / repair 路径。
27. `later` 增加 learning outcomes 的 time-window comparison reports。
28. `later` 为 learning lifecycle 增加 regression coverage。
29. `later` 验证 OpenClaw 对 promoted learning artifacts 的消费行为。
30. `later` 以一条本地端到端的 `observation -> stable` governed loop 收口本阶段。

### Stage 4. Policy Adaptation 与多消费者使用

阶段完成标准：

- 受治理学习结果可以显式影响 consumer 行为
- adapter 侧策略使用可回滚、可测试

31. `later` 定义 `policy-input artifact` contract。
32. `later` 从 promoted learning artifacts 生成 policy-input projections。
33. `later` 让 OpenClaw retrieval / assembly 消费 governed learning signals。
34. `later` 让 Codex task-side consumption 消费 governed learning signals。
35. `later` 增加 policy adaptation tests 和 rollback protections。
36. `later` 增加 consumer-specific export compatibility reports。
37. `later` 验证 learned artifacts 在跨 adapter 情况下的 namespace / visibility 行为。
38. `later` 以一条可复现的 policy-adaptation loop 收口本阶段。

### Stage 5. 产品加固与独立运行

阶段完成标准：

- 产品具备长期可运维性
- split-ready execution 经过验证
- 后续 service mode 讨论基于稳定底座进行

39. `later` 加固 file / directory / URL / image 输入的 standalone source adapters。
40. `later` 增加 reflection 与 governance runs 的 scheduled-job 友好工作流。
41. `later` 增加 self-learning maintenance workflow 文档与 CLI 支持。
42. `later` 增加 release-boundary validation checks。
43. `later` 增加 migration 和 repo-split rehearsal。
44. `later` 增加 learning exports 的 reproducibility 和 rollback checks。
45. `later` 复核 runtime API 或 network service mode 的前置条件。
46. `later` 以 independent-product readiness review 收口本阶段。

## 当前下一步

从这里恢复：

1. 从 `Step 21` 开始
2. 先完整做完 `Stage 3`
3. `Stage 3` 没收口前，不进入 `Stage 4`

当前不要开始：

- runtime API
- 多主机 network service
- advanced network-required architecture
- 已有文档之外的 repo split execution 工作

## Review Checklist

用下面几个问题 review 这份计划：

1. 当前指针是否足够明显？
2. 是否每个阶段都必须先收口，后面阶段才能开始？
3. 是否还有哪个步骤太大，应该继续拆小？
4. 是否有步骤排得太早？
5. 维护者是否只看 step number 就能恢复工作？
