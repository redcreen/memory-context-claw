# Unified Memory Core Testing Plan

[English](#english) | [中文](#中文)

## English

Testing planning entrypoints:

- [case-matrix.md](case-matrix.md)

Step 4 testing surfaces are grouped into four layers:

1. contract validation
2. module behavior
3. export / artifact validation
4. adapter compatibility

Current required surfaces:

- source registration correctness
- normalization and fingerprint correctness
- candidate extraction correctness
- registry lifecycle correctness
- projection artifact correctness
- governance audit / repair / replay correctness
- OpenClaw adapter compatibility
- Codex adapter compatibility
- multi-runtime namespace / visibility / concurrency correctness

## 中文

测试规划入口：

- [case-matrix.md](case-matrix.md)

Step 4 的 testing surfaces 分成 4 层：

1. contract validation
2. module behavior
3. export / artifact validation
4. adapter compatibility

当前必须补齐的测试面：

- source registration correctness
- normalization / fingerprint correctness
- candidate extraction correctness
- registry lifecycle correctness
- projection artifact correctness
- governance audit / repair / replay correctness
- OpenClaw adapter compatibility
- Codex adapter compatibility
- multi-runtime namespace / visibility / concurrency correctness
