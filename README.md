# Memory Context Claw

[English](#english) | [中文](#中文)

## English

**What This Plugin Is**

`memory-context-claw` is an OpenClaw `contextEngine` plugin.

It does not replace OpenClaw's builtin long memory. It improves the layer
between:

- long-memory retrieval
- stable fact/rule selection
- the final context that actually reaches the model

One-line goal:

`turn long memory into better working context`

**Good Fit / Not A Fit**

Good fit:

- you already use OpenClaw long memory
- you keep stable rules in `MEMORY.md`
- you want better fact/rule prioritization
- you want more stable answers for high-value memory questions

Not the best fit:

- you expect this plugin to replace builtin OpenClaw memory
- you want to patch host-side `memory_search`
- you do not use long memory, daily memory, or workspace docs at all

**Who This Is For**

Use this plugin if you already have:

- `MEMORY.md`
- `memory/YYYY-MM-DD.md`
- workspace docs
- real long-term memory in OpenClaw

and you want:

- more stable recall for important facts and rules
- better prioritization between formal memory, daily memory, and docs
- fast-path answers for high-value questions
- less engineering-noise pollution in the final context

**What It Does**

From a user point of view, it mainly gives you:

- fact-first context assembly
- stable rule / identity / preference prioritization
- retrieval policy instead of flat “everything has equal weight”
- fast paths for important memory questions
- governance and regression tooling for maintainers

**Quick Start**

If you only want the shortest path, do just these three things:

1. install the plugin
2. set `contextEngine: "memory-context-claw"`
3. run `openclaw plugins list`

Quick mental model:

- `MEMORY.md` = stable long-term rules and facts
- `memory/*.md` = daily / recent memory
- workspace docs = project or domain context
- this plugin = chooses what should matter most right now

**1. One-Command Remote Install**

Recommended remote install command:

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

OpenClaw `plugins install` accepts npm-style package specs, and this repo can be
installed directly from GitHub that way.

**2. Minimal Config**

Set it as the active `contextEngine` in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    allow: ["memory-context-claw"],
    slots: {
      contextEngine: "memory-context-claw"
    },
    entries: {
      "memory-context-claw": {
        enabled: true
      }
    }
  }
}
```

**3. Verify It Loaded**

```bash
openclaw plugins list
```

You should see `memory-context-claw` in the loaded plugin list.

**Normal User Flow**

After installation, daily usage is simple:

- put stable long-term rules in `MEMORY.md`
- keep daily notes in `memory/*.md`
- keep project/reference docs in the workspace
- keep chatting with OpenClaw

You normally do not need special plugin commands.

**For Maintainers**

Use the sections below if you are:

- developing this repo
- tuning config
- running tests and governance checks

**Local Development Install**

If you are developing this repo locally:

```bash
openclaw plugins install -l .
```

For a safer development/runtime split:

```bash
npm run deploy:local
```

That copies the repo into:

`~/.openclaw/extensions/memory-context-claw`

so editing this repo does not immediately change the live plugin.

**What This Plugin Does Not Do**

This plugin does not:

- replace builtin OpenClaw memory
- patch the OpenClaw host
- patch other plugins
- magically “fix” builtin `memory_search` at the host level

What it does do:

- build better plugin-side retrieval policy
- produce stable fact/card artifacts
- prefer important facts over noisy flat recall
- give you a governed memory-context layer

**Architecture**

If you want the whole-system view:

- overall architecture:
  [system-architecture.md](/Users/redcreen/Project/长记忆/context-assembly-claw/system-architecture.md)
- project roadmap:
  [project-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/project-roadmap.md)

If you specifically care about memory search:

- architecture:
  [memory-search-architecture.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-architecture.md)
- roadmap:
  [memory-search-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-roadmap.md)
- orchestration vs tool-agent:
  [memory-search-orchestration-vs-tool-agent.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-orchestration-vs-tool-agent.md)

**Configuration**

Detailed configuration reference:

- [configuration.md](/Users/redcreen/Project/长记忆/context-assembly-claw/configuration.md)

Example config templates:

- [openclaw.context-assembly.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.llm-rerank.example.json)

**Validation**

Basic checks:

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "your test query"
```

Maintainer checks:

```bash
npm test
npm run smoke:eval
npm run eval:memory-search:cases
npm run eval:memory-search:governance -- --write
npm run memory:governance-cycle -- --write
```

Full testing reference:

- [testsuite.md](/Users/redcreen/Project/长记忆/context-assembly-claw/testsuite.md)

**Project Status**

Current status:

`usable + governed + regression-protected`

Meaning:

- not just a proof of concept
- already usable in real OpenClaw setups
- still evolving, especially around builtin `memory_search` compensation

**Naming**

Selected public-facing name:

`memory-context-claw`

Other name options:

- [name-candidates.md](/Users/redcreen/Project/长记忆/context-assembly-claw/name-candidates.md)

---

## 中文

**这是什么**

`memory-context-claw` 是一个 OpenClaw 的 `contextEngine` 插件。

它不替代 OpenClaw 内置长期记忆，而是专门优化这几层之间的衔接：

- 长期记忆检索
- 稳定事实 / 规则选择
- 最终真正进入模型的上下文

一句话目标：

`把长期记忆更稳定地变成当前轮可用的上下文`

**适合 / 不适合**

适合：

- 你已经在用 OpenClaw 长期记忆
- 你会把稳定规则放进 `MEMORY.md`
- 你希望事实 / 规则优先级更稳定
- 你希望高价值记忆问题回答更稳

不太适合：

- 你期待这个插件直接替代 OpenClaw 内置 memory
- 你希望它直接修改宿主侧 `memory_search`
- 你根本不用长期记忆、daily memory 或 workspace 文档

**适合谁用**

如果你已经在 OpenClaw 里有这些东西：

- `MEMORY.md`
- `memory/YYYY-MM-DD.md`
- workspace 文档
- 真实长期记忆

并且你希望：

- 关键事实和规则召回更稳定
- 正式记忆、daily memory、项目文档之间有更合理的优先级
- 高频重要问题尽量走快路径
- 最终上下文少一些工程噪音

那这个插件就是为你准备的。

**它主要解决什么**

从用户视角看，这个插件主要提供：

- 事实优先的上下文组装
- 对规则 / 身份 / 偏好 / 项目事实的稳定优先
- 不再把所有召回结果“平铺看待”
- 对高价值记忆问题的快路径
- 一套可治理、可回归验证的长期记忆上下文层

**快速开始**

如果你只想先把它用起来，最短路径就是这 3 步：

1. 安装插件
2. 把 `contextEngine` 设成 `memory-context-claw`
3. 执行 `openclaw plugins list`

一个最简单的理解方式：

- `MEMORY.md` = 稳定长期规则 / 事实
- `memory/*.md` = 当日 / 近期记忆
- workspace 文档 = 项目或专题上下文
- 这个插件 = 帮你决定“当前轮到底该优先带什么进去”

**1. 一键远程安装**

推荐的远程安装命令：

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

`openclaw plugins install` 支持 npm 风格的 package spec，这个仓库可以直接通过 GitHub 地址安装。

**2. 最小配置**

在 `~/.openclaw/openclaw.json` 里把它设为当前激活的 `contextEngine`：

```json5
{
  plugins: {
    allow: ["memory-context-claw"],
    slots: {
      contextEngine: "memory-context-claw"
    },
    entries: {
      "memory-context-claw": {
        enabled: true
      }
    }
  }
}
```

**3. 验证是否生效**

```bash
openclaw plugins list
```

你应该能在已加载插件列表里看到 `memory-context-claw`。

**普通用户日常使用**

装好以后，日常使用其实很简单：

- 稳定长期规则放进 `MEMORY.md`
- 日常过程记忆放进 `memory/*.md`
- 项目资料放在 workspace 文档里
- 正常继续和 OpenClaw 对话

大多数情况下，你不需要记特殊插件命令。

**维护者入口**

后面的内容更适合这几类场景：

- 你在开发这个仓库
- 你在调配置
- 你在跑测试和治理命令

**本地开发安装**

如果你是在本地开发这个仓库：

```bash
openclaw plugins install -l .
```

更安全的开发 / 运行分离方式：

```bash
npm run deploy:local
```

它会把当前仓库复制到：

`~/.openclaw/extensions/memory-context-claw`

这样你改仓库代码时，不会立刻影响正在运行的插件副本。

**这个插件不做什么**

它不做这些事：

- 替换 OpenClaw 内置 memory
- 魔改 OpenClaw 宿主
- 魔改别的插件
- 从宿主层“彻底修好” builtin `memory_search`

它真正做的是：

- 在插件层补强 retrieval policy
- 生成稳定的 fact/card 工件
- 让重要事实优先于噪音召回
- 把长期记忆变成一层可治理的上下文系统

**架构文档**

如果你想看全局架构：

- 总体架构：
  [system-architecture.md](/Users/redcreen/Project/长记忆/context-assembly-claw/system-architecture.md)
- 总 roadmap：
  [project-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/project-roadmap.md)

如果你特别关心 memory search：

- 专项架构：
  [memory-search-architecture.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-architecture.md)
- 专项 roadmap：
  [memory-search-roadmap.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-roadmap.md)
- 固定编排 vs 工具调度：
  [memory-search-orchestration-vs-tool-agent.md](/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-orchestration-vs-tool-agent.md)

**配置**

详细配置说明：

- [configuration.md](/Users/redcreen/Project/长记忆/context-assembly-claw/configuration.md)

配置模板：

- [openclaw.context-assembly.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.llm-rerank.example.json)

**验证与测试**

基础验证：

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "你的测试问题"
```

维护者常用验证：

```bash
npm test
npm run smoke:eval
npm run eval:memory-search:cases
npm run eval:memory-search:governance -- --write
npm run memory:governance-cycle -- --write
```

完整测试说明：

- [testsuite.md](/Users/redcreen/Project/长记忆/context-assembly-claw/testsuite.md)

**当前状态**

当前状态可以概括成：

`可用 + 已治理 + 有回归保护`

也就是说：

- 已经不是概念验证
- 在真实 OpenClaw 环境里已经能用
- 但 builtin `memory_search` 这条线仍然在持续补强

**名称**

当前对外名称：

`memory-context-claw`

备选命名：

- [name-candidates.md](/Users/redcreen/Project/长记忆/context-assembly-claw/name-candidates.md)
