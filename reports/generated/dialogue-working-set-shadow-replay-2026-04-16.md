# Dialogue Working-Set Shadow Replay

- model: `gpt-5.4`
- reasoning effort: `low`
- checkpoints: `9`
- passed: `9/9`
- average raw reduction ratio: `0.5722`
- average shadow-package reduction ratio: `0.2275`
- relation counts: `{"continue":1,"switch":6,"branch":2}`

## shadow-replay-project-switches
- description: One architecture topic continues, then switches to config, then switches again to testing.
- checkpoints: `3`

### t6
- passed: `true`
- relation: `continue`
- elapsed ms: `22813`
- baseline raw estimate: `56`
- shadow raw estimate: `43`
- shadow package estimate: `57`
- raw reduction ratio: `0.1538`
- shadow package reduction ratio: `-0.0179`
- evict_turn_ids: `["t1","t3"]`
- pin_turn_ids: `["t2"]`
- archive_summary: 用户已设定长期偏好：默认中文、回复直接、结论优先。当前仍在同一架构话题下，已讨论 context slimming 的核心目标是“存储 rich、prompt sparse，只把当轮高相关信息送入模型”；最新问题继续追问 raw doc default-off 应优先落地的类别。
- reasoning_summary: 当前话题从 t4 到 t6 连续推进，没有切换主题，应判定为 continue。t1 只是开场状态句，t3 只是对 t2 的确认，均可从下一轮原始工作集移出。t2 属于稳定用户偏好，需语义保留为 pin。

### t7
- passed: `true`
- relation: `switch`
- elapsed ms: `22031`
- baseline raw estimate: `72`
- shadow raw estimate: `22`
- shadow package estimate: `36`
- raw reduction ratio: `0.6731`
- shadow package reduction ratio: `0.5000`
- evict_turn_ids: `["t1","t3","t4","t5","t6"]`
- pin_turn_ids: `["t2"]`
- archive_summary: 用户已明确长期偏好：默认中文、回复直接、结论优先。先前话题讨论了 context slimming 的核心目标：追求“存储 rich、prompt sparse”，只让当轮高相关信息进入模型；随后追问 raw doc default-off 适合优先落地的题型，但该架构话题被中断，未继续展开。当前已切换到新主题：询问 unified-memory-core 的最小 contextEngine 配置写法。
- reasoning_summary: 当前活跃主题已从架构原则切换到具体配置问题，属于明显 topic switch。旧的架构说明块对下一轮回答最小配置帮助不大，适合移出 raw prompt。用户语言与风格偏好是 durable 信息，应保留为语义 pin。最新用户 turn 由运行时保留，因此不列入 evict_turn_ids。

### t9
- passed: `true`
- relation: `switch`
- elapsed ms: `17411`
- baseline raw estimate: `94`
- shadow raw estimate: `18`
- shadow package estimate: `32`
- raw reduction ratio: `0.8116`
- shadow package reduction ratio: `0.6596`
- evict_turn_ids: `["t1","t3","t4","t5","t6","t7","t8"]`
- pin_turn_ids: `["t2"]`
- archive_summary: 用户偏好：默认用中文，回答直接、结论优先。已讨论过两段已切换主题：1) context slimming 的核心目标是 rich storage、sparse prompt，只让当轮高相关信息进入模型；并提到 raw doc default-off 应优先落在若干问题类别上，但未展开答案。2) 之后切到配置，讨论 unified-memory-core 的最小 contextEngine 配置，结论是先只挂 contextEngine，不动写侧。当前最新主题已再次切换为 shadow mode 报告指标。
- reasoning_summary: 当前话题从架构解释切到配置，又从配置切到 shadow mode 指标，属于明显项目内主题切换，适合用 switch。旧的架构与配置原始回合对回答当前指标问题不是必需，可从 next-turn 原始工作集中移出。用户的语言与风格偏好是 durable fact，应保留为语义 pin。

## shadow-replay-open-loop-branch-return
- description: An unfinished planning task is interrupted by a side question and then resumed.
- checkpoints: `2`

### t3
- passed: `true`
- relation: `branch`
- elapsed ms: `17099`
- baseline raw estimate: `31`
- shadow raw estimate: `31`
- shadow package estimate: `56`
- raw reduction ratio: `0.0000`
- shadow package reduction ratio: `-0.8065`
- evict_turn_ids: `[]`
- pin_turn_ids: `["t1","t2"]`
- archive_summary: The user had an unfinished planning task about splitting Stage 6 acceptance into three parts: functional correctness, rollback safety, and host integration validation. That planning context remains open while the user asks a side question about `umc registry migrate`.
- reasoning_summary: The latest user turn is a side question that interrupts an still-open planning task from t1-t2. This is a branch, not a switch or resolve. Keep the earlier planning context semantically pinned so it can be resumed after answering the side question; do not evict anything yet.

### t5
- passed: `true`
- relation: `branch`
- elapsed ms: `13718`
- baseline raw estimate: `56`
- shadow raw estimate: `27`
- shadow package estimate: `31`
- raw reduction ratio: `0.5581`
- shadow package reduction ratio: `0.4464`
- evict_turn_ids: `["t3","t4"]`
- pin_turn_ids: `[]`
- archive_summary: The conversation briefly detoured into a side question about `umc registry migrate`, answered as a migration for UMC's own registry root rather than a builtin memory switcher, then returned to the unfinished Stage 6 acceptance planning task.
- reasoning_summary: The active topic at t5 returns to the earlier unfinished Stage 6 planning thread, so this is a branch-return rather than a topic switch. The side Q&A in t3-t4 is resolved and not needed for the next turn, making it a good raw-prompt eviction candidate. The Stage 6 decomposition context in t1-t2 remains relevant and should stay in the working set; no semantic pin is needed for the side detour.

## shadow-replay-family-code-family
- description: Durable family facts are captured, the chat switches to code, then the user returns to the old family fact.
- checkpoints: `2`

### t5
- passed: `true`
- relation: `switch`
- elapsed ms: `27521`
- baseline raw estimate: `36`
- shadow raw estimate: `11`
- shadow package estimate: `40`
- raw reduction ratio: `0.6087`
- shadow package reduction ratio: `-0.1111`
- evict_turn_ids: `["t1","t2","t3","t4"]`
- pin_turn_ids: `["t1","t3","t5"]`
- archive_summary: Durable user facts captured: user likes steak and prefers aisle seats when flying. Topic then switched from family/personal facts to code work.
- reasoning_summary: The active topic changed at t5 from family facts to code instructions, so this is a topic switch. The earlier family-fact exchange is resolved as raw dialogue and can leave the next-turn working set, but its durable semantic content should be preserved as pins. The current code instruction at t5 is still active and should also be pinned for future coding turns.

### t7
- passed: `true`
- relation: `switch`
- elapsed ms: `17528`
- baseline raw estimate: `55`
- shadow raw estimate: `8`
- shadow package estimate: `37`
- raw reduction ratio: `0.8333`
- shadow package reduction ratio: `0.3273`
- evict_turn_ids: `["t1","t2","t3","t4","t5","t6"]`
- pin_turn_ids: `["t1","t3","t5"]`
- archive_summary: Captured durable user facts: user likes steak; on flights, user prefers an aisle seat. Captured still-relevant session rule from the code segment: for this round, do not modify builtin memory. The code discussion was paused, and the active topic switched back to recalling the flight-seat preference.
- reasoning_summary: The active topic switched from a paused code discussion back to an earlier family/personal fact, so raw turns from the older blocks can leave the next-turn prompt. The durable personal preferences and the still-relevant session-scoped code constraint should survive as compact pins. Assistant acknowledgements are redundant and good eviction candidates.

## shadow-replay-status-style-release
- description: Status noise and a style preference should yield to two successive task switches.
- checkpoints: `2`

### t4
- passed: `true`
- relation: `switch`
- elapsed ms: `17181`
- baseline raw estimate: `50`
- shadow raw estimate: `12`
- shadow package estimate: `26`
- raw reduction ratio: `0.7436`
- shadow package reduction ratio: `0.4800`
- evict_turn_ids: `["t1","t2","t3"]`
- pin_turn_ids: `["t2"]`
- archive_summary: Evict the stale status snapshot and the resolved acknowledgement exchange. Preserve as a semantic pin that the user prefers answers to start with the conclusion first, then details. The active topic has switched to retrieval policy behavior for uncategorized queries.
- reasoning_summary: t1 is transient status noise and not relevant to the new task. t2 is a durable user preference, so its raw turn can leave the prompt if pinned. t3 is only an acknowledgement of that preference and is resolved. The current active topic begins at t4, so this is a task switch rather than a continuation.

### t6
- passed: `true`
- relation: `switch`
- elapsed ms: `18491`
- baseline raw estimate: `72`
- shadow raw estimate: `17`
- shadow package estimate: `31`
- raw reduction ratio: `0.7679`
- shadow package reduction ratio: `0.5694`
- evict_turn_ids: `["t1","t3","t4","t5"]`
- pin_turn_ids: `["t2"]`
- archive_summary: Resolved and now-irrelevant blocks: a transient status snapshot about model/context usage, then a solved retrieval-policy Q&A ('unclassified query defaults to fast path, then formal memory if needed'). Preserve the user's durable response-style preference as a semantic pin: default to giving the conclusion first, then details.
- reasoning_summary: The active topic has switched from status, to retrieval policy, to a new writing question about release notes. The status snapshot is pure noise, and the retrieval exchange appears answered and not needed for the next turn. The only durable instruction that should survive is the user's style preference, so keep it as a pin while allowing the older raw turns to leave the working set.

