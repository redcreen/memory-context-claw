# 测试计划

[English](test-plan.md) | [中文](test-plan.zh-CN.md)

## 范围与风险

这个仓库需要保护五类核心测试面：

- artifact contracts 与 namespace 正确性
- Source、Reflection、Registry、Projection、Governance 五个主模块的行为
- OpenClaw 与 Codex 的适配器兼容性
- standalone CLI 与 independent-execution 相关路径
- memory-search 与 learning-governance 的回归质量

最大的实际风险不是“直接挂掉”，而是质量漂移：supporting context 变脏、promotion 规则失稳、或者适配器表面通过测试但用户侧 recall 质量下降。

## 验收用例

| 用例 | 前置条件 | 操作 | 预期结果 |
| --- | --- | --- | --- |
| 插件安装并加载成功 | 稳定版或本地安装 | 执行 `openclaw plugins list` | 已加载插件列表里出现 `unified-memory-core` |
| 核心 artifact 闭环可用 | 仓库含 workspace memory 文件 | 跑核心测试 | source、candidate、stable、export artifacts 保持有效 |
| OpenClaw 适配器仍然可用 | 仓库加适配器 smoke 输入 | 执行 `npm run smoke:eval` | smoke 面保持绿色，context 仍然可读 |
| promotion 建议保持保守 | 仓库加新的 memory-search cases | 执行 `npm run eval:smoke-promotion` | promotion 建议不会把 smoke 面搞脆 |
| governance 仍然可 repair | 仓库含 governance fixtures | 跑 targeted governance tests 和 CLI 路径 | audit、repair、replay、export inspect 仍然可用 |

更细的 case 清单在 [unified-memory-core/testing/case-matrix.zh-CN.md](reference/unified-memory-core/testing/case-matrix.zh-CN.md)。

Stage 3-4 的首选操作清单在 [unified-memory-core/testing/stage3-stage4-acceptance.zh-CN.md](reference/unified-memory-core/testing/stage3-stage4-acceptance.zh-CN.md)。

Stage 5 的首选操作清单在 [unified-memory-core/testing/stage5-acceptance.zh-CN.md](reference/unified-memory-core/testing/stage5-acceptance.zh-CN.md)。

OpenClaw 宿主级集成 smoke 在 [unified-memory-core/testing/openclaw-cli-integration.zh-CN.md](reference/unified-memory-core/testing/openclaw-cli-integration.zh-CN.md)。

OpenClaw release bundle 的真实安装验证在 [unified-memory-core/testing/openclaw-bundle-install.zh-CN.md](reference/unified-memory-core/testing/openclaw-bundle-install.zh-CN.md)。

“只等人类验收”的一键 CLI 门禁在 [unified-memory-core/testing/release-preflight.zh-CN.md](reference/unified-memory-core/testing/release-preflight.zh-CN.md)。

Codex 对话窗口里的 `Context Minor GC` 手工验收入口在 [unified-memory-core/testing/codex-context-minor-gc-manual.zh-CN.md](reference/unified-memory-core/testing/codex-context-minor-gc-manual.zh-CN.md)。

## 自动化覆盖

主要自动化测试面：

- `npm run umc:acceptance`
- `npm run umc:stage5`
- `npm run umc:openclaw-itest`
- `npm run umc:build-bundle`
- `npm run umc:openclaw-install-verify`
- `npm run umc:release-preflight`
- `npm test`
- `npm run smoke:eval`
- `npm run eval:smoke-promotion`
- [../test/unified-memory-core](../test/unified-memory-core) 下的 targeted suites
- 适配器集成测试：[../test/openclaw-adapter.test.js](../test/openclaw-adapter.test.js)、[../test/codex-adapter.test.js](../test/codex-adapter.test.js)、[../test/adapter-compatibility.test.js](../test/adapter-compatibility.test.js)

详细测试栈：

- [unified-memory-core/testing/README.zh-CN.md](reference/unified-memory-core/testing/README.zh-CN.md)
- [unified-memory-core/testing/case-matrix.zh-CN.md](reference/unified-memory-core/testing/case-matrix.zh-CN.md)
- [unified-memory-core/testing/stage3-stage4-acceptance.zh-CN.md](reference/unified-memory-core/testing/stage3-stage4-acceptance.zh-CN.md)
- [unified-memory-core/testing/stage5-acceptance.zh-CN.md](reference/unified-memory-core/testing/stage5-acceptance.zh-CN.md)
- [unified-memory-core/testing/openclaw-cli-integration.zh-CN.md](reference/unified-memory-core/testing/openclaw-cli-integration.zh-CN.md)
- [unified-memory-core/testing/openclaw-bundle-install.zh-CN.md](reference/unified-memory-core/testing/openclaw-bundle-install.zh-CN.md)
- [unified-memory-core/testing/release-preflight.zh-CN.md](reference/unified-memory-core/testing/release-preflight.zh-CN.md)
- [unified-memory-core/testing/codex-context-minor-gc-manual.zh-CN.md](reference/unified-memory-core/testing/codex-context-minor-gc-manual.zh-CN.md)

## 手工检查

- Stage 3-4 相关验证优先先跑 `npm run umc:acceptance`
- Stage 5 相关验证优先先跑 `npm run umc:stage5`
- OpenClaw 宿主相关验证优先先跑 `npm run umc:openclaw-itest`
- 如果要把部署验证和 CLI 验收一次收口，优先跑 `npm run umc:release-preflight -- --format markdown`
- 从 release tag 安装插件，并确认它能在 OpenClaw 里成功加载；当 preflight 已通过时，这一步只保留成人类 sanity check
- 检查 recalled context 质量，不只看测试通过与否
- 确认稳定事实 / 规则扩面后没有引入脏 supporting context
- 确认 governance 报告仍然足够可读，能支持 promotion 决策
- 确认 `.codex/status.md` 和 `.codex/module-dashboard.md` 仍然反映真实执行焦点

## 测试数据与夹具

重要数据和夹具来源：

- `workspace/MEMORY.md`
- `workspace/memory/*.md`
- `workspace/notes/*.md`
- `reports/` 下的治理与专项报告
- `test/unified-memory-core/` 下的模块级测试

## 发布门禁

打稳定 tag 之前先跑：

```bash
npm run umc:acceptance -- --format markdown
npm run umc:stage5 -- --format markdown
npm run umc:openclaw-itest -- --format markdown
npm run umc:openclaw-install-verify -- --format markdown
npm run umc:release-preflight -- --format markdown
npm test
npm run smoke:eval
npm run eval:smoke-promotion
```

然后确认：

- README 和文档首页仍然能正确给用户导向
- README 里的安装示例仍然指向预期 tag
- 控制面文档仍然反映真实活跃模块和当前切片
- 没有新的回归工作被偷偷塞进 `todo.md` 或 reports 里
