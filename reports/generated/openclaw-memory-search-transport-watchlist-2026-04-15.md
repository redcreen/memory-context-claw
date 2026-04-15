# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-15T13:13:40.903Z`
- totalProbes: `8`
- rawOk: `0`
- emptyResults: `0`
- timeout: `0`
- invalidJson: `8`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `8541`
- maxDurationMs: `9208`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`8550` maxMs=`8550`
- preference: ok=`0` failures=`1` total=`1` avgMs=`8540` maxMs=`8540`
- rule: ok=`0` failures=`1` total=`1` avgMs=`8392` maxMs=`8392`
- project: ok=`0` failures=`1` total=`1` avgMs=`8314` maxMs=`8314`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`8927` maxMs=`8927`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`8249` maxMs=`8249`
- temporal-current: ok=`0` failures=`1` total=`1` avgMs=`8151` maxMs=`8151`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`9208` maxMs=`9208`

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

