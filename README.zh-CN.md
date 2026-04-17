# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> 一套面向 OpenClaw 的受治理共享记忆核心：已经具备事实优先上下文、显式 self-learning lifecycle，以及可用 CLI 验证的发版门禁。

## 为什么现在就值得用

如果你想先看一句最实在的话：

- 最新完整回归：`414 / 414`
- latest available release-preflight：`8 / 8` 通过
- retrieval-heavy CLI benchmark：`262 / 262`
- isolated local answer-level gate：`12 / 12`，其中中文样本 `6 / 12`
- 更深的 answer-level watch：`14 / 18`
- 仓库当前维护的 runnable matrix：`392` 个 case，其中中文相关占比 `53.83%`
- 既有记忆消费型 live A/B：`100` 个真实 answer-level 案例里，`97` 个两边都能答对，`1` 个只有 Memory Core 能答对，`0` 个只有默认内置能答对，`2` 个两边都失败
- 普通对话实时写记忆专项 A/B：
  - 宿主 live：`current=38`、`legacy=21`、`UMC-only=18`
  - Docker hermetic（`30s` turn budget）：`current=3`、`legacy=0`、`UMC-only=3`、`both-fail=37`

建议先看这两份：

- [为什么 Unified Memory Core 用起来更顺手](docs/memory-improvement-evidence.zh-CN.md)
- [完整回归与记忆提升报告](reports/generated/unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md)
- [普通对话实时写记忆专项对比](reports/generated/openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)
- [普通对话 Docker 隔离复测总结](reports/generated/openclaw-ordinary-conversation-memory-intent-docker-rerun-2026-04-17.md)

最诚实的结论是：OpenClaw 内置记忆在很多“已有记忆消费”的简单题上本来就不差，所以旧的 `100` 条 A/B 差异不大；而在“普通对话里实时写入，再跨会话召回”这条线上，宿主 live 结果显示 Unified Memory Core 有明显优势，但 Docker hermetic 复测又证明这条优势目前会被 answer-level timeout 严重吞掉。也就是说，UMC 现在不只是要“记得更好”，还要把这条写侧能力做得更快、更稳、更可复现。

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
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.1
```

开发头版本：

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
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

插件层现在默认开启 nightly self-learning。它会在本地时间每天 `00:00` 扫描最近的 OpenClaw 会话记忆，抽取受治理的长期学习候选，跑 daily reflection，并把达到基线阈值的 stable candidates 自动晋升。

大多数用户不需要额外配置。只有在你想关闭它或改执行时间时，才需要显式写 `selfLearning`：

```json5
{
  plugins: {
    entries: {
      "unified-memory-core": {
        enabled: true,
        selfLearning: {
          enabled: true,
          localTime: "00:00"
        }
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

### 安装后的 `umc` 命令行

对正常安装用户，`umc` 的默认可执行文件就在宿主插件目录里：

```bash
$HOME/.openclaw/extensions/unified-memory-core/umc
```

最方便的用法，是把宿主插件目录加到 `PATH`：

```bash
export PATH="$HOME/.openclaw/extensions/unified-memory-core:$PATH"
```

加完后你就可以直接用：

```bash
umc where
umc --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc help source add
```

如果你不想改 `PATH`，也可以直接跑完整路径：

```bash
"$HOME/.openclaw/extensions/unified-memory-core/umc" where
"$HOME/.openclaw/extensions/unified-memory-core/umc" --help
```

### 理解这套系统的最短路径

- `workspace/MEMORY.md` 保存稳定长期规则和事实
- `workspace/memory/*.md` 保存近期和每日记忆
- `workspace/notes/*.md` 保存项目或领域笔记
- 不是所有 `workspace/notes/*.md` 都应该进入 stable card；只有带明确总结、可复用规则/概念、并且有清晰适用边界的 notes 才适合升格，历史 roadmap 和临时配置说明应继续只做背景 notes
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
- 一条已经落地基线的受治理 self-learning 路径，覆盖 declared sources、reflection、candidate promotion 和 export/audit surfaces
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

## 为什么 Self-Learning 现在就重要

这套系统的长期最大亮点确实是 `self-learning`，但它已经不是“还没开始的未来概念”了。

现在仓库里已经有这些基线：

- 通过 `manual`、`file`、`directory`、`conversation` 这些 declared sources 接入学习输入
- 结构化的 reflection / daily reflection 管线，会产出 candidate artifacts
- repeated signal 和显式 `remember this / 记住这个` 检测
- candidate -> stable 的升级基线，以及对应 decision trails
- standalone runtime / CLI，可直接跑 reflect、daily-run、export、audit、repair、replay
- generic、OpenClaw、Codex 三条 export surface，可围绕 promoted stable artifacts 工作
- 插件层 nightly self-learning：默认本地 `00:00`、启动补跑、运行状态持久化、latest reflection reports

现在已经收口的部分是：

- promotion、decay / expiry、conflict detection、stable registry update 这些显式 learning lifecycle 规则
- learning-specific audit、replay、repair、time-window comparison 和 regression coverage
- 让 governed learning outputs 反哺 OpenClaw 与 Codex 行为的 policy adaptation
- Stage 5 的 source adapter hardening、maintenance workflow、reproducibility、release boundary、split rehearsal
- release bundle build、真实 OpenClaw install verification、host smoke，以及一条 `release-preflight` 总门禁

所以更准确的项目定位应该是：

- 当前价值：事实优先上下文 + 已经落地的受治理学习 / policy adaptation 基线
- 当前状态：Stage 1-5 都已完成，仓库已经有一条“只剩人类验收”的 CLI 门禁
- 更后面的讨论：runtime API / service mode 继续延后，直到文档里的 prerequisites 长期保持为绿

如果你想理解这个项目真正要走向哪里，不能只看当前 OpenClaw adapter 的效果，也应该直接看 self-learning workstream 文档。

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

### 普通安装用户常用命令

```bash
umc where
umc --help
umc source --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc learn lifecycle-run --source-type manual --content "Remember this: prefer concise progress reports." --format markdown
umc export inspect --consumer openclaw --format markdown
```

### 仓库维护命令

```bash
npm test
npm run smoke:eval
npm run eval:smoke-promotion
npm run umc:stage5 -- --format markdown
npm run umc:release-preflight -- --format markdown
npm run umc:daily-reflection -- --source-type manual --content "Remember this: prefer concise summaries." --dry-run
npm run umc:cli -- export inspect --consumer generic --format markdown
```

## 文档导航

- [文档首页](docs/README.zh-CN.md)
- [架构](docs/architecture.zh-CN.md)
- [模块地图](docs/module-map.zh-CN.md)
- [路线图](docs/roadmap.zh-CN.md)
- [测试计划](docs/test-plan.zh-CN.md)
- [详细使用手册](docs/reference/unified-memory-core/usage-guide.zh-CN.md)
- [发布说明](RELEASE.zh-CN.md)

更深一层的仓库文档：

- [主路线图](docs/workstreams/project/roadmap.md)
- [顶层系统架构](docs/workstreams/system/architecture.md)
- [详细开发队列](docs/reference/unified-memory-core/development-plan.md)
- [详细测试体系](docs/reference/unified-memory-core/testing/README.md)
- [Self-Learning 路线图](docs/workstreams/self-learning/roadmap.md)

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
