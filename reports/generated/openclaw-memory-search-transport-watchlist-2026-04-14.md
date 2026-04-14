# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-14T06:26:00.011Z`
- totalProbes: `8`
- rawOk: `0`
- emptyResults: `0`
- timeout: `0`
- invalidJson: `8`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `9863`
- maxDurationMs: `15140`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`12153` maxMs=`12153`
- preference: ok=`0` failures=`1` total=`1` avgMs=`8636` maxMs=`8636`
- rule: ok=`0` failures=`1` total=`1` avgMs=`9004` maxMs=`9004`
- project: ok=`0` failures=`1` total=`1` avgMs=`9288` maxMs=`9288`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`8406` maxMs=`8406`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`8191` maxMs=`8191`
- temporal-current: ok=`0` failures=`1` total=`1` avgMs=`8082` maxMs=`8082`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`15140` maxMs=`15140`

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

