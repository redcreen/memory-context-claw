# Smoke Baseline Report

## 当前结论

`smoke` 现在已经不只是“有一批案例”，而是正式变成了回归保护面。

当前状态：

- `critical smoke`：`10/10` 通过
- `full smoke`：`19/19` 全通过
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
- `project-positioning-smoke`

## 最近一次运行结果

### Full baseline

结果：

- `cases = 19`
- `passed = 15`
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
- `这个项目主要解决什么问题`
  - top1: `README.md`
  - `这是一个面向 OpenClaw 的 context engine 插件，负责把长期记忆更稳定地变成当前轮可用的上下文。`

### 这轮新收口的

- `memorySearch.provider 是做什么的`
  - top1: `configuration.md`
  - `memorySearch.provider 决定长期记忆检索使用哪个 embedding / memory_search provider，不影响主聊天模型。`
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

`smoke 现在已经收敛成“critical 10/10 全绿，full baseline 19/19 全绿”的状态。`
