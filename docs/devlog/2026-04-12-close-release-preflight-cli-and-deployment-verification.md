# Close Release Preflight CLI And Deployment Verification

## Context

Stage 5 had already closed product hardening, but one operator-grade gap remained:

- the repo could prove host smoke through `plugins.load.paths`
- the repo could not yet prove a clean release artifact and a real `openclaw plugins install` path
- the practical release checklist was still a human-assembled sequence of commands instead of one CLI gate

That meant the repository was close to “only human acceptance remains”, but not actually there.

## What Changed

Closed that gap as one deployment-verification slice instead of another loose checklist.

Core implementation changes:

- removed plugin-runtime `child_process` retrieval from `src/retrieval.js`
- switched retrieval to local SQLite memory reads, keeping card fast paths and current scoring surfaces intact
- added a clean OpenClaw release bundle builder
- added real OpenClaw bundle install verification in an isolated profile
- added a one-command `release-preflight` gate that chains repo regression, Stage 5 acceptance, host smoke, real install verification, Markdown link scan, and patch cleanliness

Operator surface changes:

- added `npm run umc:build-bundle`
- added `npm run umc:openclaw-install-verify`
- added `npm run umc:release-preflight`
- added matching `umc:cli` surfaces for bundle build and install verification

Documentation changes:

- added release-bundle install docs
- added release-preflight docs
- updated testing index, test plans, Stage 5 acceptance docs, and release checklist

## Key Decisions

1. Do not hide deployment validation behind `plugins.load.paths` forever.
2. Fix the installability problem at the root by removing plugin-runtime shelling-out.
3. Treat generated release bundles as deployable runtime artifacts, not full-doc mirrors.
4. Exclude `dist/openclaw-release/` from Markdown link gates, because those bundles are runtime-only outputs.

## Verification

- `node --test test/config-apply.test.js test/retrieval.test.js test/openclaw-release-bundle.test.js test/openclaw-bundle-install.test.js`
- `npm run umc:build-bundle -- --format markdown`
- `npm run umc:openclaw-install-verify -- --format markdown`
- `npm run umc:release-preflight -- --format markdown`
- `npm run umc:cli -- release build-bundle --format markdown`
- `npm run umc:cli -- verify openclaw-install --format markdown`

Final observed results:

- `npm test`: `346/346`
- `npm run smoke:eval`: `28/28`
- `npm run eval:memory-search:cases`: plugin `30/30`
- `npm run umc:release-preflight -- --format markdown`: `pass`

## Outcome

The repo is now at:

`CLI verification complete; only human acceptance remains`

The next work is not more deployment plumbing.

The next work is either:

- human acceptance and commit / push / tag work
- or later operator policy work such as registry-root cutover decisions
