# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> 一个面向 OpenClaw 的受治理记忆核心：让长期规则、偏好和项目事实更稳定地进入当前上下文，同时让长对话更少依赖 `compact`。

## 北极星目标

> 装得简单，用得顺手，跑得轻快，记得聪明，维护省心。

当前对外的 3 个核心卖点，仍然就是：

- `轻快`
- `聪明`
- `省心`

当前已经实现的能力，和这 3 个卖点的对应关系是：

- `轻快`
  主要讲的是：
  - 事实优先的上下文组装
  - `Context Minor GC`
  - 更长对话下更少依赖 `compact`
  - 更短的安装、验证和部署路径
  当前已经落地的代表能力：
  - OpenClaw 默认 guarded `Context Minor GC`
  - near-compaction threshold Docker A/B
  - `umc:openclaw-install-verify`
  - `release-preflight`

- `聪明`
  主要讲的是：
  - realtime governed memory ingest
  - nightly self-learning
  - promotion / decay
  - 规则、偏好、项目事实的稳定进入与复用
  当前已经落地的代表能力：
  - `memory_intent`
  - `memory_extraction`
  - `accepted_action`
  - ordinary-conversation realtime ingest
  - governed registry / reflection / candidate -> stable 闭环

- `省心`
  主要讲的是：
  - 可审计、可回放、可修复、可回退
  - 可复现验证
  - release / install / host smoke 的 operator 面
  - 跨宿主共享契约
  当前已经落地的代表能力：
  - `umc` CLI
  - audit / replay / repair / rollback
  - Docker hermetic 验证
  - `release-preflight`
  - OpenClaw / Codex shared contract

## 这是什么

`Unified Memory Core` 主要做两件事：

1. 让真正重要的记忆更容易进入当前轮上下文
2. 让长对话在切题后更薄，而不是越聊越厚

它不是“再加一层普通检索”，而是把这几件事一起收口：

- 事实优先的上下文组装
- `Context Minor GC` 长对话瘦身
- 受治理的实时/夜间记忆提取与晋升
- 可审计、可回放、可回退的 operator 面

## 用户能得到什么

- 更稳的当前轮上下文
  规则、身份、偏好、项目事实，不容易被无关历史和会话噪音冲掉。

- 更长对话下更少依赖 `compact`
  `Context Minor GC` 现在默认随 OpenClaw 路径生效；在 host-visible 验证里已经证明：接近 compact danger zone 时，切题后可以把实际 prompt 拉回阈值下方，而不是立刻依赖手动 `compact`。

- 更受治理的记忆写入
  显式长期规则、工具偏好、用户偏好，不必只等 nightly 才有机会进入长期记忆。

- 更可维护
  有 `umc` CLI、audit、replay、repair、rollback、Docker hermetic 验证，适合长期维护和回归。

## 适合谁

适合这些场景：

- 你已经在用 OpenClaw，希望长期记忆真正改善当前轮回答质量
- 你有稳定规则、用户偏好、项目事实，需要长期保留并反复复用
- 你希望长对话更稳，不想频繁靠 `compact`
- 你需要一套可验证、可回放、可审计的记忆基础设施

不主要解决这些问题：

- 直接替代 OpenClaw 全部内置长期记忆
- 改写宿主原生 `memory_search`
- 完全不使用长期记忆、笔记或规则的场景

## 快速开始

### 安装

稳定版：

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.3.1
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

这份最简配置下，默认已经包含：

- ordinary-conversation realtime governed memory ingest
- `Context Minor GC` guarded path

不需要再额外打开 guarded 开关。

### 验证是否加载成功

```bash
openclaw plugins list
```

你应该能看到 `unified-memory-core`。

### 安装后的 `umc`

默认可执行文件在：

```bash
$HOME/.openclaw/extensions/unified-memory-core/umc
```

建议把它加入 `PATH`：

```bash
export PATH="$HOME/.openclaw/extensions/unified-memory-core:$PATH"
```

常用命令：

```bash
umc where
umc --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc export inspect --consumer openclaw --format markdown
```

## 建议的工作区结构

```text
workspace/
├── MEMORY.md
├── memory/
│   └── YYYY-MM-DD.md
└── notes/
    ├── unified-memory-core-config.md
    └── openclaw-memory-vs-lossless.md
```

最短理解：

- `workspace/MEMORY.md`
  放长期稳定、会反复复用的规则和事实

- `workspace/memory/*.md`
  放近期已确认的信息和 daily memory

- `workspace/notes/*.md`
  放项目/领域背景笔记

不是所有 `notes` 都应该进 stable card。只有有明确总结、可复用规则/概念、适用边界清楚的 notes 才适合升格。

## 核心能力

- 事实优先的上下文组装
- 长对话 `Context Minor GC`
- 规则、身份、偏好的优先级控制
- 受治理的 `memory_intent` / `accepted_action` 写入链路
- 夜间 self-learning 与 candidate promotion
- 面向 OpenClaw、Codex 和未来消费者的 export / projection
- audit、repair、replay、rollback、release-preflight

## 推荐先看

- [为什么 Unified Memory Core 用起来更顺手](docs/memory-improvement-evidence.zh-CN.md)
- [Context Minor GC](docs/reference/unified-memory-core/architecture/context-minor-gc.zh-CN.md)
- [OpenClaw Near-Compaction Threshold Docker A/B](reports/generated/openclaw-guarded-session-probe-threshold-docker-2026-04-19.md)
- [详细使用手册](docs/reference/unified-memory-core/usage-guide.zh-CN.md)
- [配置参考](docs/reference/configuration.zh-CN.md)
- [路线图](docs/roadmap.zh-CN.md)

## 维护者入口

如果你是在维护这个仓库，而不是普通安装用户，先看：

- [文档首页](docs/README.zh-CN.md)
- [架构](docs/architecture.zh-CN.md)
- [测试计划](docs/test-plan.zh-CN.md)
- [开发计划](docs/reference/unified-memory-core/development-plan.zh-CN.md)
- [发布说明](RELEASE.zh-CN.md)

本地开发常用命令：

```bash
npm test
npm run smoke:eval
npm run umc:openclaw-itest -- --format markdown
npm run umc:openclaw-install-verify -- --format markdown
npm run umc:release-preflight -- --format markdown
```

本地部署到 OpenClaw：

```bash
npm run deploy:local
openclaw gateway restart
```
