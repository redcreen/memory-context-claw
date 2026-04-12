# Standalone Mode Roadmap

[English](standalone-mode.md) | [中文](standalone-mode.zh-CN.md)

## 目标

让 `Unified Memory Core` 在没有 OpenClaw host 参与的情况下也能运行。

当前状态：

- `step-11 设计包已完成`
- 下一阶段进入实现

## 分阶段计划

### Phase 1. 命令边界

- command family definition
- source registration flow
- dry-run / inspect mode

### Phase 2. 运行闭环

- reflect/export/govern command flow
- scheduled-job assumptions
- artifact-path conventions

### Phase 3. 加固

- 可重复本地执行
- shared-workspace 兼容性
- 面向 future runtime-API 的 readiness checks

## 退出标准

- 至少一条 ingest -> reflect -> export 路径能脱离 host 跑通
- audit / repair commands 已明确
- standalone outputs 与 governed artifact contracts 一致
