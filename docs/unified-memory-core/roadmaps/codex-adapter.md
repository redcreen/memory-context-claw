# Codex Adapter Roadmap

[English](#english) | [中文](#中文)

## English

## Goal

Make Codex a first-class consumer of governed shared memory.

Current status:

- `step-9 design package complete`
- implementation is the next phase

## Phases

### Phase 1. Binding model

- user / project / namespace binding
- code-memory scope model
- adapter contract
- local-first multi-runtime binding rules

### Phase 2. Read and write loops

- read-before-task flow
- write-after-task event flow
- governed write-back reviewability
- shared-workspace-safe write serialization

### Phase 3. Workflow hardening

- coding-task projection tuning
- compatibility checks
- shared code-memory regression tests
- future shared-registry readiness checks

## Exit Criteria

- Codex can read governed code memory before tasks
- Codex can emit governed write-back events after tasks
- OpenClaw and Codex can share one memory namespace cleanly
- local-first and shared-workspace behavior stay explicit and governed

## 中文

## 目标

让 Codex 从第一阶段开始就是受治理共享记忆的一等 consumer。

当前状态：

- `step-9 设计包已完成`
- 下一阶段进入实现

## 分阶段计划

### Phase 1. 绑定模型

- user / project / namespace binding
- code-memory scope model
- adapter contract
- local-first 的多 runtime binding 规则

### Phase 2. 读写闭环

- read-before-task flow
- write-after-task event flow
- governed write-back reviewability
- shared-workspace-safe 的 write serialization

### Phase 3. 工作流加固

- coding-task projection tuning
- compatibility checks
- shared code-memory regression tests
- 面向 future shared-registry 的 readiness checks

## 退出标准

- Codex 能在 task 前读取 governed code memory
- Codex 能在 task 后输出 governed write-back events
- OpenClaw 与 Codex 能干净共享同一个 memory namespace
- local-first 与 shared-workspace 行为保持显式且受治理
