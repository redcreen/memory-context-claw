# Expand benchmark coverage, separate transport watch, and expose answer-path regression

- Date: 2026-04-14
- Status: resolved

## Problem

The first `100+` OpenClaw CLI benchmark pass proved the retrieval-heavy host index path, but it still left three gaps. The live `openclaw agent` answer-level matrix was too small, cross-source and supersede retrieval probes were still thin, and raw `openclaw memory search` instability was still being treated as ambient benchmark noise instead of a first-class watch surface.

## Thinking

The next round needed a cleaner split between retrieval evidence, answer-level evidence, and host transport evidence. Without that split, algorithm work would keep mixing three different failure classes: plugin retrieval quality, raw host transport instability, and the answer-level host path. The benchmark also needed a larger agent matrix, but the runner had to stay honest about red results instead of treating them like script errors.

## Solution

Expanded [evals/openclaw-cli-memory-benchmark-cases.js](../../evals/openclaw-cli-memory-benchmark-cases.js) to `187` total cases, including `62` agent answer-level prompts plus new `cross-source` and `supersede` retrieval probes. Extended [scripts/eval-openclaw-cli-memory-benchmark.js](../../scripts/eval-openclaw-cli-memory-benchmark.js) with entrypoint filtering and multi-source group assertions, added [scripts/eval-openclaw-cli-agent-answer-matrix.js](../../scripts/eval-openclaw-cli-agent-answer-matrix.js) as a dedicated answer-level runner, and added [scripts/watch-openclaw-memory-search-transport.js](../../scripts/watch-openclaw-memory-search-transport.js) with [src/openclaw-memory-search-transport-watch.js](../../src/openclaw-memory-search-transport-watch.js) to produce a dedicated raw transport watchlist. Also updated [src/query-rewrite.js](../../src/query-rewrite.js) so benchmark-style agent wrapper instructions do not pollute retrieval queries.

## Validation

- `node --test test/openclaw-cli-memory-benchmark-cases.test.js test/query-rewrite.test.js test/openclaw-memory-search-transport-watch.test.js`
- `node scripts/eval-openclaw-cli-memory-benchmark.js --entrypoints memory_search --skip-legacy ...` -> `125/125`
- `node scripts/watch-openclaw-memory-search-transport.js --format markdown` -> `17/24` raw ok, `7` watchlist items
- `node scripts/eval-openclaw-cli-agent-answer-matrix.js --skip-legacy --max-cases 36 --format markdown` -> `0/36`
- `npm run runtime:check`
- `openclaw plugins inspect unified-memory-core --json`
- `openclaw memory status --agent umceval --json`
- `openclaw memory search --agent umceval --query "preferred name" --max-results 3 --json`

## Follow-up

- Treat the live answer-level host path as a separate red line instead of mixing it into retrieval or transport quality.
- Plan the next benchmark toward `200` cases with breadth-first coverage rules and at least `50%` Chinese cases.
- Define a dedicated performance plan for the retrieval / assembly / answer-level main path before choosing the next optimization order.
