# Implement Step 47 Field-Aware Accepted-Action Extraction

## Context

The repo already had a governed `accepted_action` intake path, but it still flattened one successful event into one conservative fact-like candidate.

That left one practical gap unresolved:

- reusable targets such as repos or root endpoints were mixed together with one-off outputs
- final URLs and artifact paths looked too similar to durable defaults
- CLI and lifecycle could prove ingestion, but not prove field-level extraction behavior

Step 47 existed specifically to close that gap without also pulling Step 48-52 into the same change.

## What Changed

Implemented field-aware accepted-action extraction across source normalization, reflection, tests, and CLI validation.

Code changes:

- `source-system` now normalizes accepted-action target, artifact, and output descriptors
- `reflection-system` now expands successful accepted-action sources into:
  - `target_fact`
  - explicit `operating_rule`
  - `outcome_artifact`
- reflection run summaries now report extraction classes in addition to labels and states
- duplicate one-off outcomes emitted through multiple fields are deduplicated during extraction

Tests and CLI coverage:

- unit tests now assert descriptor normalization and multi-output reflection behavior
- CLI tests now assert field-aware extraction counts inside `learn lifecycle-run`
- manual CLI simulation now proves:
  - reusable repo target promotes as a stable fact candidate
  - final URL and artifact path remain observation candidates

## Key Decisions

1. Keep Step 47 narrow.
   The implementation splits fields into better candidates, but it does not yet add full admission routing, richer evidence weighting, or negative-path policy.
2. Make extraction descriptor-driven.
   Reflection now consumes normalized target / artifact descriptors instead of re-parsing raw strings ad hoc.
3. Keep backward compatibility.
   `reflectSourceArtifact()` still exposes the legacy primary candidate fields while also returning multi-output `outputs`.
4. Deduplicate one-off outcomes by value.
   The same final URL may appear in both `targets` and `outputs`; it should not create duplicate observation candidates.

## Verification

- `node --test test/unified-memory-core/source-system.test.js test/unified-memory-core/reflection-system.test.js test/umc-cli.test.js`
- `npm test`
- `npm run verify`
- `npm run umc:cli -- reflect run --registry-dir /tmp/umc-step47-reflect --source-type accepted_action --action-type publish_site --status succeeded --accepted true --succeeded true --agent-id code --targets redcreen/redcreen.github.io,https://redcreen.github.io/brain-reinstall-jingangjing/ --artifacts dist/index.html --content "User accepted the publish target and the site release succeeded." --format json`
- `npm run umc:cli -- learn lifecycle-run --registry-dir /tmp/umc-step47-lifecycle --source-type accepted_action --action-type publish_site --status succeeded --accepted true --succeeded true --agent-id code --targets redcreen/redcreen.github.io,https://redcreen.github.io/brain-reinstall-jingangjing/ --artifacts dist/index.html --content "User accepted the publish target and the site release succeeded." --format json`

Observed result:

- targeted tests passed
- full `npm test` passed with `359/359`
- `npm run verify` passed
- CLI reflection produced `candidate_count = 3` with `by_extraction_class.target_fact = 1` and `by_extraction_class.outcome_artifact = 2`
- lifecycle promotion promoted only the reusable repo target while keeping the final URL and artifact path in observation state

## Outcome

Step 47 is now implemented.

The accepted-action path no longer collapses all successful behavior into one generic summary. The system can now distinguish:

- reusable target facts worth stable promotion
- explicit operating rules when the accepted-action evidence contains rule signals
- one-off outcome artifacts that should remain observational for now

The remaining deferred queue starts at Step 48: admission routing, richer evidence weighting, negative-path handling, and conflict-specific governance.
