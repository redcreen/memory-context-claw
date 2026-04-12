# Unified Memory Core Release Preflight

[English](release-preflight.md) | [中文](release-preflight.zh-CN.md)

这是一条“一键跑完，只剩人类验收”的 CLI 门禁。

## 首选命令

直接跑：

```bash
npm run umc:release-preflight -- --format markdown
```

结构化 CLI 等价命令：

```bash
npm run umc:cli -- verify release-preflight --format markdown
```

## 它覆盖什么

一份通过的 preflight 报告，表示这些检查在同一轮里全部为绿：

- `npm test`
- `npm run smoke:eval`
- `npm run eval:memory-search:cases`
- `npm run umc:stage5 -- --format json`
- `npm run umc:openclaw-itest -- --format json`
- `npm run umc:openclaw-install-verify -- --format json`
- Markdown 链接扫描
- `git diff --check`

## 什么时候用

这条流适合在下面这种状态使用：

- Stage 5 已经完成
- 你想要发版级 CLI 证据
- 你不想再靠人类重复跑一堆散命令

## 通过之后还剩什么

preflight 通过之后，剩下的就不再是 CLI 工作了。

剩下的是人类验收，例如：

- 在真实 OpenClaw 会话里做一次 sanity check
- commit / push / tag 前做一次最终 operator review

## 相关文档

- [openclaw-bundle-install.zh-CN.md](openclaw-bundle-install.zh-CN.md)
- [stage5-acceptance.zh-CN.md](stage5-acceptance.zh-CN.md)
- [../../../../RELEASE.zh-CN.md](../../../../RELEASE.zh-CN.md)
