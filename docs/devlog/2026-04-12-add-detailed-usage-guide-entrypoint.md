# Add Detailed Usage Guide Entrypoint

## Why

The repository had a short top-level README, a growing testing stack, and multiple reference documents, but it did not have one stable place for a human to read a detailed product-usage manual.

That created a predictable navigation problem:

- the top-level README was too short for real operators
- testing docs were too validation-oriented for normal use
- architecture and roadmap docs were the wrong layer for installation and day-to-day usage

## What Changed

- added a durable detailed usage guide under `docs/reference/unified-memory-core/usage-guide.md`
- added a Chinese companion guide under `docs/reference/unified-memory-core/usage-guide.zh-CN.md`
- linked the guide from `README*`, `docs/README*`, and `docs/reference/*`

## Placement Decision

The detailed usage guide belongs in `docs/reference/unified-memory-core/`, not in the top-level README.

Reason:

- the README should remain a short landing surface
- the guide is product-specific and durable
- the content is broader than testing but more practical than architecture

## Outcome

The docs stack now has a clearer layering model:

- `README*`: fast project entry
- `docs/README*`: docs navigation
- `docs/reference/unified-memory-core/usage-guide*`: detailed usage and operator manual
- `docs/reference/unified-memory-core/testing/*`: verification and testing guides
