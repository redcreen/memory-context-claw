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
- `file`、`directory`、`url`、`image` 四类 standalone source adapter hardening cases
- fingerprinting / replay cases
- event labeling cases
- candidate builder cases
- evidence scoring cases
- promotion / decay cases
- conflict / superseded cases
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
- OpenClaw / Codex / Claude visibility filtering cases
- OpenClaw shared-workspace loading cases
- Codex multi-runtime code-memory binding cases

## Notes

- runtime API tests 放到后续 roadmap 阶段
- self-learning 执行测试应复用 Source / Reflection / Registry 的测试面，不再额外开一条隐藏路径
- standalone mode 应和 embedded mode 复用同一套 artifact contracts 做校验
- Stage 3-4 operator validation 应优先跑 `npm run umc:acceptance`，再决定是否需要人工 spot check
