# Define Accepted-Action Fact Capture As A Governed Learning Intake

## Context

The current self-learning baseline already supports declared-source ingestion, reflection, promotion, decay, export, and governance.

What it still does not do cleanly is capture one important class of evidence:

- the agent proposes a reusable target or rule
- the user accepts it
- runtime execution succeeds
- but the result remains visible only inside session/task logs

That leaves a practical memory gap.

A successful task can prove a reusable fact, yet the next task may still need to rediscover it because there is no generic bridge from accepted behavior into governed fact-candidate extraction.

## What Changed

Updated the workstream architecture and roadmap docs to define a generic intake for adopted behavior instead of recommending any product-specific hardcoded memory rule.

Architecture changes:

- self-learning architecture now defines accepted-action capture as a first-class governed evidence surface
- the architecture now states that adopted behavior may enter candidate extraction, but must not bypass lifecycle governance
- host-neutral-memory architecture now makes accepted-action events part of the shared registry / decision-trail intake, not adapter-owned durable state

Roadmap changes:

- self-learning roadmap now marks accepted-action intake as the clearest next enhancement slice
- reflection and governance phases now include accepted-action extraction and replay / audit coverage
- host-neutral-memory roadmap now requires both adapters to converge on the same accepted-action intake surface

## Key Decisions

1. Do not hardcode product-specific memory rules such as "if GitHub Pages publish succeeds, remember the URL."
2. Treat accepted behavior as structured evidence, not as stable memory.
3. Require a generic pipeline:
   accepted-action event -> candidate extraction -> lifecycle classification -> layered persistence -> later promotion or decay.
4. Keep canonical storage host-neutral:
   OpenClaw and Codex may emit accepted-action events, but neither adapter owns the durable memory outcome.
5. Preserve the existing Stage 5 closeout baseline and position this work as a later enhancement slice, not a reopened baseline contract.

## Verification

- reviewed the current self-learning architecture and roadmap against the Stage 5-closeout baseline
- reviewed host-neutral-memory architecture and roadmap to ensure the new intake path does not reintroduce adapter-local durable storage
- checked development-log indexes after adding the new entry

Observed result:

- the docs now describe one consistent answer to the "accepted behavior should become a governed candidate" gap
- the design remains generic and host-neutral
- the change does not reopen the completed Stage 5 baseline

## Outcome

The repo now has an explicit design position for the missing bridge between successful task behavior and long-term governed memory.

The next implementation step, when opened, should be to add:

- accepted-action event emission
- candidate extraction from those events
- admission into session / daily / stable-candidate layers
- replay, audit, and regression coverage for that path
