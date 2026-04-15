# OpenClaw CLI Agent Answer Watch

- generatedAt: `2026-04-15T11:52:20.205Z`
- scope: deeper isolated local answer-level watch matrix, not the repo-default formal gate
- source artifact: [openclaw-cli-agent-answer-watch-2026-04-15.json](../openclaw-cli-agent-answer-watch-2026-04-15.json)

## Why This Exists

The repo-default formal gate remains the stable `12 / 12` isolated local answer-level matrix.

This watch report answers a different question:

- what happens if the answer-level path is pushed further into `cross-source`, `conflict`, `multi-step history`, and denser natural-Chinese prompts right now?

## Current Watch Result

- total cases: `18`
- passed: `7 / 18`
- failed: `11 / 18`
- zh-bearing: `9 / 18`
- compared legacy: `14`
- legacy passed: `0`

Category split:

- agent-profile: `0 / 1`
- agent-project: `1 / 2`
- agent-temporal: `0 / 2`
- agent-cross-source: `0 / 1`
- agent-rule: `0 / 1`
- agent-history: `1 / 1`
- agent-zh: `0 / 2`
- agent-zh-natural: `3 / 6`
- negative: `2 / 2`

## Main Finding

This deeper matrix is currently not failing because Memory Core forgot the facts.

It is failing because the host answer-level path is reintroducing output-shape noise:

- `11` cases failed with `Unable to parse JSON payload from stdout`
- observed transport split:
  - `agent_local`: `7`
  - `agent`: `11`

That means this matrix is useful as a watch surface, but not yet trustworthy enough to replace the stable repo-default formal gate.

## What This Means

- keep the stable repo-default formal gate at `12 / 12`
- keep this deeper `18`-case matrix as a watch / triage surface
- continue separating host output-shape noise from actual retrieval / assembly quality

## Chinese Coverage In The Deeper Watch

The deeper watch matrix already improves answer-level Chinese pressure:

- zh-bearing cases: `9 / 18`
- natural-Chinese cases inside the watch: `6`

So the Chinese expansion work is real, but the host path is not yet clean enough for these cases to become the default formal gate.

## Next Implication

Before promoting this deeper matrix into the repo-default formal gate, the next work should focus on:

1. keeping the stable `12 / 12` gate green
2. isolating why some `openclaw agent --local` runs still return non-parseable output shapes
3. rerunning this deeper watch after host-noise handling is cleaner
