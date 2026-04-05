# Release

[English](#english) | [中文](#中文)

## English

### Why Release Tags Matter

If users install directly from:

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

they get whatever the default branch points to at install time.

That means:

- new users installed on different days may get different code
- `main` can move faster than a normal user expects
- it is hard to say exactly which version a user is running

So the recommended public install path should be:

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git#v0.1.0
```

### Recommended Release Model

Use two tracks:

1. `main`
   - active development
   - not the default stable install target

2. git tags / releases
   - stable install target
   - what README should recommend to normal users

### Versioning Rule

Recommended format:

- `v0.1.0`
- `v0.1.0`
- `v0.2.1`

Simple meaning:

- major/minor: meaningful feature or architecture milestone
- patch: doc, bugfix, or safe behavior refinement release

### Release Checklist

Before creating a tag:

1. run:
   - `npm test`
   - `npm run smoke:eval`
   - `npm run eval:memory-search:cases`
2. confirm important docs are updated:
   - `README.md`
   - `configuration.md`
   - `project-roadmap.md`
   - `system-architecture.md`
3. make sure working tree is clean
4. create a version tag
5. push the tag
6. update README stable install example if needed

### Suggested Commands

Example release flow:

```bash
git tag v0.1.0
git push origin v0.1.0
```

If you also want a GitHub Release, create it from the same tag.

### Install Modes

#### Stable

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git#v0.1.0
```

#### Development Head

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

### Current State

At the moment, this repo has **not published its first release tag yet**.

That means:

- stable-install wording is ready
- release process is defined
- the first public stable install should switch to tag-based install after the first tag is created

---

## 中文

### 为什么要用 Release Tag

如果用户直接这样安装：

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

那他拿到的是：**安装当时默认分支指向的代码**。

这会带来几个问题：

- 不同时间安装的用户，拿到的代码可能不一样
- `main` 分支更新频繁时，用户会装到偏开发态的代码
- 很难准确说明某个用户到底在跑哪个版本

所以更推荐的公开安装方式应该是：

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git#v0.1.0
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
- `v0.1.0`
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
   - `configuration.md`
   - `project-roadmap.md`
   - `system-architecture.md`
3. 确保工作区是干净的
4. 创建版本 tag
5. push 这个 tag
6. 如有需要，更新 README 里的稳定版安装示例

### 推荐命令

示例流程：

```bash
git tag v0.1.0
git push origin v0.1.0
```

如果你还想做 GitHub Release，就用同一个 tag 去建。

### 安装模式

#### 稳定版

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git#v0.1.0
```

#### 开发头部版本

```bash
openclaw plugins install git+https://github.com/redcreen/memory-context-claw.git
```

### 当前状态

当前这个仓库**还没有发布第一个 release tag**。

所以现在的状态是：

- 稳定版安装文案已经准备好了
- 发布流程已经定义好了
- 等你打出第一个 tag 后，就可以把公开推荐安装方式切到 tag 安装
