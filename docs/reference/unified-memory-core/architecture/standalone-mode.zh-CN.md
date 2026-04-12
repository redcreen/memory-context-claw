# Standalone Mode Architecture

[English](standalone-mode.md) | [中文](standalone-mode.zh-CN.md)

## 目的

`Standalone Mode` 用来定义 `Unified Memory Core` 在**不依赖 OpenClaw host** 的情况下如何运行。

它覆盖：

- CLI 驱动执行
- scheduled job 执行
- 可控 source ingestion
- 脱离 adapter 的 export / audit / repair 操作

相关文档：

- [../deployment-topology.md](../deployment-topology.md)
- [../../self-learning-architecture.md](../../../workstreams/self-learning/architecture.zh-CN.md)
- [../development-plan.md](../development-plan.md)

## 它负责什么

- 面向 CLI 的执行边界
- 面向 scheduled jobs 的入口
- source registration commands
- export / audit / repair command contracts

## 它不负责什么

- OpenClaw runtime behavior
- Codex runtime behavior
- adapter 专属 projection logic
- runtime API service implementation

## 核心目标

把产品收成：

`一个 local-first、脱离宿主也能独立 ingest / reflect / export / govern 的记忆系统`

## 主流程

```mermaid
flowchart LR
    A["CLI / Cron / Job Runner"] --> B["Standalone Commands"]
    B --> C["Source Registration"]
    C --> D["Source / Reflection / Registry"]
    D --> E["Projection / Governance"]
    E --> F["Exports / Reports / Repair Outputs"]

    classDef cli fill:#f7f1e3,stroke:#b58105,color:#4a3a00,stroke-width:1.6px;
    classDef core fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.6px;
    class A,B cli;
    class C,D,E,F core;
```

## 命令族

第一批稳定命令族建议是：

1. `source add / list / inspect`
2. `reflect run / inspect`
3. `export build / inspect`
4. `govern audit / repair / replay`

## 边界规则

Standalone mode 应当：

- 复用 embedded mode 的同一套 contracts
- 写入同一套 governed artifacts
- 避免隐藏的 runtime-only state
- 对未来 shared-registry service 演进保持兼容

## 第一阶段实现边界

第一批实现建议先支持：

1. source registration
2. dry-run reflection
3. deterministic export build
4. audit / repair inspection commands

## 完成标准

这个模块进入可开发状态的标准是：

- command families 已明确
- 输入 / 输出 contracts 已明确
- scheduled-job 执行假设已明确
- standalone outputs 与 governed artifact contracts 一致
