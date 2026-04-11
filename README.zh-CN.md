# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> 把 OpenClaw 的长期记忆变成一套可治理、事实优先、可直接用于当前任务的上下文系统。

## 适用对象

如果你已经在用 OpenClaw 长期记忆，并且想提升“最终进入上下文的质量”，这个仓库就是为你准备的。

典型适用场景：

- 你把稳定规则或偏好放在 `workspace/MEMORY.md`
- 你把 daily memory 放在 `workspace/memory/YYYY-MM-DD.md`
- 你把项目或领域笔记放在 `workspace/notes/`
- 你希望稳定事实和规则在最终上下文里更经常占优

这套系统不主要解决：

- 直接替代 OpenClaw 内置长期记忆
- 直接修改宿主侧 `memory_search`
- 完全不使用长期记忆或笔记的场景

## 快速开始

### 安装

稳定版：

```bash
openclaw plugins install git+https://github.com/redcreen/unified-memory-core.git#v0.1.0
```

开发头版本：

```bash
openclaw plugins install git+https://github.com/redcreen/unified-memory-core.git
```

### 最简配置

在 `~/.openclaw/openclaw.json` 里把 `unified-memory-core` 设成当前激活的 `contextEngine`：

```json5
{
  plugins: {
    allow: ["unified-memory-core"],
    slots: {
      contextEngine: "unified-memory-core"
    },
    entries: {
      "unified-memory-core": {
        enabled: true
      }
    }
  }
}
```

### 验证是否加载成功

```bash
openclaw plugins list
```

你应该能在已加载插件列表里看到 `unified-memory-core`。

### 理解这套系统的最短路径

- `workspace/MEMORY.md` 保存稳定长期规则和事实
- `workspace/memory/*.md` 保存近期和每日记忆
- `workspace/notes/*.md` 保存项目或领域笔记
- OpenClaw 适配层负责决定这一轮真正该优先带什么进上下文

推荐的 workspace 结构：

```text
workspace/
├── MEMORY.md
├── memory/
│   └── YYYY-MM-DD.md
└── notes/
    ├── unified-memory-core-config.md
    └── openclaw-memory-vs-lossless.md
```

## 核心能力

- 面向高价值记忆问题的事实优先上下文组装
- 对规则、身份、偏好等稳定信号的优先级控制
- 以治理和策略代替“所有召回结果一视同仁”
- 面向 OpenClaw、Codex 和后续消费者的 export / projection 层
- 面向维护者的 audit、repair、replay 和回归工具

系统当前按七个一等模块组织：

- Source System
- Reflection System
- Memory Registry
- Projection System
- Governance System
- OpenClaw Adapter
- Codex Adapter

## 常见工作流

### 普通使用

- 把稳定规则放进 `workspace/MEMORY.md`
- 把近期观察放进 `workspace/memory/*.md`
- 把项目说明和背景笔记放进 `workspace/notes/`
- 正常继续和 OpenClaw 对话，适配层会负责检索和组装

### 维护者恢复顺序

1. [.codex/status.md](.codex/status.md)
2. [.codex/module-dashboard.md](.codex/module-dashboard.md)
3. `.codex/modules/*.md`
4. [docs/module-map.zh-CN.md](docs/module-map.zh-CN.md)
5. 只有横切工作流需要时再看 `.codex/subprojects/*.md`
6. 先把控制面读清，再去看更深的 roadmap 和 reports

### 常用命令

```bash
npm test
npm run smoke:eval
npm run eval:smoke-promotion
npm run umc:daily-reflection -- --source-type manual --content "Remember this: prefer concise summaries." --dry-run
npm run umc:cli -- export inspect --consumer generic --format markdown
```

## 文档导航

- [文档首页](docs/README.zh-CN.md)
- [架构](docs/architecture.zh-CN.md)
- [模块地图](docs/module-map.zh-CN.md)
- [路线图](docs/roadmap.zh-CN.md)
- [测试计划](docs/test-plan.zh-CN.md)
- [发布说明](RELEASE.zh-CN.md)

更深一层的仓库文档：

- [主路线图](project-roadmap.md)
- [顶层系统架构](system-architecture.md)
- [详细开发队列](docs/unified-memory-core/development-plan.md)
- [详细测试体系](docs/unified-memory-core/testing/README.md)

## 开发

关键实现入口：

- shared contracts: [src/unified-memory-core/contracts.js](src/unified-memory-core/contracts.js)
- source ingestion / normalization: [src/unified-memory-core/source-system.js](src/unified-memory-core/source-system.js)
- registry lifecycle: [src/unified-memory-core/memory-registry.js](src/unified-memory-core/memory-registry.js)
- reflection 和 daily loop: [src/unified-memory-core/reflection-system.js](src/unified-memory-core/reflection-system.js)、[src/unified-memory-core/daily-reflection.js](src/unified-memory-core/daily-reflection.js)
- projection 和 exports: [src/unified-memory-core/projection-system.js](src/unified-memory-core/projection-system.js)
- governance: [src/unified-memory-core/governance-system.js](src/unified-memory-core/governance-system.js)
- OpenClaw runtime: [src/openclaw-adapter.js](src/openclaw-adapter.js)
- Codex runtime: [src/codex-adapter.js](src/codex-adapter.js)

本地开发安装：

```bash
openclaw plugins install -l .
```

更安全的本地部署方式：

```bash
npm run deploy:local
```

它会把仓库复制到 `~/.openclaw/extensions/unified-memory-core`，这样你修改这个 checkout 时，不会立刻影响正在运行的插件副本。
