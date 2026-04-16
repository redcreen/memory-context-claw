# Dialogue Working-Set Pruning Eval

- model: `gpt-5.4`
- reasoning effort: `low`
- passed: `7/7`
- total baseline tokens: `136`
- total kept tokens: `94`
- aggregate reduction ratio: `0.3088`
- switch-case average reduction ratio: `0.5982`

## adversarial-false-switch-same-topic
- description: The user rephrases the same topic; this should stay continue, not switch.
- passed: `true`
- relation: `continue`
- confidence: `0.99`
- elapsed ms: `17458`
- baseline tokens: `28`
- kept tokens: `28`
- reduction ratio: `0.0000`
- evict_turn_ids: `[]`
- pin_turn_ids: `[]`
- pinned_only_turn_ids: `[]`
- archive_summary: Same topic continues: context slimming rationale. Prior turns explain the core goal: keep stored memory rich while keeping the prompt sparse and only sending highly relevant current-turn context.
- reasoning_summary: The latest user turn is a rephrasing of the same active topic, not a topic change. No earlier turn is resolved-and-irrelevant enough to evict yet, and no separate durable fact/preference pin is needed.

### Checks
- relation: `pass` expected=`"continue"` actual=`"continue"`
- must_evict_turn_ids: `pass` expected=`[]` actual=`[]`
- must_not_evict_turn_ids: `pass` expected=`["t1","t2"]` actual=`[]`
- must_keep_turn_ids: `pass` expected=`["t1","t2"]` actual=`["t1","t2","t3"]`
- must_pin_turn_ids: `pass` expected=`[]` actual=`[]`
- must_not_pin_turn_ids: `pass` expected=`[]` actual=`[]`
- latest_user_turn_guarded: `pass` expected=`"t3"` actual=`[]`
- min_reduction_ratio: `pass` expected=`0` actual=`0`

### Payload
```json
{
  "relation": "continue",
  "confidence": 0.99,
  "evict_turn_ids": [],
  "pin_turn_ids": [],
  "archive_summary": "Same topic continues: context slimming rationale. Prior turns explain the core goal: keep stored memory rich while keeping the prompt sparse and only sending highly relevant current-turn context.",
  "reasoning_summary": "The latest user turn is a rephrasing of the same active topic, not a topic change. No earlier turn is resolved-and-irrelevant enough to evict yet, and no separate durable fact/preference pin is needed."
}
```

## adversarial-branch-unfinished-with-side-fact
- description: A durable side fact appears while the main task is still open; the main task must stay.
- passed: `true`
- relation: `branch`
- confidence: `0.96`
- elapsed ms: `16590`
- baseline tokens: `17`
- kept tokens: `17`
- reduction ratio: `0.0000`
- evict_turn_ids: `[]`
- pin_turn_ids: `["t3"]`
- pinned_only_turn_ids: `[]`
- archive_summary: Main thread is Stage 6 acceptance split into three parts: functionality correctness, rollback safety, and host integration validation. Side fact from the user: they are in the Shanghai timezone.
- reasoning_summary: The newest turn introduces a durable side fact while the earlier Stage 6 task remains the active thread. Keep the main-task raw turns in the working set, and preserve the timezone as a semantic pin for future use.

### Checks
- relation: `pass` expected=`"branch"` actual=`"branch"`
- must_evict_turn_ids: `pass` expected=`[]` actual=`[]`
- must_not_evict_turn_ids: `pass` expected=`["t1","t2"]` actual=`[]`
- must_keep_turn_ids: `pass` expected=`["t1","t2"]` actual=`["t1","t2","t3"]`
- must_pin_turn_ids: `pass` expected=`[]` actual=`["t3"]`
- must_not_pin_turn_ids: `pass` expected=`[]` actual=`["t3"]`
- latest_user_turn_guarded: `pass` expected=`"t3"` actual=`[]`
- min_reduction_ratio: `pass` expected=`0` actual=`0`

### Payload
```json
{
  "relation": "branch",
  "confidence": 0.96,
  "evict_turn_ids": [],
  "pin_turn_ids": [
    "t3"
  ],
  "archive_summary": "Main thread is Stage 6 acceptance split into three parts: functionality correctness, rollback safety, and host integration validation. Side fact from the user: they are in the Shanghai timezone.",
  "reasoning_summary": "The newest turn introduces a durable side fact while the earlier Stage 6 task remains the active thread. Keep the main-task raw turns in the working set, and preserve the timezone as a semantic pin for future use."
}
```

## adversarial-return-old-topic-after-code-switch
- description: The chat switched to code, then explicitly jumps back to an old durable preference.
- passed: `true`
- relation: `switch`
- confidence: `0.97`
- elapsed ms: `14478`
- baseline tokens: `27`
- kept tokens: `10`
- reduction ratio: `0.6296`
- evict_turn_ids: `["t2","t3","t4"]`
- pin_turn_ids: `["t1"]`
- pinned_only_turn_ids: `[]`
- archive_summary: User has a durable preference: when flying, they prefer an aisle seat. A later temporary coding instruction said not to modify builtin memory in that code-focused turn, but the active topic then switched back to recalling the flight-seat preference.
- reasoning_summary: The latest user turn returns to an older durable preference after a code-topic detour. Keep the durable preference as a semantic pin from t1. Evict the assistant acknowledgments and the temporary code-side instruction block from the next-turn raw prompt, since that coding context is not relevant to answering the current question.

### Checks
- relation: `pass` expected=`"switch"` actual=`"switch"`
- must_evict_turn_ids: `pass` expected=`["t3","t4"]` actual=`["t2","t3","t4"]`
- must_not_evict_turn_ids: `pass` expected=`[]` actual=`["t2","t3","t4"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t1","t5"]`
- must_pin_turn_ids: `pass` expected=`["t1"]` actual=`["t1"]`
- must_not_pin_turn_ids: `pass` expected=`[]` actual=`["t1"]`
- latest_user_turn_guarded: `pass` expected=`"t5"` actual=`["t2","t3","t4"]`
- min_reduction_ratio: `pass` expected=`0.15` actual=`0.6296`

### Payload
```json
{
  "relation": "switch",
  "confidence": 0.97,
  "evict_turn_ids": [
    "t2",
    "t3",
    "t4"
  ],
  "pin_turn_ids": [
    "t1"
  ],
  "archive_summary": "User has a durable preference: when flying, they prefer an aisle seat. A later temporary coding instruction said not to modify builtin memory in that code-focused turn, but the active topic then switched back to recalling the flight-seat preference.",
  "reasoning_summary": "The latest user turn returns to an older durable preference after a code-topic detour. Keep the durable preference as a semantic pin from t1. Evict the assistant acknowledgments and the temporary code-side instruction block from the next-turn raw prompt, since that coding context is not relevant to answering the current question."
}
```

## adversarial-assistant-claim-not-durable
- description: The assistant guessed wrong first; only the user's correction may survive as a durable pin.
- passed: `true`
- relation: `switch`
- confidence: `0.98`
- elapsed ms: `15199`
- baseline tokens: `19`
- kept tokens: `7`
- reduction ratio: `0.6316`
- evict_turn_ids: `["t1","t2","t3"]`
- pin_turn_ids: `["t2"]`
- pinned_only_turn_ids: `["t2"]`
- archive_summary: User corrected an incorrect assistant guess: they prefer asynchronous text updates, not voice calls. That preference should be preserved as a durable semantic pin. The conversation then switched to a new topic: rollout order.
- reasoning_summary: The active topic changed at t4, so this is a switch. The earlier block is resolved and can leave the next-turn raw prompt. Only the user's correction is durable; the assistant's mistaken claim and acknowledgment are not worth keeping as raw context.

### Checks
- relation: `pass` expected=`"switch"` actual=`"switch"`
- must_evict_turn_ids: `pass` expected=`["t1","t3"]` actual=`["t1","t2","t3"]`
- must_not_evict_turn_ids: `pass` expected=`[]` actual=`["t1","t2","t3"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t4"]`
- must_pin_turn_ids: `pass` expected=`["t2"]` actual=`["t2"]`
- must_not_pin_turn_ids: `pass` expected=`["t1"]` actual=`["t2"]`
- latest_user_turn_guarded: `pass` expected=`"t4"` actual=`["t1","t2","t3"]`
- min_reduction_ratio: `pass` expected=`0.2` actual=`0.6316`

### Payload
```json
{
  "relation": "switch",
  "confidence": 0.98,
  "evict_turn_ids": [
    "t1",
    "t2",
    "t3"
  ],
  "pin_turn_ids": [
    "t2"
  ],
  "archive_summary": "User corrected an incorrect assistant guess: they prefer asynchronous text updates, not voice calls. That preference should be preserved as a durable semantic pin. The conversation then switched to a new topic: rollout order.",
  "reasoning_summary": "The active topic changed at t4, so this is a switch. The earlier block is resolved and can leave the next-turn raw prompt. Only the user's correction is durable; the assistant's mistaken claim and acknowledgment are not worth keeping as raw context."
}
```

## adversarial-session-negative-no-pin
- description: A one-off codename must not be promoted into a long-lived pin after the topic switches.
- passed: `true`
- relation: `switch`
- confidence: `0.98`
- elapsed ms: `15756`
- baseline tokens: `15`
- kept tokens: `7`
- reduction ratio: `0.5333`
- evict_turn_ids: `["t1","t2"]`
- pin_turn_ids: `[]`
- pinned_only_turn_ids: `[]`
- archive_summary: A temporary codename '琥珀梯' was agreed for one use only and explicitly should not be kept long-term. The active topic has switched to retrieval strategy, specifically the default path for uncategorized queries.
- reasoning_summary: The codename exchange is resolved, explicitly non-durable, and irrelevant to the new retrieval-strategy question. Evict the old raw turns and do not create a pin for the one-off codename.

### Checks
- relation: `pass` expected=`"switch"` actual=`"switch"`
- must_evict_turn_ids: `pass` expected=`["t1","t2"]` actual=`["t1","t2"]`
- must_not_evict_turn_ids: `pass` expected=`[]` actual=`["t1","t2"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t3"]`
- must_pin_turn_ids: `pass` expected=`[]` actual=`[]`
- must_not_pin_turn_ids: `pass` expected=`["t1"]` actual=`[]`
- latest_user_turn_guarded: `pass` expected=`"t3"` actual=`["t1","t2"]`
- min_reduction_ratio: `pass` expected=`0.2` actual=`0.5333`

### Payload
```json
{
  "relation": "switch",
  "confidence": 0.98,
  "evict_turn_ids": [
    "t1",
    "t2"
  ],
  "pin_turn_ids": [],
  "archive_summary": "A temporary codename '琥珀梯' was agreed for one use only and explicitly should not be kept long-term. The active topic has switched to retrieval strategy, specifically the default path for uncategorized queries.",
  "reasoning_summary": "The codename exchange is resolved, explicitly non-durable, and irrelevant to the new retrieval-strategy question. Evict the old raw turns and do not create a pin for the one-off codename."
}
```

## adversarial-implicit-continuation
- description: A follow-up that refers to a numbered phase implicitly should still count as continuing the same topic.
- passed: `true`
- relation: `continue`
- confidence: `0.99`
- elapsed ms: `19399`
- baseline tokens: `19`
- kept tokens: `19`
- reduction ratio: `0.0000`
- evict_turn_ids: `[]`
- pin_turn_ids: `[]`
- pinned_only_turn_ids: `[]`
- archive_summary: The user asked about a three-phase rollout. The assistant summarized it as: 1) shadow, 2) gated active, 3) default active. The latest user turn asks for clarification of phase two ('第二阶段具体是什么意思？'), which implicitly continues the same rollout topic.
- reasoning_summary: The follow-up explicitly references '第二阶段', which is an implicit continuation of the earlier numbered rollout explanation. The active topic has not changed, nothing is resolved, and no earlier turns should be evicted yet.

### Checks
- relation: `pass` expected=`"continue"` actual=`"continue"`
- must_evict_turn_ids: `pass` expected=`[]` actual=`[]`
- must_not_evict_turn_ids: `pass` expected=`["t1","t2"]` actual=`[]`
- must_keep_turn_ids: `pass` expected=`["t1","t2"]` actual=`["t1","t2","t3"]`
- must_pin_turn_ids: `pass` expected=`[]` actual=`[]`
- must_not_pin_turn_ids: `pass` expected=`[]` actual=`[]`
- latest_user_turn_guarded: `pass` expected=`"t3"` actual=`[]`
- min_reduction_ratio: `pass` expected=`0` actual=`0`

### Payload
```json
{
  "relation": "continue",
  "confidence": 0.99,
  "evict_turn_ids": [],
  "pin_turn_ids": [],
  "archive_summary": "The user asked about a three-phase rollout. The assistant summarized it as: 1) shadow, 2) gated active, 3) default active. The latest user turn asks for clarification of phase two ('第二阶段具体是什么意思？'), which implicitly continues the same rollout topic.",
  "reasoning_summary": "The follow-up explicitly references '第二阶段', which is an implicit continuation of the earlier numbered rollout explanation. The active topic has not changed, nothing is resolved, and no earlier turns should be evicted yet."
}
```

## adversarial-resolve-close-conversation
- description: The conversation closes and only the durable preference plus latest user turn should remain.
- passed: `true`
- relation: `resolve`
- confidence: `0.99`
- elapsed ms: `15607`
- baseline tokens: `11`
- kept tokens: `6`
- reduction ratio: `0.4545`
- evict_turn_ids: `["t1","t2"]`
- pin_turn_ids: `["t1"]`
- pinned_only_turn_ids: `["t1"]`
- archive_summary: Conversation is closed for now. Preserve the durable user preference that replies should default to Chinese in future turns; the assistant acknowledgment can be dropped.
- reasoning_summary: The user explicitly ends the conversation and asks only that the earlier preference be remembered. The only durable context worth carrying forward is the preference from t1. The raw earlier turns are no longer needed in the next-turn working set, while the latest user turn remains automatically.

### Checks
- relation: `pass` expected=`"resolve"` actual=`"resolve"`
- must_evict_turn_ids: `pass` expected=`["t2"]` actual=`["t1","t2"]`
- must_not_evict_turn_ids: `pass` expected=`[]` actual=`["t1","t2"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t3"]`
- must_pin_turn_ids: `pass` expected=`["t1"]` actual=`["t1"]`
- must_not_pin_turn_ids: `pass` expected=`[]` actual=`["t1"]`
- latest_user_turn_guarded: `pass` expected=`"t3"` actual=`["t1","t2"]`
- min_reduction_ratio: `pass` expected=`0.1` actual=`0.4545`

### Payload
```json
{
  "relation": "resolve",
  "confidence": 0.99,
  "evict_turn_ids": [
    "t1",
    "t2"
  ],
  "pin_turn_ids": [
    "t1"
  ],
  "archive_summary": "Conversation is closed for now. Preserve the durable user preference that replies should default to Chinese in future turns; the assistant acknowledgment can be dropped.",
  "reasoning_summary": "The user explicitly ends the conversation and asks only that the earlier preference be remembered. The only durable context worth carrying forward is the preference from t1. The raw earlier turns are no longer needed in the next-turn working set, while the latest user turn remains automatically."
}
```

