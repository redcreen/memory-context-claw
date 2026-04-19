# Release

[English](release.md) | [中文](RELEASE.zh-CN.md)

### Why Release Tags Matter

If users install directly from:

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

they get whatever the default branch points to at install time.

That means:

- new users installed on different days may get different code
- `main` can move faster than a normal user expects
- it is hard to say exactly which version a user is running

So the recommended public install path should be:

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.3.0
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
- `v0.2.0`
- `v0.3.0`

Simple meaning:

- major/minor: meaningful feature or architecture milestone
- patch: doc, bugfix, or safe behavior refinement release

### Release Checklist

Before creating a tag:

1. run:
   - `npm run umc:release-preflight -- --format markdown`
2. confirm important docs are updated:
   - `README.md`
   - `docs/reference/configuration.md`
   - `docs/roadmap.md`
   - `docs/architecture.md`
   - `docs/test-plan.md`
3. make sure working tree is clean
4. create a version tag
5. push the tag
6. update README stable install example if needed

### Suggested Commands

Example release flow:

```bash
npm run umc:release-preflight -- --format markdown
git tag v0.3.0
git push origin v0.3.0
```

If you also want a GitHub Release, create it from the same tag.

### Install Modes

#### Stable

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git#v0.3.0
```

#### Development Head

```bash
openclaw plugins install git+https://github.com/redcreen/Unified-Memory-Core.git
```

### Current Release Target

Next stable tag target in this branch:

`v0.3.0`

That means:

- stable install snippets in this branch are prepared for `v0.3.0`
- create and push the tag before asking users to install from it
- future releases should continue using the same model

---
