# Dialogue Working-Set Pruning Eval

- model: `gpt-5.4`
- reasoning effort: `low`
- passed: `1/1`
- total baseline tokens: `29`
- total kept tokens: `15`
- aggregate reduction ratio: `0.4828`
- switch-case average reduction ratio: `0.4828`

## switch-family-to-code-with-durable-pins
- description: Family facts are captured, then the user explicitly switches to code architecture; old family turns should leave the raw working set but stay pinned semantically.
- passed: `true`
- relation: `switch`
- confidence: `0.98`
- baseline tokens: `29`
- kept tokens: `15`
- reduction ratio: `0.4828`
- evict_turn_ids: `["t1","t2","t3","t4"]`
- pin_turn_ids: `["t1","t3"]`
- pinned_only_turn_ids: `["t1","t3"]`
- archive_summary: User shared durable family facts: they like steak, and their daughter is currently in fifth grade. That family-memory block is complete. The active topic then explicitly switched to a code architecture question about the OpenClaw adapter's read order for governed exports.
- reasoning_summary: The user explicitly closed the family-memory topic and switched to a new code topic. The earlier family turns are no longer needed in the next-turn raw working set, but the factual user memories should be preserved as semantic pins. Assistant acknowledgment turns do not need pinning.

### Checks
- relation: `pass` expected=`"switch"` actual=`"switch"`
- must_evict_turn_ids: `pass` expected=`["t1","t2","t3","t4"]` actual=`["t1","t2","t3","t4"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t5"]`
- must_pin_turn_ids: `pass` expected=`["t1","t3"]` actual=`["t1","t3"]`
- latest_user_turn_guarded: `pass` expected=`"t5"` actual=`["t1","t2","t3","t4"]`
- min_reduction_ratio: `pass` expected=`0.45` actual=`0.4828`

### Payload
```json
{
  "relation": "switch",
  "confidence": 0.98,
  "evict_turn_ids": [
    "t1",
    "t2",
    "t3",
    "t4"
  ],
  "pin_turn_ids": [
    "t1",
    "t3"
  ],
  "archive_summary": "User shared durable family facts: they like steak, and their daughter is currently in fifth grade. That family-memory block is complete. The active topic then explicitly switched to a code architecture question about the OpenClaw adapter's read order for governed exports.",
  "reasoning_summary": "The user explicitly closed the family-memory topic and switched to a new code topic. The earlier family turns are no longer needed in the next-turn raw working set, but the factual user memories should be preserved as semantic pins. Assistant acknowledgment turns do not need pinning."
}
```

