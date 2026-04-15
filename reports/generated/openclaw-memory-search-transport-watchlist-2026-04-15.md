# OpenClaw Memory Search Transport Watchlist

- generatedAt: `2026-04-15T17:50:14.074Z`
- totalProbes: `8`
- rawOk: `3`
- emptyResults: `1`
- timeout: `0`
- invalidJson: `4`
- commandFailed: `0`
- otherFailure: `0`
- averageDurationMs: `8104`
- maxDurationMs: `8919`

## Category Summary
- profile: ok=`0` failures=`1` total=`1` avgMs=`8919` maxMs=`8919`
- preference: ok=`0` failures=`1` total=`1` avgMs=`8093` maxMs=`8093`
- rule: ok=`1` failures=`0` total=`1` avgMs=`8017` maxMs=`8017`
- project: ok=`1` failures=`0` total=`1` avgMs=`7601` maxMs=`7601`
- cross-source: ok=`0` failures=`1` total=`1` avgMs=`8111` maxMs=`8111`
- supersede: ok=`0` failures=`1` total=`1` avgMs=`8158` maxMs=`8158`
- temporal-current: ok=`1` failures=`0` total=`1` avgMs=`7921` maxMs=`7921`
- temporal-history: ok=`0` failures=`1` total=`1` avgMs=`8014` maxMs=`8014`

## Failure Classes
- missing_json_payload: `4`
- ok: `3`
- empty_results: `1`

## Watchlist
- profile-name-1 [profile] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- pref-reply-style-1 [preference] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- cross-source-travel-search-1 [cross-source] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- supersede-editor-search-1 [supersede] `invalid_json` / `missing_json_payload`: raw openclaw memory search returned a non-JSON payload
- history-editor-search-1 [temporal-history] `empty_results` / `empty_results`: raw openclaw memory search returned no results

## Notes
- This watchlist tracks raw `openclaw memory search` transport health only.
- Failures here should not be counted as Unified Memory Core retrieval algorithm regressions when sqlite fallback or agent-path evidence remains green.
- Use this report to separate host transport instability from plugin-side retrieval and assembly work.

