# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-15T03:10:08.034Z`
- totalProbes: `8`
- rawOk: `0`
- emptyResults: `0`
- timeout: `0`
- invalidJson: `8`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `15570`
- maxDurationMs: `25216`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`25216` maxMs=`25216`
- preference: ok=`0` failures=`1` total=`1` avgMs=`8235` maxMs=`8235`
- rule: ok=`0` failures=`1` total=`1` avgMs=`8156` maxMs=`8156`
- project: ok=`0` failures=`1` total=`1` avgMs=`22039` maxMs=`22039`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`18476` maxMs=`18476`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`14379` maxMs=`14379`
- temporal-current: ok=`0` failures=`1` total=`1` avgMs=`14952` maxMs=`14952`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`13110` maxMs=`13110`

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

