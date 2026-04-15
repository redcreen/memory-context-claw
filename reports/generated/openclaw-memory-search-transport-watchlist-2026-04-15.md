# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-15T13:48:47.752Z`
- totalProbes: `8`
- rawOk: `0`
- emptyResults: `0`
- timeout: `0`
- invalidJson: `8`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `8385`
- maxDurationMs: `8864`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`8594` maxMs=`8594`
- preference: ok=`0` failures=`1` total=`1` avgMs=`8864` maxMs=`8864`
- rule: ok=`0` failures=`1` total=`1` avgMs=`8041` maxMs=`8041`
- project: ok=`0` failures=`1` total=`1` avgMs=`8256` maxMs=`8256`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`8495` maxMs=`8495`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`8102` maxMs=`8102`
- temporal-current: ok=`0` failures=`1` total=`1` avgMs=`8267` maxMs=`8267`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`8458` maxMs=`8458`

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

