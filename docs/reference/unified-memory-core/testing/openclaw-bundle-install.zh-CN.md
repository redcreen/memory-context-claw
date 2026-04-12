# Unified Memory Core OpenClaw Bundle Install

[English](openclaw-bundle-install.md) | [中文](openclaw-bundle-install.zh-CN.md)

这份文档描述的是 `unified-memory-core` 的发版级部署验证。

它回答的是一个明确的问题：

`OpenClaw 能不能安装一份干净的 release bundle，把它绑定成 contextEngine，并在隔离 profile 里继续通过 memory CLI smoke？`

## 首选命令

直接跑：

```bash
npm run umc:openclaw-install-verify -- --format markdown
```

这条命令会自动：

1. 构建一份干净的 OpenClaw release bundle
2. 对 bundle 做 blocked install pattern 扫描
3. 通过 `openclaw plugins install` 安装这份 bundle
4. 把 `unified-memory-core` 绑定到 `plugins.slots.contextEngine`
5. 校验 config、plugin load、memory index 和 memory search

如果你更想走结构化 CLI：

```bash
npm run umc:cli -- verify openclaw-install --format markdown
```

## 通过后代表什么

报告通过表示这几件事同时成立：

- release artifact 是 runtime-only，而不是把整个开发仓库原样丢给用户
- OpenClaw safe install 不需要 `--dangerously-force-unsafe-install` 也能接受这份 artifact
- 安装后的插件仍然能通过真实宿主路径加载
- 安装后宿主自己的 memory CLI 行为仍然正常

## 缩小范围排查

如果这条流失败，先拆层：

```bash
npm run umc:build-bundle -- --format markdown
```

```bash
npm run umc:openclaw-itest -- --format markdown
```

第一条只验证 bundle 构建和 safety scan。

第二条只验证通过 `plugins.load.paths` 的宿主加载和 memory CLI 路径，不包含 install 本身。

## 相关文档

- [release-preflight.zh-CN.md](release-preflight.zh-CN.md)
- [stage5-acceptance.zh-CN.md](stage5-acceptance.zh-CN.md)
- [openclaw-cli-integration.zh-CN.md](openclaw-cli-integration.zh-CN.md)
- [../../../../RELEASE.zh-CN.md](../../../../RELEASE.zh-CN.md)
