# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-15T04:57:02.027Z`
- totalProbes: `8`
- rawOk: `0`
- emptyResults: `0`
- timeout: `0`
- invalidJson: `8`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `10765`
- maxDurationMs: `13305`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`13305` maxMs=`13305`
- preference: ok=`0` failures=`1` total=`1` avgMs=`11282` maxMs=`11282`
- rule: ok=`0` failures=`1` total=`1` avgMs=`10644` maxMs=`10644`
- project: ok=`0` failures=`1` total=`1` avgMs=`10069` maxMs=`10069`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`10265` maxMs=`10265`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`10322` maxMs=`10322`
- temporal-current: ok=`0` failures=`1` total=`1` avgMs=`10049` maxMs=`10049`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`10183` maxMs=`10183`

## Failure Classes
- missing_json_payload: `8`

## Watchlist
- profile-name-1 [profile] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- pref-reply-style-1 [preference] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- rule-debug-1 [rule] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- project-desc-1 [project] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- cross-source-travel-search-1 [cross-source] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- supersede-editor-search-1 [supersede] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- current-editor-search-1 [temporal-current] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- history-editor-search-1 [temporal-history] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload

## Notes
- This watchlist tracks raw `openclaw memory search` transport health only.
- Failures here should not be counted as Unified Memory Core retrieval algorithm regressions when sqlite fallback or agent-path evidence remains green.
- Use this report to separate host transport instability from plugin-side retrieval and assembly work.

