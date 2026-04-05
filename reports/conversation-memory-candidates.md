# 对话记忆沉淀建议

## 这份文件讲什么
这份文件不是把整段聊天直接塞进长期记忆，而是从最近会话里抽出更像“可沉淀记忆”的候选项。

- Agent: `main`
- 扫描会话文件数: `4`
- 扫描消息数: `1672`
- 候选长期记忆: `11`
- 候选每日记忆: `3`
- 长期候选建议直升 MEMORY.md: `0`
- 长期候选建议人工复核: `9`
- 长期候选已被现有 MEMORY 覆盖: `2`
- 每日候选建议直升 daily memory: `0`
- 每日候选建议人工复核: `3`
- 每日候选已被现有 daily memory 覆盖: `0`

## 建议进入 MEMORY.md
这些更像长期稳定规则、偏好、工作方式。

- `MEMORY.md` 应该放的是**长期稳定、会被反复复用的内容**。 你之前定的范围主要是这些： - **长期偏好** - **固定工作流程** - **常用术语与约定** - **项目长期背景** 维护原则也很明确： - 内容尽量稳定 - 尽量写成可复用的事实或规则 - 一条信息尽量只表达一个主题 - **频繁变化的内容不要先塞这里，先放到 `memory/`** 所以一句话说，`MEMORY.md` 不是流水账，也不是当天纪要，而是“长期有效的人设、规则、背景底座”。
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`assistant-conclusion` · score=13
  建议动作: `skip-memory-md-existing` · confidence=`high`
  判断依据: 与现有记忆重复（MEMORY.md）；匹配方式：semantic-document
  已覆盖位置: `MEMORY.md` · match=`semantic-document`
- `MEMORY.md` 应该放 **长期稳定、会被反复复用的规则、偏好和背景信息**
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=13
  建议动作: `skip-memory-md-existing` · confidence=`high`
  判断依据: 与现有记忆重复（MEMORY.md）；匹配方式：semantic-document-coverage
  已覆盖位置: `MEMORY.md` · match=`semantic-document-coverage`
- 按我这边**最新记录**，你爱吃**牛排**
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=7
  建议动作: `review-memory-md` · confidence=`low`
- 按我这边最新的记录，你爱吃**牛排**
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=7
  建议动作: `review-memory-md` · confidence=`low`
- 我一般叫你**超哥**
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=6
  建议动作: `review-memory-md` · confidence=`low`
- 你爱吃**面食**，像**面条、馒头**这些
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=5
  建议动作: `review-memory-md` · confidence=`low`
- 你爱吃面食，主要是面条、馒头这些
  来源: `65554bde-0572-4747-a6ff-9a98952929a1.jsonl` · `assistant` · channel=`generic` · score=5
  建议动作: `review-memory-md` · confidence=`low`
- 你爱吃面食，像面条、馒头这些
  来源: `65554bde-0572-4747-a6ff-9a98952929a1.jsonl` · `assistant` · channel=`generic` · score=5
  建议动作: `review-memory-md` · confidence=`low`
- 你爱吃**牛排**
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=4
  建议动作: `review-memory-md` · confidence=`low`
- 你爱吃牛排
  来源: `65554bde-0572-4747-a6ff-9a98952929a1.jsonl` · `assistant` · channel=`generic` · score=4
  建议动作: `review-memory-md` · confidence=`low`
- 你爱吃啥
  来源: `d86c3d03-c07e-4b4d-a4b5-7b13679638bd.jsonl.reset.2026-03-21T10-03-50.253Z` · `assistant` · channel=`generic` · score=4
  建议动作: `review-memory-md` · confidence=`low`

## 建议进入当日 memory
这些更像阶段结论、当前进展、项目决策，建议审阅后写入 `/Users/redcreen/Project/长记忆/memory/2026-04-05.md`。

- 另外，你之前的实际判断顺序是：**先把 OpenClaw 内置长期记忆和检索跑通，再在确实感觉长对话上下文丢失严重时，考虑上 Lossless
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=14
  建议动作: `review-daily-memory` · confidence=`medium`
  判断依据: 信号强度较高
- - **但不够理想**：你之前已经明确要求它“默认推进、少问重复确认”
  来源: `65554bde-0572-4747-a6ff-9a98952929a1.jsonl` · `assistant` · channel=`generic` · score=12
  建议动作: `review-daily-memory` · confidence=`medium`
  判断依据: 信号强度较高
- 更具体点说，它主要补的是这层： - 决定**当前这一轮**到底把哪些信息送进 prompt - 长对话变长后，尽量减少关键细节丢失 - 把检索回来的记忆和当前会话内容**更合理地编排、压缩、拼接** - 让模型“眼前真正看到的内容”更完整、更对题 所以你之前的判断是： - **Memory** = 负责“存”和“找” - **Lossless** = 负责“喂给模型” 也就是它偏**上下文层**，不是偏**记忆层**
  来源: `103587ff-4d67-4598-8de7-ba361cf96fca.jsonl` · `assistant` · channel=`generic` · score=8
  建议动作: `review-daily-memory` · confidence=`medium`
  判断依据: 信号强度中等

## 为什么还需要人工审阅
- 对话里有很多上下文依赖句子，直接入库容易带噪音。
- 长期记忆应该是提炼后的结论，不应该是聊天原句堆砌。
- 这份文件的作用是把“聊天里可能有价值的东西”先找出来，再决定写到哪里。
