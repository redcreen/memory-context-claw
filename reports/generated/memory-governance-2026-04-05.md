# 记忆数据治理报告

日期：2026-04-05

## 目标

对宿主正式记忆目录做一次保守治理，先把最明显不该留在正式记忆层里的“启动 / 问在吗 / greeting / ping / availability”类文件移出主记忆目录，降低它们继续污染：

- startup 读取
- `memory_search`
- 插件外层组装

## 已执行动作

已从：

`/Users/redcreen/.openclaw/workspace/memory`

移动到：

`/Users/redcreen/.openclaw/workspace/memory_archive/2026-04-05-governance`

的文件有：

- `2026-04-01-session-startup.md`
- `2026-04-02-session-greeting.md`
- `2026-04-02-session-ping.md`
- `2026-04-04-availability-check.md`
- `2026-04-05-session-start.md`

第二波又补充归档了明显属于运行产物的文件：

- `cron_sync.log`
- `sync.log`
- `sync_agents.log`
- `sync_all.log`
- `test_agent.hmd`

第三波又补充归档了明显属于一次性调查/运行状态探查的 memory 文档：

- `2026-04-01-exec-approval.md`
- `2026-04-01-feishu-latency.md`
- `2026-04-01-model-limit.md`
- `2026-04-01-slow-diagnosis.md`
- `2026-04-02-model-check.md`
- `2026-04-05-codex-balance.md`

第三波归档目录：

`/Users/redcreen/.openclaw/workspace/memory_archive/2026-04-05-governance-wave3`

第四波又补充归档了更模糊但已被正式规则层覆盖、或明显属于运行过程的短 daily 文件：

- `2026-04-01-1314.md`
- `2026-04-02-0904.md`
- `2026-04-02-0932.md`
- `2026-04-02-1506.md`
- `2026-04-02-ok1-reminder.md`
- `2026-04-05-0128.md`

第四波归档目录：

`/Users/redcreen/.openclaw/workspace/memory_archive/2026-04-05-governance-wave4`

第五波又补充归档了最无争议的历史运行产物：

- `2026-03-28.md.backup`
- `cron_sync.log`
- `sync_all.log`

第五波归档目录：

`/Users/redcreen/.openclaw/workspace/memory_archive/2026-04-05-governance-wave5`

第六波又补充归档了 4 份仍然偏 session 运行过程的文档：

- `2026-04-01-memory-refactor.md`
- `2026-04-01.md`
- `2026-04-02-keyboard-layout.md`
- `2026-04-04-0252.md`

第六波归档目录：

`/Users/redcreen/.openclaw/workspace/memory_archive/2026-04-05-governance-wave6`

第七波没有再手工选文件，而是首次通过自动化 `safe-governance` 脚本，把重复生成的低风险工件归档：

- `cron_sync.log`
- `sync_all.log`

第七波归档目录：

`/Users/redcreen/.openclaw/workspace/memory_archive/2026-04-05-governance-wave7-safe-governance`

## 治理原则

这一轮只处理“高置信噪音”：

- `A new session was started ...`
- greeting / 在么 / ping
- availability check
- 明显的启动回执

不处理以下内容：

- 已确认用户事实
- 已确认身份说明
- 已确认家庭信息
- 仍可能有参考价值的项目/架构调查文档

## 当前结果

正式记忆目录里最明显的启动噪音已经减少了一批。  
这不会直接解决所有宿主原文污染问题，但会立刻降低：

- startup 读到无意义启动回执
- session greeting 被当作 memory 命中
- `在么 / ping` 这类短噪音长期滞留
- 运行日志 / 测试工件被当作正式记忆文件参与消费

## 仍然存在的可疑项

当前正式记忆目录里仍然还有一些更像“运行日志 / 调查过程 / 操作痕迹”的文件，例如：
- `2026-04-02.md`
- `2026-04-05-food-preference.md`
- 以及宿主未来仍可能重新生成的 `.log` 类文件（现在已由 safe-governance 自动归档）

这些不一定都该删，但至少说明：

- 宿主正式记忆目录当前仍然混有“正式记忆”和“运行产物”

## 回归验证

第三波治理后已跑最小真实回归：

- `npm run eval:agent:critical -- --timeout-ms 45000`
- `npm run eval:agent:stable-facts -- --timeout-ms 45000`

结果：

- critical：`2/2` 通过
- stable facts：`6/6` 通过

说明：

- 这轮治理没有破坏“牛排 / 超哥”这类关键主体事实
- 也没有破坏生日、孩子信息、身份证年份说明这些稳定事实链路
- 第四波治理后同样保持：
  - critical：`2/2`
  - stable facts：`6/6`
- 第五波治理后：
  - critical：`2/2`
  - 正式层巡检：`total=14 / clean=8 / pendingRisk=0 / archiveReview=6`
- 第六/七波治理后：
  - critical：`2/2`
  - 正式层巡检：`total=10 / clean=8 / pendingRisk=0 / archiveReview=2`

## 下一步建议

1. 做第二波治理  
只针对明显属于：
- 运行日志
- 状态快照
- 一次性调查过程

当前状态：

- 第一波治理：已完成
- 第二波高置信运行产物治理：已完成
- 第三波调查型 memory 文档治理：已完成
- 第四波短 daily / 过程型文档治理：已完成
- 第五波最无争议归档项治理：已完成
- 第六波 session 过程型文档治理：已完成
- 第七波 safe-governance 自动归档：已完成
- 当前更适合把重心转到：
  - 剩余 2 个特殊 archive-review 项的根源处理
  - confirmed / pending 分层与正式层准入

2. 明确宿主正式层的准入标准  
正式层优先保留：
- 用户事实
- 用户偏好
- 身份说明
- 家庭背景
- 长期规则
- 项目长期定位

3. 待确认 / 需复核内容继续留在插件侧  
通过：
- `memory:export-pending`
- `reports/pending-memory-candidates-YYYY-MM-DD.md`

而不是再进入正式 daily memory
