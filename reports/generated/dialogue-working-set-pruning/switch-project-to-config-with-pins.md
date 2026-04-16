# Dialogue Working-Set Pruning Eval

- model: `gpt-5.4`
- reasoning effort: `low`
- passed: `1/1`
- total baseline tokens: `48`
- total kept tokens: `13`
- aggregate reduction ratio: `0.7292`
- switch-case average reduction ratio: `0.7292`

## switch-project-to-config-with-pins
- description: The project-summary topic is closed, a durable travel preference is added, and the conversation then switches to plugin config.
- passed: `true`
- relation: `switch`
- confidence: `0.97`
- baseline tokens: `48`
- kept tokens: `13`
- reduction ratio: `0.7292`
- evict_turn_ids: `["t1","t2","t3","t4","t5","t6"]`
- pin_turn_ids: `["t1","t5"]`
- pinned_only_turn_ids: `["t1","t5"]`
- archive_summary: Earlier project-summary exchange is closed. Keep durable user preferences as semantic pins: default replies in Chinese and be direct; air travel seat preference is aisle. Active topic has switched to asking for the minimal contextEngine configuration for unified-memory-core.
- reasoning_summary: The prior Project Lantern summary task was explicitly closed at t5, so that solved block is a strong eviction candidate. The conversation then moved to a new technical topic at t7, making this a topic switch rather than continuation. t1 contains a durable response-language/style preference and t5 contains a durable travel preference, so both should be preserved as pins even if their raw turns leave the next-turn prompt. Assistant acknowledgements are not needed in the working set.

### Checks
- relation: `pass` expected=`"switch"` actual=`"switch"`
- must_evict_turn_ids: `pass` expected=`["t3","t4","t5","t6"]` actual=`["t1","t2","t3","t4","t5","t6"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t7"]`
- must_pin_turn_ids: `pass` expected=`["t1","t5"]` actual=`["t1","t5"]`
- latest_user_turn_guarded: `pass` expected=`"t7"` actual=`["t1","t2","t3","t4","t5","t6"]`
- min_reduction_ratio: `pass` expected=`0.3` actual=`0.7292`

### Payload
```json
{
  "relation": "switch",
  "confidence": 0.97,
  "evict_turn_ids": [
    "t1",
    "t2",
    "t3",
    "t4",
    "t5",
    "t6"
  ],
  "pin_turn_ids": [
    "t1",
    "t5"
  ],
  "archive_summary": "Earlier project-summary exchange is closed. Keep durable user preferences as semantic pins: default replies in Chinese and be direct; air travel seat preference is aisle. Active topic has switched to asking for the minimal contextEngine configuration for unified-memory-core.",
  "reasoning_summary": "The prior Project Lantern summary task was explicitly closed at t5, so that solved block is a strong eviction candidate. The conversation then moved to a new technical topic at t7, making this a topic switch rather than continuation. t1 contains a durable response-language/style preference and t5 contains a durable travel preference, so both should be preserved as pins even if their raw turns leave the next-turn prompt. Assistant acknowledgements are not needed in the working set."
}
```

