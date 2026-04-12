# Independent Execution Roadmap

[English](independent-execution.md) | [中文](independent-execution.zh-CN.md)

## 目标

让 `Unified Memory Core` 在结构上具备长期独立执行条件。

当前状态：

- `step-12 设计包已完成`
- implementation baseline 已完成
- 只有在未来选择拆分时，才进入 release planning

## 分阶段计划

### Phase 1. Ownership Clarity

- core vs adapter ownership map
- release boundary note
- split-readiness checklist

### Phase 2. Operational Readiness

- standalone operation assumptions
- artifact portability checks
- repo-layout convergence

### Phase 3. Split Optionality

- migration checklist
- release cutover note
- optional repo split preparation

## 退出标准

- independent execution 不再依赖 plugin-first 表述
- split path 已文档化、可 review
- 是否拆仓库变成执行选择
