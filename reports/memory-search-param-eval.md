# Memory Search 参数实验

- 时间: `2026-04-05T02:05:44.899Z`
- Agent: `main`
- 查询: `用户爱吃什么 饮食 喜欢吃 刘超 超哥`

## 结论摘要

- `baseline-default`: total=`20` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`
- `temporal-7d`: total=`20` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`
- `temporal-1d`: total=`20` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`
- `text-heavy`: total=`20` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`
- `text-dominant`: total=`0` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`
- `wide-candidate-pool`: total=`30` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`
- `mmr-diversity`: total=`30` · steakRank=`not-found` · firstMemoryRank=`not-found` · memoryHits=`0`

## 逐组结果

### baseline-default

```json
{
  "query": "default"
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{"sessions":10}`

Top 5:
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.505959677696228` · 确性 | ✅ | 爱吃面食的信息正确 | | 整体 | **✅ 正确** | 回答是对的，因为有记忆支撑"刘超=超哥" | --- 所以刚才的回答是**靠谱的*
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.5002335160970688` · Assistant: 嘿，超哥！三德子刚睡醒，这会儿精神着呢～这么晚了还没睡呀？有啥事儿需要我帮忙的？
User: Sender (untrusted meta
- `sessions/07bf7a32-4c9b-43b2-b214-f0bafb08919a.jsonl.reset.2026-03-21T03-47-23.984Z` · score=`0.4980023652315139` ·  - [] 刘超在饮食上偏好面食，具体包括面条和馒头。然而，出于重要的健康考量，特别是为了严格控制体重和有效管理血压，用户目前正处于严格的饮食控制阶段，因此主动
- `sessions/37515420-e068-4ad8-8606-00e507936964.jsonl.reset.2026-03-21T09-57-24.184Z` · score=`0.4972275227308273` · 的个性化信息，例如饮食偏好（爱吃面
- `sessions/5ffcb01c-881e-4834-a268-49f5ba6d2319.jsonl.reset.2026-03-21T05-45-47.109Z` · score=`0.4972275227308273` · 的个性化信息，例如饮食偏好（爱吃面

### temporal-7d

```json
{
  "query": {
    "maxResults": 20,
    "minScore": 0.2,
    "hybrid": {
      "enabled": true,
      "vectorWeight": 0.7,
      "textWeight": 0.3,
      "candidateMultiplier": 4,
      "temporalDecay": {
        "enabled": true,
        "halfLifeDays": 7
      }
    }
  }
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{"sessions":10}`

Top 5:
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.505959677696228` · 确性 | ✅ | 爱吃面食的信息正确 | | 整体 | **✅ 正确** | 回答是对的，因为有记忆支撑"刘超=超哥" | --- 所以刚才的回答是**靠谱的*
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.5002335160970688` · Assistant: 嘿，超哥！三德子刚睡醒，这会儿精神着呢～这么晚了还没睡呀？有啥事儿需要我帮忙的？
User: Sender (untrusted meta
- `sessions/07bf7a32-4c9b-43b2-b214-f0bafb08919a.jsonl.reset.2026-03-21T03-47-23.984Z` · score=`0.4980023652315139` ·  - [] 刘超在饮食上偏好面食，具体包括面条和馒头。然而，出于重要的健康考量，特别是为了严格控制体重和有效管理血压，用户目前正处于严格的饮食控制阶段，因此主动
- `sessions/37515420-e068-4ad8-8606-00e507936964.jsonl.reset.2026-03-21T09-57-24.184Z` · score=`0.4972275227308273` · 的个性化信息，例如饮食偏好（爱吃面
- `sessions/5ffcb01c-881e-4834-a268-49f5ba6d2319.jsonl.reset.2026-03-21T05-45-47.109Z` · score=`0.4972275227308273` · 的个性化信息，例如饮食偏好（爱吃面

### temporal-1d

```json
{
  "query": {
    "maxResults": 20,
    "minScore": 0.2,
    "hybrid": {
      "enabled": true,
      "vectorWeight": 0.7,
      "textWeight": 0.3,
      "candidateMultiplier": 4,
      "temporalDecay": {
        "enabled": true,
        "halfLifeDays": 1
      }
    }
  }
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{"sessions":10}`

Top 5:
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.505959677696228` · 确性 | ✅ | 爱吃面食的信息正确 | | 整体 | **✅ 正确** | 回答是对的，因为有记忆支撑"刘超=超哥" | --- 所以刚才的回答是**靠谱的*
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.5002335160970688` · Assistant: 嘿，超哥！三德子刚睡醒，这会儿精神着呢～这么晚了还没睡呀？有啥事儿需要我帮忙的？
User: Sender (untrusted meta
- `sessions/07bf7a32-4c9b-43b2-b214-f0bafb08919a.jsonl.reset.2026-03-21T03-47-23.984Z` · score=`0.4980023652315139` ·  - [] 刘超在饮食上偏好面食，具体包括面条和馒头。然而，出于重要的健康考量，特别是为了严格控制体重和有效管理血压，用户目前正处于严格的饮食控制阶段，因此主动
- `sessions/37515420-e068-4ad8-8606-00e507936964.jsonl.reset.2026-03-21T09-57-24.184Z` · score=`0.4972275227308273` · 的个性化信息，例如饮食偏好（爱吃面
- `sessions/5ffcb01c-881e-4834-a268-49f5ba6d2319.jsonl.reset.2026-03-21T05-45-47.109Z` · score=`0.4972275227308273` · 的个性化信息，例如饮食偏好（爱吃面

### text-heavy

```json
{
  "query": {
    "maxResults": 20,
    "minScore": 0.2,
    "hybrid": {
      "enabled": true,
      "vectorWeight": 0.35,
      "textWeight": 0.65,
      "candidateMultiplier": 8,
      "temporalDecay": {
        "enabled": true,
        "halfLifeDays": 7
      }
    }
  }
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{"sessions":10}`

Top 5:
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.252979838848114` · 确性 | ✅ | 爱吃面食的信息正确 | | 整体 | **✅ 正确** | 回答是对的，因为有记忆支撑"刘超=超哥" | --- 所以刚才的回答是**靠谱的*
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.2501167580485344` · Assistant: 嘿，超哥！三德子刚睡醒，这会儿精神着呢～这么晚了还没睡呀？有啥事儿需要我帮忙的？
User: Sender (untrusted meta
- `sessions/07bf7a32-4c9b-43b2-b214-f0bafb08919a.jsonl.reset.2026-03-21T03-47-23.984Z` · score=`0.24900118261575696` ·  - [] 刘超在饮食上偏好面食，具体包括面条和馒头。然而，出于重要的健康考量，特别是为了严格控制体重和有效管理血压，用户目前正处于严格的饮食控制阶段，因此主动
- `sessions/37515420-e068-4ad8-8606-00e507936964.jsonl.reset.2026-03-21T09-57-24.184Z` · score=`0.24861376136541366` · 的个性化信息，例如饮食偏好（爱吃面
- `sessions/5ffcb01c-881e-4834-a268-49f5ba6d2319.jsonl.reset.2026-03-21T05-45-47.109Z` · score=`0.24861376136541366` · 的个性化信息，例如饮食偏好（爱吃面

### text-dominant

```json
{
  "query": {
    "maxResults": 30,
    "minScore": 0.15,
    "hybrid": {
      "enabled": true,
      "vectorWeight": 0.2,
      "textWeight": 0.8,
      "candidateMultiplier": 12,
      "temporalDecay": {
        "enabled": true,
        "halfLifeDays": 7
      }
    }
  }
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{}`

Top 5:

### wide-candidate-pool

```json
{
  "query": {
    "maxResults": 30,
    "minScore": 0.1,
    "hybrid": {
      "enabled": true,
      "vectorWeight": 0.55,
      "textWeight": 0.45,
      "candidateMultiplier": 12,
      "temporalDecay": {
        "enabled": true,
        "halfLifeDays": 3
      }
    }
  }
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{"sessions":10}`

Top 5:
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.39753974676132203` · 确性 | ✅ | 爱吃面食的信息正确 | | 整体 | **✅ 正确** | 回答是对的，因为有记忆支撑"刘超=超哥" | --- 所以刚才的回答是**靠谱的*
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.3930406197905541` · Assistant: 嘿，超哥！三德子刚睡醒，这会儿精神着呢～这么晚了还没睡呀？有啥事儿需要我帮忙的？
User: Sender (untrusted meta
- `sessions/07bf7a32-4c9b-43b2-b214-f0bafb08919a.jsonl.reset.2026-03-21T03-47-23.984Z` · score=`0.3912875726819039` ·  - [] 刘超在饮食上偏好面食，具体包括面条和馒头。然而，出于重要的健康考量，特别是为了严格控制体重和有效管理血压，用户目前正处于严格的饮食控制阶段，因此主动
- `sessions/37515420-e068-4ad8-8606-00e507936964.jsonl.reset.2026-03-21T09-57-24.184Z` · score=`0.39067876785993577` · 的个性化信息，例如饮食偏好（爱吃面
- `sessions/5ffcb01c-881e-4834-a268-49f5ba6d2319.jsonl.reset.2026-03-21T05-45-47.109Z` · score=`0.39067876785993577` · 的个性化信息，例如饮食偏好（爱吃面

### mmr-diversity

```json
{
  "query": {
    "maxResults": 30,
    "minScore": 0.15,
    "hybrid": {
      "enabled": true,
      "vectorWeight": 0.55,
      "textWeight": 0.45,
      "candidateMultiplier": 12,
      "mmr": {
        "enabled": true,
        "lambda": 0.45
      },
      "temporalDecay": {
        "enabled": true,
        "halfLifeDays": 7
      }
    }
  }
}
```

- steakRank: `not-found`
- firstMemoryRank: `not-found`
- memoryHits: `0`
- topSources: `{"sessions":10}`

Top 5:
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.39753974676132203` · 确性 | ✅ | 爱吃面食的信息正确 | | 整体 | **✅ 正确** | 回答是对的，因为有记忆支撑"刘超=超哥" | --- 所以刚才的回答是**靠谱的*
- `sessions/057887b4-38eb-42ca-9a5e-873d06b8bf4d.jsonl.reset.2026-03-20T16-30-35.305Z` · score=`0.3930406197905541` · Assistant: 嘿，超哥！三德子刚睡醒，这会儿精神着呢～这么晚了还没睡呀？有啥事儿需要我帮忙的？
User: Sender (untrusted meta
- `sessions/37515420-e068-4ad8-8606-00e507936964.jsonl.reset.2026-03-21T09-57-24.184Z` · score=`0.39067876785993577` · 的个性化信息，例如饮食偏好（爱吃面
- `sessions/9dce3e35-90b3-4e5d-bff9-ae81ea9f1489.jsonl.reset.2026-03-21T12-37-10.721Z` · score=`0.3896302178502083` · Assistant: 超哥爱吃什么 - 这我还真不知道呢，USER.md 里还是空的。你是想让我记住你的口味偏好，还是单纯想聊聊？
User: Sender (
- `sessions/07bf7a32-4c9b-43b2-b214-f0bafb08919a.jsonl.reset.2026-03-21T03-47-23.984Z` · score=`0.38844155520200735` · Assistant: 超哥爱吃面食 — 面条、馒头、饺子这些。不过他现在正在严格控制体重（从93kg减到87kg了），所以暂时不吃面食。 等他体重目标达成了，可

