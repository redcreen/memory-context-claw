# Self-Learning Workstream Roadmap

[English](#english) | [中文](#中文)

## English

## Purpose

This roadmap turns the self-learning architecture into an implementation-oriented workstream plan.

It answers:

- what this workstream will build first
- which phases should be executed in order
- what each phase should deliver
- how each phase should be validated
- what should be considered out of scope for now

Related documents:

- [../project-roadmap.md](../project-roadmap.md)
- [../self-learning-architecture.md](../self-learning-architecture.md)
- [memory-search-roadmap.md](memory-search-roadmap.md)

## Workstream Goal

Build a governed daily-learning system for `memory-context-claw` that can:

- detect repeated signals
- run daily reflection
- promote stable learning candidates safely
- adapt plugin-side policy using verified patterns
- keep learned behavior testable and reviewable
- stay separable from `memory search`
- expose standalone CLI-driven workflows
- keep artifacts portable for future non-OpenClaw consumers

## Current Status

- status: `planning-complete / development-ready`
- architecture baseline: `defined`
- implementation baseline: `not started`
- dependency status:
  - core memory-context backbone: `ready`
  - memory-search governance loop: `ready but not a hard coupling target`

## Phase Map

```mermaid
flowchart LR
    A["Phase 0\nProduct Boundary + Spec"] --> B["Phase 1\nSource Adapters + CLI MVP"]
    B --> C["Phase 2\nReflection MVP"]
    C --> D["Phase 3\nPromotion + Decay"]
    D --> E["Phase 4\nIntegration Adapters"]
    E --> F["Phase 5\nGovernance Productization"]

    classDef phase fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    class A,B,C,D,E,F phase;
```

## Phase 0: Product Boundary + Spec

Status target: `build first`

Goal:

Create the minimal stable contract and product boundary before runtime behavior is added.

Scope:

- standalone component boundary
- integration adapter boundary
- candidate types
- memory states
- evidence model
- confidence model
- promotion / decay rules draft
- report shape draft
- source registration model
- export artifact model

Suggested outputs:

- standalone-vs-embedded contract
- source / export contract
- candidate schema definition
- state transition definition
- reflection question template set
- initial file/module ownership plan

Suggested modules:

- `src/learning-candidates.js`
- `src/learning-schema.js`
- `src/learning-contracts.js`
- `test/learning-candidates.test.js`

Acceptance:

- self-learning and memory-search boundaries are explicit
- standalone CLI mode is part of the contract
- candidate types are explicitly named
- stable vs observation vs dropped is unambiguous
- evidence fields are sufficient for later audit

## Phase 1: Source Adapters + CLI MVP

Goal:

Build the first controlled-ingestion and CLI surface for the standalone component.

Scope:

- source registration
- file / directory / URL / image input adapters
- CLI command surface
- source manifest
- dry-run inspection mode

Suggested outputs:

- CLI runner
- source adapter layer
- source manifest artifact
- dry-run source inspection report

Suggested modules:

- `src/learning-source-adapters.js`
- `src/learning-cli.js`
- `scripts/learn-add-source.js`
- `test/learning-cli.test.js`

Acceptance:

- controlled sources can be registered explicitly
- CLI can run without OpenClaw host runtime
- source manifests are visible and reviewable
- ingestion behavior is traceable

## Phase 2: Reflection MVP

Goal:

Build the first daily reflection loop that generates governed learning candidates instead of stable memory directly.

Scope:

- daily input aggregation
- event labeling
- repeated-signal detection
- explicit remember detection
- observation queue generation
- decision trail generation

Suggested outputs:

- daily reflection runner
- first reflection report
- first observation candidate artifact
- first decision-trail artifact

Suggested modules:

- `src/daily-reflection.js`
- `scripts/run-daily-reflection.js`
- `test/daily-reflection.test.js`
- `reports/self-learning-reflection-*.md`

Acceptance:

- daily reflection can run on recent inputs
- repeated preference candidates can be extracted
- explicit remember instructions are detected
- output is structured and reviewable

## Phase 3: Promotion + Decay

Goal:

Turn observation candidates into a governed lifecycle instead of a one-way accumulation bucket.

Scope:

- promotion rules
- decay / expiry rules
- conflict detection
- stable registry update rules

Suggested outputs:

- promotion evaluator
- decay evaluator
- conflict report
- stable candidate promotion report
- repair workflow draft

Suggested modules:

- `src/learning-promotion.js`
- `src/learning-conflicts.js`
- `test/learning-promotion.test.js`

Acceptance:

- strong repeated signals can be promoted
- weak or stale signals can decay
- conflicts are explicit
- no candidate bypasses review logic

## Phase 4: Integration Adapters

Goal:

Use verified learning signals through adapters instead of hard-coupling the component to OpenClaw internals.

Scope:

- OpenClaw export adapter
- portable export artifacts
- retrieval / policy projection boundaries
- future consumer compatibility shape

Suggested outputs:

- OpenClaw integration adapter
- export artifact spec
- first OpenClaw-facing projection report
- future-consumer compatibility note

Suggested modules:

- `src/learning-export.js`
- `src/policy-adaptation.js`
- `test/learning-export.test.js`
- `test/policy-adaptation.test.js`
- `reports/self-learning-policy-*.md`

Acceptance:

- learned outputs can be exported without embedding logic directly in retrieval internals
- OpenClaw integration is explicit and adapter-based
- output shape is reusable outside OpenClaw

## Phase 5: Governance Productization

Goal:

Make self-learning a regular maintainable capability rather than a one-off experiment.

Scope:

- smoke coverage
- audit coverage
- time-window comparisons
- maintenance workflow
- rollback posture
- repair workflow
- export reproducibility

Suggested outputs:

- self-learning audit report
- periodic comparison report
- smoke cases for learning behavior
- maintenance checklist
- repair checklist

Suggested modules:

- `scripts/run-self-learning-audit.js`
- `test/self-learning-governance.test.js`
- `reports/self-learning-audit-*.md`

Acceptance:

- self-learning behavior is regression-protected
- promoted items are reviewable
- quality can be compared over time

## Phase Dependencies

```mermaid
flowchart TB
    A["Phase 0\nproduct + spec contract"] --> B["Phase 1\nsource adapters + CLI"]
    B --> C["Phase 2\ncandidate generation"]
    C --> D["Phase 3\npromotion lifecycle"]
    D --> E["Phase 4\nintegration adapters"]
    E --> F["Phase 5\ngovernance productization"]

    G["Existing fact/card artifacts"] --> C
    H["OpenClaw integration needs"] --> E

    classDef phase fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    classDef dep fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    class A,B,C,D,E,F phase;
    class G,H dep;
```

## Explicit Non-Goals For Now

- patching the OpenClaw host
- changing builtin `memory_search`
- building free-form autonomous personality rewriting
- using reflection outputs as stable memory without governance
- binding the learning component permanently to OpenClaw-only inputs
- hiding learning decisions inside opaque runtime state

## Recommended Development Order

1. finish Phase 0 contracts and tests
2. implement Phase 1 source adapters and CLI MVP
3. implement Phase 2 reflection runner and candidate outputs
4. implement Phase 3 lifecycle rules
5. implement Phase 4 integration adapters
6. implement Phase 5 reports and smoke coverage

## 中文

## 文档目的

这份 roadmap 把 self-learning architecture 继续收成一份可执行的专项开发计划。

它要回答：

- 这条专项先做什么
- 各阶段应该按什么顺序推进
- 每一阶段要交付什么
- 每一阶段怎么验证
- 现阶段哪些内容明确不做

相关文档：

- [../project-roadmap.md](../project-roadmap.md)
- [../self-learning-architecture.md](../self-learning-architecture.md)
- [memory-search-roadmap.md](memory-search-roadmap.md)

## 专项目标

为 `memory-context-claw` 做出一套受治理的每日学习系统，能够：

- 识别重复信号
- 执行 daily reflection
- 安全升级稳定学习候选
- 用已验证模式更新插件层策略
- 让学习行为本身可测试、可评审
- 尽可能与 `memory search` 解耦
- 通过独立 CLI 驱动运行
- 让学习产物未来可复用给 OpenClaw 之外的项目

## 当前状态

- 状态：`planning-complete / development-ready`
- 架构基线：`已定义`
- 实现基线：`尚未开始`
- 依赖状态：
  - memory-context 主骨架：`ready`
  - memory-search 治理循环：`ready but not a hard coupling target`

## 阶段图

```mermaid
flowchart LR
    A["Phase 0\n产品边界 + 规格"] --> B["Phase 1\nSource Adapters + CLI MVP"]
    B --> C["Phase 2\n反思 MVP"]
    C --> D["Phase 3\n升级 + 衰减"]
    D --> E["Phase 4\n集成适配层"]
    E --> F["Phase 5\n治理产品化"]

    classDef phase fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    class A,B,C,D,E,F phase;
```

## Phase 0：产品边界 + 规格

目标状态：`第一个开发阶段`

目标：

在接入运行时行为之前，先把 self-learning 的最小稳定契约和产品边界定义清楚。

范围：

- standalone component boundary
- integration adapter boundary
- candidate types
- memory states
- evidence model
- confidence model
- promotion / decay rules 草案
- report shape 草案
- source registration model
- export artifact model

建议产出：

- standalone-vs-embedded contract
- source / export contract
- candidate schema 定义
- 状态流转定义
- 反思问题模板集
- 初版文件 / 模块归属计划

建议模块：

- `src/learning-candidates.js`
- `src/learning-schema.js`
- `src/learning-contracts.js`
- `test/learning-candidates.test.js`

验收：

- self-learning 和 memory-search 边界清楚
- standalone CLI mode 进入契约定义
- candidate 类型命名清楚
- stable / observation / dropped 边界清楚
- evidence 字段足够支撑后续审计

## Phase 1：Source Adapters + CLI MVP

目标：

先做出独立组件的可控输入层和 CLI 操作面。

范围：

- source registration
- file / directory / URL / image input adapters
- CLI commands
- source manifest
- dry-run inspection mode

建议产出：

- CLI runner
- source adapter layer
- source manifest artifact
- dry-run source inspection report

建议模块：

- `src/learning-source-adapters.js`
- `src/learning-cli.js`
- `scripts/learn-add-source.js`
- `test/learning-cli.test.js`

验收：

- 可控来源可以被显式注册
- CLI 可以脱离 OpenClaw host runtime 执行
- source manifests 可见、可审阅
- ingestion 行为可追踪

## Phase 2：反思 MVP

目标：

做出第一版 daily reflection 闭环，但先生成受治理的 learning candidates，而不是直接写 stable memory。

范围：

- 每日输入聚合
- 事件标注
- 重复信号检测
- 明确 `记住` 检测
- observation queue 生成
- decision trail 生成

建议产出：

- daily reflection runner
- 第一版 reflection report
- 第一版 observation candidate artifact
- 第一版 decision-trail artifact

建议模块：

- `src/daily-reflection.js`
- `scripts/run-daily-reflection.js`
- `test/daily-reflection.test.js`
- `reports/self-learning-reflection-*.md`

验收：

- 能对最近输入跑 daily reflection
- 能提炼重复偏好候选
- 能识别明确 `记住`
- 输出结构化且可评审

## Phase 3：升级 + 衰减

目标：

让 observation candidates 进入受治理生命周期，而不是只进不出的堆积池。

范围：

- promotion rules
- decay / expiry rules
- conflict detection
- stable registry 更新规则

建议产出：

- promotion evaluator
- decay evaluator
- conflict report
- stable candidate promotion report
- repair workflow draft

建议模块：

- `src/learning-promotion.js`
- `src/learning-conflicts.js`
- `test/learning-promotion.test.js`

验收：

- 强信号可以升级
- 弱信号和过期信号可以衰减
- 冲突会被显式标出
- 没有候选能绕过评审逻辑

## Phase 4：集成适配层

目标：

通过 adapter 把已验证学习结果接入 OpenClaw，而不是把组件和 OpenClaw 内部强耦合。

范围：

- OpenClaw export adapter
- portable export artifacts
- retrieval / policy projection boundaries
- future consumer compatibility shape

建议产出：

- OpenClaw integration adapter
- export artifact spec
- 第一版 OpenClaw-facing projection report
- future-consumer compatibility note

建议模块：

- `src/learning-export.js`
- `src/policy-adaptation.js`
- `test/learning-export.test.js`
- `test/policy-adaptation.test.js`
- `reports/self-learning-policy-*.md`

验收：

- 学习结果可以在不嵌入 retrieval internals 的前提下导出
- OpenClaw 集成是显式 adapter-based
- 输出形态可复用于 OpenClaw 外的消费者

## Phase 5：治理产品化

目标：

把 self-learning 从一次性实验，收成可长期维护的稳定能力。

范围：

- smoke coverage
- audit coverage
- 跨时间窗口对比
- 日常维护流
- rollback posture
- repair workflow
- export reproducibility

建议产出：

- self-learning audit report
- 周期性对比报告
- learning behavior smoke cases
- 维护 checklist
- repair checklist

建议模块：

- `scripts/run-self-learning-audit.js`
- `test/self-learning-governance.test.js`
- `reports/self-learning-audit-*.md`

验收：

- self-learning 行为有回归保护
- 已升级条目可评审
- 质量可跨时间对比

## 阶段依赖图

```mermaid
flowchart TB
    A["Phase 0\n产品 + 规格契约"] --> B["Phase 1\nsource adapters + CLI"]
    B --> C["Phase 2\n候选生成"]
    C --> D["Phase 3\n升级生命周期"]
    D --> E["Phase 4\n集成适配层"]
    E --> F["Phase 5\n治理产品化"]

    G["现有 fact/card artifacts"] --> C
    H["OpenClaw integration needs"] --> E

    classDef phase fill:#e8f1ff,stroke:#2f6feb,color:#123a73,stroke-width:1.5px;
    classDef dep fill:#eefce8,stroke:#2f855a,color:#1c4532,stroke-width:1.5px;
    class A,B,C,D,E,F phase;
    class G,H dep;
```

## 当前明确不做

- 魔改 OpenClaw 宿主
- 修改 builtin `memory_search`
- 做自由发挥式的“人格重写”
- 让 reflection 结果绕过治理直接进入 stable memory
- 把学习组件永久绑定成 OpenClaw-only 输入
- 把学习决策藏进不可见的 runtime state

## 建议开发顺序

1. 先完成 Phase 0 的 contract 和测试
2. 再实现 Phase 1 的 source adapters 和 CLI MVP
3. 再实现 Phase 2 的 reflection runner 和 candidate 输出
4. 再补 Phase 3 的生命周期规则
5. 再接入 Phase 4 的 integration adapters
6. 最后补 Phase 5 的报告和 smoke 覆盖
