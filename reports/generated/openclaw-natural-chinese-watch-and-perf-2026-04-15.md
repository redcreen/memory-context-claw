# OpenClaw Natural Chinese, Watchlist, and Perf Follow-up

- generatedAt: `2026-04-15`
- program: `execute-200-case-benchmark-and-answer-path-triage`
- followupSteps: `78-80`

## Summary

- Runnable matrix expanded from `368` to `392` cases.
- zh-bearing coverage is now `211 / 392 = 53.83%`.
- Natural Chinese cases are now explicit, not just translated mirrors: `24` total (`12` retrieval + `12` answer-level).
- The representative natural-Chinese retrieval slice passed `5 / 5`.
- The representative natural-Chinese answer-level slice passed `6 / 6`.
- The raw `openclaw memory search` watchlist remains red by design, but is now failure-classed as host `missing_json_payload` instead of being treated as an algorithm regression signal.
- The refreshed main-path performance baseline is now:
  - retrieval / assembly avg `43ms`
  - raw transport avg `15570ms`
  - isolated local answer-level avg `36155ms`

## What Changed

1. Natural Chinese prompts were added as first-class benchmark cases.
   - The new cases cover profile, project, current-state, rule, and abstention surfaces.
   - They include more elliptical Chinese wording and mixed Chinese-English prompts instead of only zh-bearing mirrors.

2. The answer-level benchmark prompt builder now avoids duplicating the memory-search wrapper when the prompt is already memory-scoped.
   - This keeps answer-level prompts shorter and reduces prompt-noise effects in performance runs.

3. The raw transport watchlist now classifies failures explicitly.
   - Current host behavior is consistently `missing_json_payload`.
   - This makes the watchlist usable as host-noise evidence instead of a vague failure bucket.

4. Query rewrite was expanded for natural Chinese retrieval phrasing.
   - The new rewrite paths cover colloquial Chinese wording for preferred name, deploy region, no-guess rules, and current notebook questions.

## Evidence

### Natural Chinese Retrieval Slice

- command family: `node scripts/eval-openclaw-cli-memory-benchmark.js --entrypoints memory_search --skip-legacy --only ...`
- representative pass result: `5 / 5`
- cases:
  - `zh-natural-profile-search-1`
  - `zh-natural-project-search-1`
  - `zh-natural-temporal-search-1`
  - `zh-natural-rule-search-1`
  - `zh-natural-temporal-search-3`

### Natural Chinese Answer-Level Slice

- command family: `node scripts/eval-openclaw-cli-memory-benchmark.js --entrypoints agent --skip-legacy --agent-local --only ...`
- representative pass result: `6 / 6`
- cases:
  - `agent-zh-natural-name-1`
  - `agent-zh-natural-project-1`
  - `agent-zh-natural-editor-1`
  - `agent-zh-natural-region-1`
  - `agent-zh-natural-rule-1`
  - `agent-zh-natural-negative-1`

### Transport Watchlist

- report: [openclaw-memory-search-transport-watchlist-2026-04-15.md](openclaw-memory-search-transport-watchlist-2026-04-15.md)
- current result: `0 / 8 raw ok`
- failure class: `missing_json_payload`

### Main-Path Performance

- report: [main-path-performance-baseline-2026-04-15.md](main-path-performance-baseline-2026-04-15.md)
- retrieval / assembly avg: `43ms`
- raw transport avg: `15570ms`
- isolated local answer-level avg: `36155ms`

## Interpretation

- Step `78` is complete because Chinese coverage is no longer just "more than half"; it now includes explicit natural-Chinese cases with green representative slices in both retrieval and answer-level paths.
- Step `79` is complete because raw transport instability is now separated into an explicit host watchlist with a stable failure class (`missing_json_payload`) instead of bleeding back into algorithm judgment.
- Step `80` is complete because the prompt path and performance baseline were refreshed, the slowest visible layer remains isolated local answer-level, and the new baseline is documented for future optimization rounds.

## Next Pointer

The current next execution step is still `77`: expand the isolated local answer-level formal gate beyond the `6` representative samples while keeping the natural-Chinese, watchlist, and perf evidence green.
