# Stage 10 最短接入路径

[English](adoption-shortest-path.md) | [中文](adoption-shortest-path.zh-CN.md)

这份文档回答一个实际问题：

`如果我现在想最快确认 Unified Memory Core 已经可装、可跑、可证明共享底座能力，最短路径是什么？`

## 最短维护者路径

```bash
npm install
npm run umc:stage10 -- --format markdown
```

这条路径现在是 Stage 10 的正式 adoption proof。

它会一次输出：

- package tarball size
- `umc` CLI startup cost
- `umc registry inspect` first-run cost
- Codex `writeAfterTask(...)` -> governed `memory_intent` -> OpenClaw-readable shared memory proof
- multi-instance shared-root operator proof

## 更强的发版级路径

如果你不是在看 adoption baseline，而是在看“只差人类验收”的 release-grade 证据，继续跑：

```bash
npm run umc:release-preflight -- --format markdown
```

这条命令仍然是最强的一键门禁，因为它会串起：

- full repo regression
- smoke eval
- plugin-side memory-search cases
- Stage 5 acceptance
- host smoke
- real bundle install verification
- Markdown link scan
- `git diff --check`

## 当前基线

最新 Stage 10 adoption proof：

- latest sampled package tarball: `1456484 bytes`
- `umc where` startup: `154ms`
- `umc registry inspect --registry-dir <temp>` first-run: `80ms`
- Codex shared-foundation proof: `1 promoted / 1 candidate / 1 policy input`
- multi-instance shared-root proof: `2 candidates / 2 policy inputs`

对应报告：

- [../../../../reports/generated/stage10-adoption-and-shared-foundation-2026-04-18.md](../../../../reports/generated/stage10-adoption-and-shared-foundation-2026-04-18.md)
- [../../../../reports/generated/stage10-adoption-closeout-2026-04-18.zh-CN.md](../../../../reports/generated/stage10-adoption-closeout-2026-04-18.zh-CN.md)

## 这条路径不做什么

- 不替代 `release-preflight`
- 不替代 Docker hermetic A/B
- 不把 Stage 9 guarded smart path 扩大成默认行为

它的目标只是：

`把接入更短、共享底座更可证明，收成一个维护者可以直接执行的一键入口。`
