# Unified Memory Core

[English](README.md) | [中文](README.zh-CN.md)

> 一套面向 OpenClaw 的受治理共享记忆核心：已经具备事实优先上下文、逐轮 context 优化、显式 self-learning lifecycle，以及可用 CLI 验证的发版门禁。

## 为什么现在就值得用

如果你想先看一句最实在的话：

- 最新完整回归：`414 / 414`
- latest available release-preflight：`8 / 8` 通过
- retrieval-heavy CLI benchmark：`262 / 262`
- isolated local answer-level gate：`12 / 12`，其中中文样本 `6 / 12`
- 更深的 answer-level watch：`14 / 18`
- 仓库当前维护的 runnable matrix：`392` 个 case，其中中文相关占比 `53.83%`
- 既有记忆消费型 live A/B：`100` 个真实 answer-level 案例里，current `100 / 100`、legacy `99 / 100`、`1` 个只有 Memory Core 能答对、`0` 个只有默认内置能答对、`0` 个两边都失败
- dialogue working-set runtime shadow：replay `16 / 16`，answer A/B baseline `5 / 5`、shadow `5 / 5`，average reduction ratio `0.4368`
- 普通对话实时写记忆专项 A/B：
  - 宿主 live：`current=38`、`legacy=21`、`UMC-only=18`
  - Docker hermetic（`30s` turn budget）：`current=3`、`legacy=0`、`UMC-only=3`、`both-fail=37`

建议先看这两份：

- [为什么 Unified Memory Core 用起来更顺手](docs/memory-improvement-evidence.zh-CN.md)
- [完整回归与记忆提升报告](reports/generated/unified-memory-core-full-regression-and-memory-improvement-2026-04-15.md)
- [Context 瘦身与预算化组装](docs/reference/unified-memory-core/architecture/context-slimming-and-budgeted-assembly.zh-CN.md)
- [对话 Working-Set 裁剪](docs/reference/unified-memory-core/architecture/dialogue-working-set-pruning.zh-CN.md)
- [普通对话实时写记忆专项对比](reports/generated/openclaw-ordinary-conversation-memory-intent-ab-2026-04-16.md)
- [普通对话 Docker 隔离复测总结](reports/generated/openclaw-ordinary-conversation-memory-intent-docker-rerun-2026-04-17.md)

最诚实的结论是：OpenClaw 内置记忆在很多“已有记忆消费”的简单题上本来就不差，所以旧的 `100` 条 A/B 差异不大；而在“普通对话里实时写入，再跨会话召回”这条线上，宿主 live 结果显示 Unified Memory Core 有明显优势，但 Docker hermetic 复测又证明这条优势目前会被 answer-level timeout 严重吞掉。也就是说，UMC 现在不只是要“记得更好”，还要把这条写侧能力做得更快、更稳、更可复现。

## 四个主要卖点

这个仓库现在不应该再只被理解成“一个检索更强的记忆插件”，而应该从四个主要卖点来理解。

1. `按需加载 context，而不是平铺直塞 prompt`
   - 当前已落地：fact-first context assembly、durable-source slimming 架构，以及 runtime working-set shadow instrumentation
   - 当前可量化证据：dialogue working-set runtime shadow replay average reduction ratio = `0.4368`，同时 runtime answer A/B baseline `5 / 5`、shadow `5 / 5`
   - 下一里程碑：把它进一步收口成更难 live A/B 上稳定的“对比内置的 context thickness / latency”门禁
2. `每轮对话 + 每夜批处理的 self-learning`
   - 当前已落地：realtime `memory_intent` ingestion、governed promotion / decay，以及默认开启的 nightly self-learning
   - 当前可量化证据：ordinary-conversation host-live A/B 当前是 current `38 / 40`、legacy `21 / 40`，其中 `18` 条是 UMC-only wins
   - 当前限制：Docker hermetic 复测仍然明显受 answer timeout 约束，所以这条卖点已经真实存在，但在紧预算下还没完全释放出来
3. `可用 CLI 管理、检查、维护的记忆系统`
   - 当前已落地：`umc source add`、inspect / audit / repair / replay / export、registry inspect / migrate，以及 release-preflight checks
   - 产品含义：记忆内容可以被 operator 当成受治理工件来添加、维护和回放，而不是一个黑盒插件状态
4. `一个共享底座，OpenClaw / Codex / 多实例都能复用`
   - 当前已落地：shared contracts、canonical registry root、projection / export 层、OpenClaw adapter、Codex adapter
   - 产品含义：一套 governed memory core 可以服务多个 OpenClaw 实例和跨宿主消费者，而不是把记忆锁死在单个 runtime 里

这些卖点还必须同时满足六条产品品质要求：

- `简单`
  - 安装路径、默认配置和首次验证应该一看就会，不需要用户先理解整套治理体系
- `好用`
  - 默认工作流应该直接、清楚，一上手就能感觉到“回答更顺、上下文更准”
- `轻量`
  - runtime 的目标是少给 context、少长控制层，安装包和运行负担都要尽量小
- `够快`
  - answer path、context assembly 和日常操作必须足够快，不能让用户为了“更聪明的记忆”付出明显卡顿
- `聪明`
  - 系统应该会记重点、会拒绝噪音、会按需给 context，并在不确定时保持收敛
- `易维护`
  - operator 必须能够 inspect、replay、repair、rollback，而不是去反向猜测隐藏状态

## 产品北极星

这条产品目标现在可以直接压成一句话：

> 装得简单，用得顺手，跑得轻快，记得聪明，维护省心。

如果拆成技术和工程约束，分别是：

- `装得简单`
  - 安装命令要短，默认配置要少，首次验证要直接
  - 工程含义：安装包结构、默认配置、插件加载验证、CLI 入口都必须尽量降低首次接入成本
- `用得顺手`
  - 用户不应该先学一整套治理概念，才能感受到价值
  - 工程含义：默认路径优先，功能开关克制，常见操作和常见问题都要能被直觉式完成
- `跑得轻快`
  - 不只是“能跑”，而是上下文更轻、主路径更顺、体感更快
  - 工程含义：prompt thickness、context assembly、answer latency、安装包体积、运行时负担都要一起受控
- `记得聪明`
  - 该记的记住，不该记的不乱记；该给的 context 才给，不相关的不乱塞；不确定时宁可收敛，不乱猜
  - 工程含义：self-learning、working-set pruning、budgeted assembly、abstention / guardrail、bounded decision contract 要协同工作
- `维护省心`
  - 出问题时要能看、能查、能回放、能回退，而不是只能靠猜
  - 工程含义：inspect / audit / replay / repair / rollback / hermetic eval 这些 operator surface 必须一直是正式能力

## 当前离北极星还有多远

按当前证据看，这个产品已经不是“概念验证”，但离北极星还有几处明确缺口。

已经比较稳的部分：

- `维护省心`
  - CLI、audit、replay、repair、rollback、release-preflight、Docker hermetic eval 这些 operator 面已经很像正式产品能力
- `self-learning` 主干
  - realtime + nightly 两条学习路径都已经落地，而且 host-live A/B 已经能看到真实增益
- `context 优化` 的主线地位
  - durable-source slimming 和 working-set pruning 都已经成为正式 workstream，不再只是 report 里的想法

当前仍然偏薄弱的部分：

- `简单`
  - 安装后仍然需要手改 `openclaw.json`、可选改 `PATH`，首次接入还不够“一看就会”
- `够快`
  - Docker hermetic 下的普通对话实时写记忆仍然明显受 timeout 压力影响，真实可复现环境下的速度还不够稳
- `聪明`
  - context 优化虽然已经验证可行，但当前仍是 shadow-only，还没有变成默认用户收益
- `轻量`
  - 轻量目前更多还是目标和方向，包体、启动成本、默认运行负担还没被收成硬门禁
- `共享底座`
  - 架构上已经成立，但产品级证据目前仍明显偏 OpenClaw，Codex / 多实例这条还缺更像产品证明的案例

所以接下来的重点顺序应该很明确：

1. 先把 `简单` 收成更短的 install / bootstrap / verify 路径。
2. 再把 `够快` 收成更强的 hermetic / timeout / latency gate。
3. 然后把 `聪明` 从 shadow measurement surface 推进到极窄的 guarded opt-in 用户路径。
4. 同时把 `轻量` 收成明确的包体、启动成本、prompt thickness 和 runtime budget 目标。
5. 最后补强 `共享底座` 的跨 OpenClaw / Codex 证据面。

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
- 把 durable source 瘦身和长对话 working-set 裁剪收成“逐轮 context 优化”主线
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

现在最重要的两条横切主线已经很明确：

- `self-learning`
  - 受治理的 reflection、promotion、decay、policy adaptation 和 export surfaces
- `context 优化`
  - durable-source slimming 与 budgeted assembly
  - 长多话题会话里的 dialogue working-set pruning
  - 在任何 active prompt experiment 之前先落 `default-off` 的 runtime shadow instrumentation

## 为什么 Context 优化已经变成主线

这个仓库现在其实有两条旗舰方向：

1. `self-learning`
2. `context 优化`

第二条现在已经不是边角优化了。

原因很现实：

- retrieval / assembly 本身已经够快，不再是最主要瓶颈
- answer-level latency 和 prompt thickness 才是接下来更大的问题
- 很多“记忆质量问题”本质上是“这一轮还带了太多已经不相关的 context”

所以 `context 优化` 现在必须被当成正式里程碑工作，而不是 OpenClaw adapter 里的局部微调。

它现在分成两条互补的架构面：

- durable source 的瘦身与预算化组装
  - [Context 瘦身与预算化组装](docs/reference/unified-memory-core/architecture/context-slimming-and-budgeted-assembly.zh-CN.md)
- 长对话 raw turns 的 working-set 裁剪
  - [对话 Working-Set 裁剪](docs/reference/unified-memory-core/architecture/dialogue-working-set-pruning.zh-CN.md)

当前状态：

- Stage 6 runtime shadow integration 已经落地
- 继续保持 `default-off` 和 shadow-only
- active prompt mutation 仍然延后
- 下一轮先做 docs-first：先把 bounded LLM-led decision contract、operator metrics、rollback boundary 和 harder A/B 设计写清楚，再动默认 prompt path

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
