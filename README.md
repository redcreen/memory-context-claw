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
- you keep stable rules in `workspace/MEMORY.md`
- you want better fact/rule prioritization
- you want more stable answers for high-value memory questions

Not the best fit:

- you expect this plugin to replace builtin OpenClaw memory
- you want to patch host-side `memory_search`
- you do not use long memory, daily memory, or workspace notes/docs at all

**Who This Is For**

Use this plugin if you already have:

- `workspace/MEMORY.md`
- `workspace/memory/YYYY-MM-DD.md`
- `workspace/notes/*.md` or other project docs
- real long-term memory in OpenClaw

and you want:

- more stable recall for important facts and rules
- better prioritization between formal memory, daily memory, and notes/docs
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

- `workspace/MEMORY.md` = stable long-term rules and facts
- `workspace/memory/*.md` = daily / recent memory
- `workspace/notes/*.md` = project or domain notes
- this plugin = chooses what should matter most right now

Notes rule of thumb:

- not every file in `workspace/notes/` becomes a stable card source
- only notes with clear summary/use-case structure and durable concept/project signals should be promoted
- historical roadmaps, temporary config notes, and migration drafts should stay as notes only

**1. Install**

Recommended approach:

- stable users: install the published release tag
- early adopters: install the current `main`

**Stable release install**

Recommended for normal users:

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git#v0.1.0
```

**Current development install**

If you intentionally want the latest `main` branch:

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

OpenClaw `plugins install` accepts npm-style package specs, so this repo can be
installed directly from GitHub either as a tag or as the current branch head.

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

**Bundled Workspace Layout**

If you keep memory and supporting notes inside this repo, the recommended layout is:

```text
workspace/
├── MEMORY.md
├── memory/
│   └── YYYY-MM-DD.md
└── notes/
    ├── memory-context-claw-config.md
    └── openclaw-memory-vs-lossless.md
```

**Normal User Flow**

After installation, daily usage is simple:

- put stable long-term rules in `workspace/MEMORY.md`
- keep daily notes in `workspace/memory/*.md`
- keep project/reference docs in `workspace/notes/`
- keep chatting with OpenClaw

For `workspace/notes/`, use this boundary:

- durable concept/project rationale notes can become stable card inputs
- history docs, old roadmaps, and temporary config drafts should remain background notes

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
  [system-architecture.md](system-architecture.md)
- project roadmap:
  [project-roadmap.md](project-roadmap.md)

If you specifically care about memory search:

- architecture:
  [memory-search-architecture.md](reports/memory-search-architecture.md)
- roadmap:
  [memory-search-roadmap.md](reports/memory-search-roadmap.md)
- orchestration vs tool-agent:
  [memory-search-orchestration-vs-tool-agent.md](reports/memory-search-orchestration-vs-tool-agent.md)

**Configuration**

Detailed configuration reference:

- [configuration.md](configuration.md)

Example config templates:

- [openclaw.context-assembly.example.json](templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](templates/openclaw.context-assembly.llm-rerank.example.json)

Release policy and versioning:

- [release.md](release.md)

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

- [testsuite.md](testsuite.md)

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

- [name-candidates.md](name-candidates.md)

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
- 你会把稳定规则放进 `workspace/MEMORY.md`
- 你希望事实 / 规则优先级更稳定
- 你希望高价值记忆问题回答更稳

不太适合：

- 你期待这个插件直接替代 OpenClaw 内置 memory
- 你希望它直接修改宿主侧 `memory_search`
- 你根本不用长期记忆、daily memory 或 workspace notes / 文档

**适合谁用**

如果你已经在 OpenClaw 里有这些东西：

- `workspace/MEMORY.md`
- `workspace/memory/YYYY-MM-DD.md`
- `workspace/notes/*.md` 或其他项目文档
- 真实长期记忆

并且你希望：

- 关键事实和规则召回更稳定
- 正式记忆、daily memory、notes / 项目文档之间有更合理的优先级
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

- `workspace/MEMORY.md` = 稳定长期规则 / 事实
- `workspace/memory/*.md` = 当日 / 近期记忆
- `workspace/notes/*.md` = 项目或专题笔记
- 这个插件 = 帮你决定“当前轮到底该优先带什么进去”

关于 `workspace/notes/`，一个实用边界是：

- 不是所有笔记都会进入 stable card
- 只有带明确总结/适用场景结构、并且表达稳定项目概念/分工的笔记，才适合进入 stable card
- 历史 roadmap、临时配置草稿、迁移记录这类内容应继续只作为 notes 保存

**1. 安装方式**

推荐做法：

- 稳定用户：安装已经发布的 release tag
- 愿意吃最新开发版本的用户：安装当前 `main`

**稳定版安装**

普通用户推荐直接这样安装：

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git#v0.1.0
```

**当前开发版安装**

如果你就是要跟当前 `main` 走，可以这样装：

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

`openclaw plugins install` 支持 npm 风格的 package spec，所以这个仓库既可以按 tag 安装，也可以直接按当前分支头安装。

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

**内置 workspace 目录建议**

如果你希望把记忆和说明笔记也跟项目放在一起，建议使用这套目录：

```text
workspace/
├── MEMORY.md
├── memory/
│   └── YYYY-MM-DD.md
└── notes/
    ├── memory-context-claw-config.md
    └── openclaw-memory-vs-lossless.md
```

**普通用户日常使用**

装好以后，日常使用其实很简单：

- 稳定长期规则放进 `workspace/MEMORY.md`
- 日常过程记忆放进 `workspace/memory/*.md`
- 项目资料和背景笔记放进 `workspace/notes/`
- 正常继续和 OpenClaw 对话

对 `workspace/notes/`，推荐这样理解：

- 稳定概念/项目分工类笔记：可以作为 stable card 输入
- 历史稿、旧 roadmap、临时配置说明：只保留为背景 notes，不进入 stable card

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
  [system-architecture.md](system-architecture.md)
- 总 roadmap：
  [project-roadmap.md](project-roadmap.md)

如果你特别关心 memory search：

- 专项架构：
  [memory-search-architecture.md](reports/memory-search-architecture.md)
- 专项 roadmap：
  [memory-search-roadmap.md](reports/memory-search-roadmap.md)
- 固定编排 vs 工具调度：
  [memory-search-orchestration-vs-tool-agent.md](reports/memory-search-orchestration-vs-tool-agent.md)

**配置**

详细配置说明：

- [configuration.md](configuration.md)

配置模板：

- [openclaw.context-assembly.example.json](templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](templates/openclaw.context-assembly.llm-rerank.example.json)

发布策略与版本说明：

- [release.md](release.md)

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

- [testsuite.md](testsuite.md)

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

- [name-candidates.md](name-candidates.md)
