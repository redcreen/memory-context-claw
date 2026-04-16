# Dialogue Working-Set Pruning Eval

- model: `gpt-5.4`
- reasoning effort: `low`
- passed: `1/1`
- total baseline tokens: `42`
- total kept tokens: `13`
- aggregate reduction ratio: `0.6905`
- switch-case average reduction ratio: `0.6905`

## switch-prune-status-noise-keep-style-pin
- description: A status snapshot and a temporary meta exchange should be dropped once the user switches to retrieval policy, while the durable reply-style rule stays pinned.
- passed: `true`
- relation: `switch`
- confidence: `0.97`
- baseline tokens: `42`
- kept tokens: `13`
- reduction ratio: `0.6905`
- evict_turn_ids: `["t1","t2","t3"]`
- pin_turn_ids: `["t2"]`
- pinned_only_turn_ids: `["t2"]`
- archive_summary: Drop the earlier status snapshot and the temporary acknowledgement. Preserve the durable user preference as a semantic pin: default to giving the conclusion first, then details. Active topic has switched to retrieval policy, specifically which path an uncategorized query should take by default.
- reasoning_summary: The status report is transient noise, and the meta exchange about remembering a style preference is resolved. The user has switched to a new task about retrieval policy, so the old raw block can leave the next-turn prompt while the reply-style rule survives as a compact pin.

### Checks
- relation: `pass` expected=`"switch"` actual=`"switch"`
- must_evict_turn_ids: `pass` expected=`["t1","t3"]` actual=`["t1","t2","t3"]`
- must_keep_turn_ids: `pass` expected=`[]` actual=`["t4"]`
- must_pin_turn_ids: `pass` expected=`["t2"]` actual=`["t2"]`
- latest_user_turn_guarded: `pass` expected=`"t4"` actual=`["t1","t2","t3"]`
- min_reduction_ratio: `pass` expected=`0.25` actual=`0.6905`

### Payload
```json
{
  "relation": "switch",
  "confidence": 0.97,
  "evict_turn_ids": [
    "t1",
    "t2",
    "t3"
  ],
  "pin_turn_ids": [
    "t2"
  ],
  "archive_summary": "Drop the earlier status snapshot and the temporary acknowledgement. Preserve the durable user preference as a semantic pin: default to giving the conclusion first, then details. Active topic has switched to retrieval policy, specifically which path an uncategorized query should take by default.",
  "reasoning_summary": "The status report is transient noise, and the meta exchange about remembering a style preference is resolved. The user has switched to a new task about retrieval policy, so the old raw block can leave the next-turn prompt while the reply-style rule survives as a compact pin."
}
```

