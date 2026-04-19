# Unified Memory Core 使用手册

[English](usage-guide.md) | [中文](usage-guide.zh-CN.md)

## 为什么需要这份文档

顶层 [README.zh-CN.md](../../../README.zh-CN.md) 应该保持短入口，不适合承载真正细致的使用说明。

这份文档是 `Unified Memory Core` 的长期详细手册，面向真实使用、运维、验证和维护场景。

适合在你需要下面这些内容时阅读：

- 不只是一个安装命令
- 不只是一个一屏项目摘要
- 不只是单点测试说明

## 适合谁看

这份手册主要给下面这些人：

- 想提升 OpenClaw 长期记忆质量的实际用户
- 需要安全安装、配置、验证插件的 operator
- 需要掌握日常 CLI 工作流的维护者
- 需要知道不同输入应该写去哪里的贡献者

如果你只是第一次看这个项目，先从 [../../../README.zh-CN.md](../../../README.zh-CN.md) 开始会更合适。

## 按角色阅读

如果你不想整篇顺着读，可以直接跳到和自己职责对应的部分：

- 普通用户：[普通用户路径](#ordinary-user-path)
- operator：[Operator 路径](#operator-path)
- maintainer：[Maintainer 路径](#maintainer-path)
- release owner：[Release Owner 路径](#release-owner-path)

## 最短心智模型

`Unified Memory Core` 不是“把所有召回结果都倒出来”。

它是一层受治理的记忆系统，会：

- 接收声明式记忆输入
- 生成受治理的 candidate / stable artifacts
- 把这些 artifacts 投影给不同消费者
- 改变最终 OpenClaw 上下文组装，让稳定事实和规则更常胜出

当前仓库已经具备：

- 显式 self-learning lifecycle
- 面向 OpenClaw / Codex 的 policy adaptation
- Stage 5 product hardening 工作流
- 可用 CLI 验证的 release gates

## 内容应该放在哪里

最重要的使用规则，就是把正确的内容放进正确的位置。

### `workspace/MEMORY.md`

这里放长期稳定规则、偏好、身份事实、固定说明。

适合放的内容：

- preferred name
- 稳定饮食偏好
- 持续性的工作风格偏好
- 应该长期容易召回的家庭事实

不要把噪声型日记内容放进这里。

### `workspace/memory/YYYY-MM-DD.md`

这里放近期观察、每日事实、会话相邻信息。

适合放的内容：

- 今天发生了什么变化
- 新出现但还不确定是否长期有效的偏好
- 近期观察到但还不该直接升格为长期规则的内容

这一层的价值就在于它比 `MEMORY.md` 更临时、权威性更低。

### `workspace/notes/*.md`

这里放项目笔记、概念说明、背景材料、可复用总结。

适合放的内容：

- 项目背景和 rationale
- 架构总结
- 后续还会复用的领域概念
- 带清晰复用边界的个人或家庭背景总结

不适合长期升格的内容：

- 过时 roadmap
- 临时调试笔记
- 一次性安装 scratch notes

不是每一份 note 都应该变成 stable learning artifact。

## 先决定安装方式

### 稳定 tag 安装

当你想要稳定、可复现的用户安装目标时，用这个。

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.3.0
```

### 开发头版本安装

当你明确想跟随 `main` 最新变化时，用这个。

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

### 本地 checkout 安装

当你正在修改仓库时，用这个。

```bash
openclaw plugins install -l .
```

### 更安全的本地部署

当你不想让当前工作目录直接成为正在运行的插件副本时，用这个。

```bash
npm run deploy:local
```

## 命令行入口

对正常安装用户，默认应该先用宿主安装副本里的 `umc`，而不是 repo checkout 里的 `./umc`。

默认宿主路径是：

```bash
$HOME/.openclaw/extensions/unified-memory-core/umc
```

最推荐的配置，是把宿主插件目录加进 `PATH`：

```bash
export PATH="$HOME/.openclaw/extensions/unified-memory-core:$PATH"
```

如果你用 `zsh`，长期生效可以写进 `~/.zshrc`：

```bash
echo 'export PATH="$HOME/.openclaw/extensions/unified-memory-core:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

这样以后你就可以直接运行：

```bash
umc where
umc --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc help source add
```

如果你不想改 `PATH`，那就直接跑宿主里的完整路径：

```bash
"$HOME/.openclaw/extensions/unified-memory-core/umc" where
"$HOME/.openclaw/extensions/unified-memory-core/umc" --help
```

仓库 checkout / 开发场景下，最简单、最稳定的命令形态才是：

```bash
./umc source add --source-type manual --content "Remember this: prefer concise summaries."
```

如果你想先把命令位置打出来：

```bash
./umc where
```

这个 wrapper 默认会在运行前打印解析出来的后端 CLI 路径；如果你不想看，可以加 `--no-cli-path`。

现在 `umc --help` 已经按 OpenClaw 类似的方式做了分组和子命令入口。最实用的发现路径是：

```bash
./umc --help
./umc help source
./umc help source add
./umc help verify
```

也可以直接在分组命令上看帮助：

```bash
./umc source --help
./umc source add --help
./umc learn --help
./umc verify --help
```

如果你已经把宿主安装目录加进了 `PATH`，同样的帮助命令可以直接写成：

```bash
umc --help
umc help source add
```

对正常安装用户，建议优先从下面这几条开始：

```bash
umc where
umc --help
umc source --help
umc source add --source-type manual --content "Remember this: prefer concise summaries."
umc learn lifecycle-run --source-type manual --content "Remember this: prefer concise progress reports." --format markdown
umc export inspect --consumer openclaw --format markdown
```

## 最简宿主配置

在 `~/.openclaw/openclaw.json` 里把 `unified-memory-core` 设成激活的 `contextEngine`。

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

如果你手动改配置，改完后先验证：

```bash
openclaw config validate
```

然后确认插件可见：

```bash
openclaw plugins list
openclaw plugins inspect unified-memory-core
```

## Self-Learning 默认行为

nightly self-learning 默认开启。

插件会：

- 扫描最近的 OpenClaw 会话记忆
- 生成受治理的 learning candidates
- 跑 daily reflection
- 自动晋升满足基线规则的 candidates

默认时间：

- 本地时间 `00:00`

只有在你想关闭它或改时间时，才需要显式配置：

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

## 日常使用怎么做

对普通用户来说，工作流应该尽量简单：

1. 把长期稳定事实和规则放进 `workspace/MEMORY.md`
2. 把近期观察放进 `workspace/memory/*.md`
3. 把可复用背景知识放进 `workspace/notes/*.md`
4. 继续正常和 OpenClaw 对话
5. 只有真的应该被系统学习时，才用 `Remember this: ...`

你不需要每天去跑整套 CLI。

<a id="ordinary-user-path"></a>

## 普通用户路径

如果你的目标主要是让 OpenClaw 日常使用里的 recall 质量更好，这条路径最适合你。

### 你应该做什么

1. 除非你明确要追 `main`，否则优先装稳定 tag。
2. 把稳定事实和规则放进 `workspace/MEMORY.md`。
3. 把近期观察放进 `workspace/memory/*.md`。
4. 把可复用背景 notes 放进 `workspace/notes/*.md`。
5. 正常继续和 OpenClaw 对话。

### 你通常不需要做什么

- 每天跑 CLI 验证
- 手动检查 artifacts
- replay / repair 工作流
- release-boundary review

### 最小有用命令

```bash
openclaw plugins list
openclaw plugins inspect unified-memory-core
```

### 普通用户检查清单

- 插件已加载
- `unified-memory-core` 是当前 `contextEngine`
- 长期规则写在 `MEMORY.md`
- 近期事实留在 `workspace/memory/*.md`
- notes 是可复用背景，而不是 scratch 噪声

<a id="operator-path"></a>

## Operator 路径

如果你负责安全安装、配置和环境级信心，这条路径最适合你。

### 你应该做什么

1. 先选对安装方式。
2. 验证 OpenClaw 宿主配置。
3. 确认插件可见且已启用。
4. 在需要宿主运行时信心时跑 host-level smoke。
5. 在需要安装路径信心时跑 bundle-install verification。

### 推荐命令

```bash
openclaw config validate
openclaw plugins list
openclaw plugins inspect unified-memory-core
npm run umc:openclaw-itest -- --format markdown
npm run umc:openclaw-install-verify -- --format markdown
```

### Operator 检查清单

- config 验证通过
- 插件出现在 loaded list
- `contextEngine` 指向 `unified-memory-core`
- 需要运行时信心时，host smoke 为绿
- 需要安装路径信心时，bundle-install verification 为绿

<a id="maintainer-path"></a>

## Maintainer 路径

如果你在修改仓库，并且要保证文档里的证据面持续为绿，这条路径最适合你。

### 你应该做什么

1. 保持 repo regression suite 为绿。
2. 改 lifecycle 或 policy 行为时，保持 Stage 3-4 acceptance 为绿。
3. 改 product-hardening 路径时，保持 Stage 5 acceptance 为绿。
4. 改部署或运行时行为时，保持 host smoke 和 release-preflight 为绿。
5. 排障时，用 export / maintenance / review CLI 做精确定位。

### 推荐命令

```bash
npm test
npm run smoke:eval
npm run eval:memory-search:cases
npm run umc:acceptance -- --format markdown
npm run umc:stage5 -- --format markdown
npm run umc:openclaw-itest -- --format markdown
npm run umc:release-preflight -- --format markdown
```

### Maintainer 调试命令

```bash
npm run umc:cli -- export inspect --consumer generic --format markdown
npm run umc:cli -- maintenance run --format markdown
npm run umc:cli -- export reproducibility --format markdown
npm run umc:cli -- review independent-execution --repo-root . --format markdown
```

### Maintainer 检查清单

- 你改动的层，对应的 acceptance 面仍然为绿
- 报告仍然可读，足以支撑 operator review
- 没有 shortcut 绕开 governed lifecycle 或 release gates
- 文档仍然描述真实当前状态

<a id="release-owner-path"></a>

## Release Owner 路径

如果你在决定这个仓库是否适合打稳定 tag 或对外推荐稳定安装，这条路径最适合你。

### 你应该做什么

1. 跑一条总 release gate。
2. 确认 `README*` 里的安装目标仍然指向预期稳定 tag。
3. 确认 worktree 干净。
4. 在真实 OpenClaw 会话里做一次最终人类 sanity check。
5. 然后再创建并推送 tag。

### 推荐命令

```bash
npm run umc:release-preflight -- --format markdown
git status --short
git tag v0.3.0
git push origin v0.3.0
```

### Release Owner 检查清单

- `release-preflight` 为绿
- 稳定安装示例仍然指向预期 tag
- worktree 没有意外变更
- 人类 sanity check 已完成
- tag 和 release note 与验证证据一致

## 当你说 “Remember this” 时发生了什么

这不是绕开治理的强制写入。

它的作用是帮助系统：

- 提取更强的 learning candidate
- 提高显式信号分数
- 让该内容进入受治理生命周期
- 在 artifact 被晋升后，再投影回 consumer-facing outputs

这很重要，因为仓库的目标不是把原始聊天文本直接无门槛写进 stable memory。

## 推荐的 operator 验证层级

最实用的是分 4 层理解。

### Level 1：基础仓库信心

```bash
npm test
npm run smoke:eval
```

适合做快速回归检查。

### Level 2：governed-learning 信心

```bash
npm run umc:acceptance -- --format markdown
```

适合验证 Stage 3-4 的 lifecycle 和 policy adaptation。

### Level 3：product-hardening 信心

```bash
npm run umc:stage5 -- --format markdown
```

适合拿 maintenance、reproducibility、release-boundary、split-readiness 证据。

### Level 4：release 信心

```bash
npm run umc:release-preflight -- --format markdown
```

这是最强的一条单命令 CLI 门禁。

它会组合：

- 全仓回归
- smoke eval
- memory-search regression
- Stage 5 acceptance
- host-level OpenClaw smoke
- 真实 bundle install verification
- Markdown 链接扫描
- patch cleanliness

如果它通过，仓库状态就可以理解为：

`除了人类验收之外，其余都已验证`

## 宿主级 OpenClaw 检查

如果你要确认插件在真实 OpenClaw profile 里可用，跑：

```bash
npm run umc:openclaw-itest -- --format markdown
```

如果你要确认干净的 release bundle 能通过真实 OpenClaw CLI 安装，跑：

```bash
npm run umc:openclaw-install-verify -- --format markdown
```

这两条不是一回事：

- `umc:openclaw-itest` 验证的是 repo 侧的宿主集成
- `umc:openclaw-install-verify` 验证的是打包后的正式安装路径

## 详细 CLI 工作流

### 检查 export

```bash
npm run umc:cli -- export inspect --consumer generic --format markdown
npm run umc:cli -- export inspect --consumer openclaw --format markdown
npm run umc:cli -- export inspect --consumer codex --format markdown
```

### 跑 maintenance

```bash
npm run umc:cli -- maintenance run --format markdown
```

### 检查 reproducibility

```bash
npm run umc:cli -- export reproducibility --format markdown
```

### 检查 independent execution

```bash
npm run umc:cli -- review independent-execution --repo-root . --format markdown
```

### 检查 split rehearsal

```bash
npm run umc:cli -- review split-rehearsal --format markdown
```

## 怎么判断内容该写去哪

可以用这个决策规则：

- 如果它稳定、并且应该在后续召回中占优，写进 `MEMORY.md`
- 如果它是近期观察、还可能变化，写进 `workspace/memory/*.md`
- 如果它是可复用背景或项目/领域上下文，写进 `workspace/notes/*.md`
- 如果它只是临时 scratch thinking，就不要放进 governed memory inputs

拿不准时，优先放到权威性更低的层级。

## 什么算是“用对了”

下面这些信号说明你在正确使用这套系统：

- 稳定规则和身份事实容易被召回
- 每日噪声不会淹没最终上下文
- notes 能丰富上下文，但不会无控制地变成 stable cards
- promotion 仍然保持保守
- operator 报告仍然足够可读

## 常见错误

- 把日常聊天噪声塞进 `MEMORY.md`
- 期待每个 note 文件都自动变成 stable memory artifact
- 其实需要稳定版，却用了 development-head install
- 跳过 `release-preflight`，却把零散本地运行当作发版证据
- 把“召回数量多”误当成“上下文质量高”

## 排障

### `openclaw plugins list` 里看不到插件

优先检查：

- 安装方式
- `plugins.allow`
- `plugins.entries.unified-memory-core.enabled`
- `plugins.slots.contextEngine`
- `openclaw config validate`

### 插件加载了，但效果看起来没有明显变好

优先检查：

- `workspace/MEMORY.md` 里是否真的有稳定内容
- notes 是否太脏
- 你期待的事实是否还只停留在临时记忆层
- 相关 acceptance 和 smoke 面是否仍然为绿

### 你想在发版前把所有东西都验证掉

直接跑：

```bash
npm run umc:release-preflight -- --format markdown
```

### 你正在改仓库，想要一个更真实的宿主检查

直接跑：

```bash
npm run umc:openclaw-itest -- --format markdown
```

## 接下来读什么

- 项目快速入口：[../../../README.zh-CN.md](../../../README.zh-CN.md)
- 文档首页：[../../README.zh-CN.md](../../README.zh-CN.md)
- 配置参考：[../configuration.zh-CN.md](../configuration.zh-CN.md)
- 测试体系：[testing/README.zh-CN.md](testing/README.zh-CN.md)
- maintenance workflow：[maintenance-workflow.zh-CN.md](maintenance-workflow.zh-CN.md)
- release boundary：[release-boundary.zh-CN.md](release-boundary.zh-CN.md)
- runtime API prerequisites：[runtime-api-prerequisites.zh-CN.md](runtime-api-prerequisites.zh-CN.md)
- 发布流程：[../../../RELEASE.zh-CN.md](../../../RELEASE.zh-CN.md)
