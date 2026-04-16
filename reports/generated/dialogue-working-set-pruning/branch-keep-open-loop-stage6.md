# Dialogue Working-Set Pruning Eval

- model: `gpt-5.4`
- reasoning effort: `low`
- passed: `1/1`
- total baseline tokens: `24`
- total kept tokens: `24`
- aggregate reduction ratio: `0`
- switch-case average reduction ratio: `0`

## branch-keep-open-loop-stage6
- description: A side question interrupts an unfinished planning task; the original task turns must remain available.
- passed: `true`
- relation: `branch`
- confidence: `0.98`
- baseline tokens: `24`
- kept tokens: `24`
- reduction ratio: `0.0000`
- evict_turn_ids: `[]`
- pin_turn_ids: `["t1","t2"]`
- pinned_only_turn_ids: `[]`
- archive_summary: Open planning task: Stage 6 acceptance should be split into three parts. Current proposed buckets are functional correctness, rollback safety, and host integration verification. Latest user turn asks a side question about what `umc registry migrate` does.
- reasoning_summary: The active topic is a side question while the original Stage 6 planning task remains unfinished, so this is a branch. Do not evict the earlier planning turns because that loop is still open. Pin the Stage 6 split so it survives compactly if needed later.

### Checks
- relation: `pass` expected=`"branch"` actual=`"branch"`
- must_evict_turn_ids: `pass` expected=`[]` actual=`[]`
- must_keep_turn_ids: `pass` expected=`["t1","t2"]` actual=`["t1","t2","t3"]`
- must_pin_turn_ids: `pass` expected=`[]` actual=`["t1","t2"]`
- latest_user_turn_guarded: `pass` expected=`"t3"` actual=`[]`
- min_reduction_ratio: `pass` expected=`0` actual=`0`

### Payload
```json
{
  "relation": "branch",
  "confidence": 0.98,
  "evict_turn_ids": [],
  "pin_turn_ids": [
    "t1",
    "t2"
  ],
  "archive_summary": "Open planning task: Stage 6 acceptance should be split into three parts. Current proposed buckets are functional correctness, rollback safety, and host integration verification. Latest user turn asks a side question about what `umc registry migrate` does.",
  "reasoning_summary": "The active topic is a side question while the original Stage 6 planning task remains unfinished, so this is a branch. Do not evict the earlier planning turns because that loop is still open. Pin the Stage 6 split so it survives compactly if needed later."
}
```

