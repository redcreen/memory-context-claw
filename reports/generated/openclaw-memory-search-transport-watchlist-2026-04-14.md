# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-14T16:00:49.581Z`
- totalProbes: `8`
- rawOk: `0`
- emptyResults: `0`
- timeout: `0`
- invalidJson: `8`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `15127`
- maxDurationMs: `22497`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`22497` maxMs=`22497`
- preference: ok=`0` failures=`1` total=`1` avgMs=`15214` maxMs=`15214`
- rule: ok=`0` failures=`1` total=`1` avgMs=`11101` maxMs=`11101`
- project: ok=`0` failures=`1` total=`1` avgMs=`11198` maxMs=`11198`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`10489` maxMs=`10489`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`16397` maxMs=`16397`
- temporal-current: ok=`0` failures=`1` total=`1` avgMs=`17464` maxMs=`17464`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`16656` maxMs=`16656`

## Watchlist
- profile-name-1 [profile] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- pref-reply-style-1 [preference] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- rule-debug-1 [rule] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- project-desc-1 [project] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- cross-source-travel-search-1 [cross-source] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- supersede-editor-search-1 [supersede] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- current-editor-search-1 [temporal-current] `invalid_json`: raw openclaw memory search returned a non-JSON payload
- history-editor-search-1 [temporal-history] `invalid_json`: raw openclaw memory search returned a non-JSON payload

## Notes
- This watchlist tracks raw `openclaw memory search` transport health only.
- Failures here should not be counted as Unified Memory Core retrieval algorithm regressions when sqlite fallback or agent-path evidence remains green.
- Use this report to separate host transport instability from plugin-side retrieval and assembly work.

