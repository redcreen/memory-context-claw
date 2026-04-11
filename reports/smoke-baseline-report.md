# Smoke Baseline Report

## 当前结论

`smoke` 现在已经不只是“有一批案例”，而是正式变成了回归保护面。

当前状态：

- `critical smoke`：`10/10` 通过
- `full smoke`：`24/24` 全通过
- 新增的 `timezone-smoke`、`communication-style-smoke`、`reminder-channel-smoke`、`execution-rule-smoke`、`openviking-role`、`agent-routing-rule`、`main-boundary-rule`、`main-negative-boundary-rule`、`status-word-rule` 已经转正

## 当前 smoke 分层

### 1. Critical smoke

入口：

```bash
npm run smoke:eval:critical
```

当前覆盖：

- `user-facts`
- `rules`

当前 case：

- `food-preference`
- `identity-name`
- `birthday-solar-smoke`
- `daughter-profile-smoke`
- `timezone-smoke`
- `communication-style-smoke`
- `reminder-channel-smoke`
- `execution-rule-smoke`
- `memory-md-scope`
- `workspace-layering`

### 2. Full baseline smoke

入口：

```bash
npm run smoke:eval
```

当前覆盖：

- `user-facts`
- `rules`
- `concepts`
- `project`

当前 case：

- `food-preference`
- `identity-name`
- `birthday-solar-smoke`
- `daughter-profile-smoke`
- `timezone-smoke`
- `communication-style-smoke`
- `reminder-channel-smoke`
- `execution-rule-smoke`
- `memory-md-scope`
- `workspace-layering`
- `lossless-understanding`
- `provider-role`
- `openviking-role`
- `agent-routing-rule`
- `main-boundary-rule`
- `main-negative-boundary-rule`
- `status-word-rule`
- `plugin-config`
- `release-install-rule`
- `install-verify-rule`
- `workspace-layout-rule`
- `workspace-notes-rule`
- `project-positioning-smoke`
- `pending-rule-smoke`

## 最近一次运行结果

### Full baseline

结果：

- `cases = 24`
- `passed = 24`
- `failed = 0`

### Critical smoke

结果：

- `cases = 10`
- `passed = 10`
- `failed = 0`

## 这次 smoke 说明了什么

### 已经收稳的

- `我爱吃什么`
  - top1: `cardArtifact`
  - `你爱吃牛排`
- `你怎么称呼我`
  - top1: `cardArtifact`
  - `你叫刘超，我平时记你是超哥`
- `我生日是什么时候`
  - top1: `cardArtifact`
  - `你的生日是1983-02-06，农历生日是腊月二十四`
- `我女儿叫什么，生日是哪天，现在几年级`
  - top1: `cardArtifact`
  - `你女儿叫刘子妍，生日是2014-12-29，现在上五年级`
- `我的时区是什么`
  - top1: `cardArtifact`
  - `你的时区是GMT+8（北京时间）`
- `你应该怎么跟我沟通`
  - top1: `cardArtifact`
  - `你的沟通风格偏好是直接、实用、不废话`
- `我说提醒时默认用什么`
  - top1: `cardArtifact`
  - `当你说提醒时，默认使用飞书任务 + 苹果日历双通道。`
- `收到明确任务后，低风险可逆操作应该怎么做`
  - top1: `cardArtifact`
  - `收到明确任务后，纯内部、低风险、可逆操作可直接执行；高风险动作才先确认。`
- `MEMORY.md 应该放什么内容`
  - top1: `formal-memory-policy.md`
  - `MEMORY.md 应该放的是长期稳定、会被反复复用的内容。`
- `memory-context-claw 这个插件的配置应该怎么写`
  - top1: `configuration.md`
  - `把它挂到 contextEngine，并在 entries 里 enabled: true`
- `普通用户应该安装稳定版还是 main`
  - top1: `README.md`
  - `普通用户默认应安装 release tag；只有主动跟进最新开发时才直接安装 main。`
- `安装后怎么确认插件已经生效`
  - top1: `configuration.md`
  - `先运行 openclaw plugins list，再运行 openclaw memory status --json。`
- `这个项目的内置 workspace 目录应该怎么组织`
  - top1: `README.md`
  - `workspace/MEMORY.md 放长期规则，workspace/memory/ 放 daily memory，workspace/notes/ 放背景笔记。`
- `项目路线图应该看哪个文档`
  - top1: `project-roadmap.md`
  - `项目总 roadmap 看 project-roadmap.md；memory search 专项 roadmap 看 reports/memory-search-roadmap.md。`
- `workspace/notes 里的笔记什么时候能进入 stable card`
  - top1: `README.md`
  - `workspace/notes 里只有带明确总结和适用场景、并且表达稳定概念或项目分工的 notes，才适合进入 stable card；历史 roadmap 和临时配置说明应只保留为背景 notes。`
- `长期记忆目录规则是什么`
  - top1: `README.md`
  - `workspace/MEMORY.md 放长期规则，workspace/memory/ 放 daily memory，workspace/notes/ 放背景笔记。`
- `这个项目主要解决什么问题`
  - top1: `README.md`
  - `这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。`
- `待确认信息应该放哪里`
  - top1: `formal-memory-policy.md`
  - `待确认信息应该先进入 pending，不得默认写入 MEMORY.md 或 memory/YYYY-MM-DD.md。`

### 这轮新收口的

- `为什么已经有长期记忆了，还需要 Lossless`
  - 根因不是 scoring 不够，而是 `workspace/notes/openclaw-memory-vs-lossless.md` 之前没有进入 stable project card 读取链
  - 修正后，`Lossless` 分工说明已经能稳定作为 `cardArtifact` top1 命中
- `memorySearch.provider 是做什么的`
  - top1: `configuration.md`
  - `memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。`
  - 同时 assemble 已不再把长 session transcript 带进最终 selected context
- `长期记忆目录规则是什么`
  - 之前会先落到 formal policy
  - 现在已经识别成 `workspace structure` 类意图，top1 回到 `README.md` 的目录结构卡
  - assemble 最终现在只保留目录结构卡
- `这个项目主要解决什么问题`
  - assemble 最终现在只保留 `README.md` 的项目定位卡，不再混入 `Lossless` note / `MEMORY.md` / formal policy
- `项目路线图应该看哪个文档`
  - 新增 `projectNavigation` stable intent
  - top1 / selected 现在都稳定回到 `project-roadmap.md`
  - 不再掉进 session transcript 或无关 policy
- `为什么已经有长期记忆了，还需要 Lossless`
  - assemble 最终现在只保留 `workspace/notes/openclaw-memory-vs-lossless.md`
- `我生日是什么时候`
  - mixed-mode 槽位过滤后，最终只保留生日卡
- `我女儿叫什么，生日是哪天，现在几年级`
  - mixed-mode 槽位过滤后，最终只保留女儿卡
- `我的孩子情况是什么`
  - mixed-mode 槽位过滤后，不再把“身份证登记年份说明”带进最终 selected
- `workspace/notes 里的笔记什么时候能进入 stable card`
  - `README.md` 中的 workspace notes 准入规则已转成 stable card
  - notes 准入边界现在不再只是文档约定，而是正式进入 stable retrieval / smoke 保护面
- `待确认信息应该放哪里`
  - `formal-memory-policy.md` 中的 pending 准入规则已转成 stable card
  - 现在会稳定命中 `先进入 pending，不得默认写入 MEMORY.md 或 memory/YYYY-MM-DD.md`
- `你应该怎么跟我沟通`
  - 根因不是 card 没生成，而是 style intent 之前只匹配 `怎么沟通`，没有匹配 `怎么跟我沟通`
  - 修正后，`MEMORY.md` 的 style card 已稳定进入 fast path
- `我说提醒时默认用什么`
  - `MEMORY.md` 中的提醒通道偏好已经转成 stable card
  - 现在会稳定命中 `飞书任务 + 苹果日历` 这条正式规则
- `收到明确任务后，低风险可逆操作应该怎么做`
  - `MEMORY.md` 中的 main 工作原则已经转成 stable card
  - 现在会稳定命中 `默认推进，风险动作再确认` 这条正式执行规则
- `OpenViking 是做什么的`
  - `MEMORY.md` 中的记忆系统分工已经转成 stable card
  - 现在会稳定命中 `长期记忆检索补充工具` 这条正式说明

## 建议

### 每轮继续跑

```bash
npm run smoke:eval:critical
```

### 阶段性再跑

```bash
npm run smoke:eval
```

## 一句话

`smoke 现在已经收敛成“critical 10/10 全绿，full baseline 25/25 全绿”的状态。`
