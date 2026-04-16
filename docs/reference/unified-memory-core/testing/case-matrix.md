# Unified Memory Core Case Matrix

[English](case-matrix.md) | [中文](case-matrix.zh-CN.md)

## Contract Cases

- source manifest schema cases
- candidate artifact schema cases
- stable artifact schema cases
- export contract cases
- namespace / visibility cases

## Module Cases

- source registration cases
- normalization cases
- standalone source adapter hardening cases for `file`, `directory`, `url`, and `image`
- fingerprinting / replay cases
- event labeling cases
- candidate builder cases
- evidence scoring cases
- promotion / decay cases
- conflict / superseded cases
- dialogue working-set pruning mock cases
- dialogue working-set pruning real-LLM replay cases
- self-learning daily reflection cases
- standalone command-routing cases
- split-readiness checklist cases

## Artifact Cases

- OpenClaw export artifact cases
- Codex export artifact cases
- generic export version cases
- Stage 3-4 acceptance report cases
- Stage 5 acceptance report cases
- audit report cases
- repair record cases
- replay result cases

## Adapter Cases

- OpenClaw adapter namespace mapping cases
- OpenClaw adapter consumption cases
- Codex adapter binding cases
- Codex adapter write-back cases
- multi-runtime namespace collision cases
- multi-agent concurrent write serialization cases
- visibility filtering across OpenClaw / Codex / Claude cases
- OpenClaw shared-workspace loading cases
- Codex multi-runtime code-memory binding cases

## Notes

- runtime API tests are deferred to a later roadmap phase
- self-learning execution tests should reuse Source / Reflection / Registry surfaces instead of inventing a separate hidden path
- standalone mode should be validated against the same artifact contracts as embedded mode
- Stage 3-4 operator validation should default to `npm run umc:acceptance` before manual spot checks
