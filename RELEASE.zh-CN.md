# 发布

[English](release.md) | [中文](RELEASE.zh-CN.md)

### 为什么要用 Release Tag

如果用户直接这样安装：

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

那他拿到的是：**安装当时默认分支指向的代码**。

这会带来几个问题：

- 不同时间安装的用户，拿到的代码可能不一样
- `main` 分支更新频繁时，用户会装到偏开发态的代码
- 很难准确说明某个用户到底在跑哪个版本

所以更推荐的公开安装方式应该是：

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.0
```

### 推荐发布模型

建议保留两条线：

1. `main`
   - 持续开发
   - 不作为普通用户默认安装目标

2. git tag / release
   - 稳定安装目标
   - README 默认推荐给普通用户

### 版本号规则

推荐格式：

- `v0.1.0`
- `v0.2.0`
- `v0.2.1`

简单理解：

- major/minor：功能或架构上比较明确的里程碑
- patch：文档、bugfix、或者比较安全的行为修正

### 发版清单

打 tag 之前，建议至少做这些：

1. 跑：
   - `npm test`
   - `npm run smoke:eval`
   - `npm run eval:memory-search:cases`
2. 确认关键文档已更新：
   - `README.md`
   - `docs/reference/configuration.zh-CN.md`
   - `docs/roadmap.zh-CN.md`
   - `docs/architecture.zh-CN.md`
   - `docs/test-plan.zh-CN.md`
3. 确保工作区是干净的
4. 创建版本 tag
5. push 这个 tag
6. 如有需要，更新 README 里的稳定版安装示例

### 推荐命令

示例流程：

```bash
git tag v0.2.0
git push origin v0.2.0
```

如果你还想做 GitHub Release，就用同一个 tag 去建。

### 安装模式

#### 稳定版

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.2.0
```

#### 开发头部版本

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

### 当前状态

当前已发布的 tag：

`v0.2.0`

所以现在的状态是：

- 稳定版安装已经可用
- README 现在可以正式默认推荐 tag 安装
- 后续版本继续沿用这套发布方式即可
