# Configuration

[English](configuration.md) | [中文](configuration.zh-CN.md)

### What Most Users Need

Most users only need to do three things:

1. install the plugin
2. set it as the active `contextEngine`
3. make sure OpenClaw long-memory indexing is working

Everything else should stay on defaults until there is a clear reason to tune.

That includes nightly self-learning: the plugin now runs one local-time self-learning pass at `00:00` by default, so most users do not need to add any extra config.

### Quick Minimal Config

Use this in `~/.openclaw/openclaw.json`:

```json5
{
  plugins: {
    allow: ["unified-memory-core"],
    slots: {
      contextEngine: "unified-memory-core"
    },
    entries: {
      "unified-memory-core": {
        enabled: true
      }
    }
  }
}
```

If you are developing locally and want OpenClaw to load this repo directly:

```json5
{
  plugins: {
    allow: ["unified-memory-core"],
    load: {
      paths: ["/ABSOLUTE/PATH/TO/unified-memory-core"]
    },
    slots: {
      contextEngine: "unified-memory-core"
    },
    entries: {
      "unified-memory-core": {
        enabled: true
      }
    }
  }
}
```

If you want to override the nightly self-learning behavior, keep it minimal:

```json5
{
  plugins: {
    entries: {
      "unified-memory-core": {
        enabled: true,
        selfLearning: {
          enabled: true,
          localTime: "00:00"
        }
      }
    }
  }
}
```

### Minimal OpenClaw Memory Config

This plugin assumes OpenClaw long-memory indexing is already configured.

Minimal example:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        memorySearch: {
          provider: "local",
          fallback: "none",
          local: {
            modelPath: "/ABSOLUTE/PATH/TO/embeddinggemma-300m-qat-Q8_0.gguf"
          },
          sync: {
            watch: true
          },
          extraPaths: ["/ABSOLUTE/PATH/TO/unified-memory-core/workspace"]
        }
      }
    ]
  }
}
```

If you keep memory files inside this repo, point `extraPaths` at the bundled
`workspace/` directory.

### Recommended Setup Order

Set things up in this order:

1. make sure OpenClaw memory indexing works
2. install and enable `unified-memory-core`
3. verify the plugin is loaded
4. only then start tuning plugin config

### Quick Verification

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "我爱吃什么"
```

### Config Keys

#### `enabled`

Turn the plugin on or off.

Default:

`true`

#### `openclawCommand`

Which `openclaw` binary to use for memory recall.

Default:

`"openclaw"`

#### `maxCandidates`

How many recall candidates are kept before reranking.

Default:

`18`

#### `maxSelectedChunks`

How many chunks can finally enter assembled context.

Default:

`4`

#### `maxChunksPerPath`

Limit repeated chunks from the same document.

Default:

`1`

#### `memoryBudgetRatio`

How much of the token budget is reserved for recalled memory.

Default:

`0.35`

#### `recentMessageCount`

How many recent conversation messages are always preserved.

Default:

`8`

#### `excludePaths`

Substring filters applied after recall. Useful for keeping engineering or plugin
repo noise out of user-facing memory context.

Default includes:

- `/unified-memory-core/`
- `/unified-memory-core/`
- `/openclaw-task-system/`
- `/node_modules/`
- `/.git/`

#### `queryRewrite`

Controls rule-based retrieval query rewriting.

Default:

```json5
{
  enabled: true,
  maxQueries: 4
}
```

Use this when you want more stable recall across different phrasings.

#### `memoryDistillation`

Controls async candidate-memory extraction from recent dialogue.

Default:

```json5
{
  enabled: true,
  triggerBeforeCompaction: true,
  preCompactTriggerRatio: 0.72,
  compactFallback: true,
  cooldownMs: 300000,
  sessionLimit: 8,
  outputDir: ""
}
```

Meaning:

- `triggerBeforeCompaction`: trigger asynchronously before compaction
- `preCompactTriggerRatio`: how close to compaction to start pre-triggering
- `compactFallback`: fire one async fallback when compaction actually happens
- `cooldownMs`: minimum gap between triggers for the same session/stage
- `sessionLimit`: how many recent session files the standalone distill command scans
- `outputDir`: optional custom output directory for candidate-memory reports

#### `llmRerank`

Controls optional second-stage reranking with a model.

Default:

```json5
{
  enabled: false,
  topN: 6,
  model: "gpt-5.4",
  provider: "",
  timeoutMs: 20000,
  maxSnippetChars: 900,
  minScoreDeltaToSkip: 0.18
}
```

Recommended rule:

- keep this off unless first-stage behavior is already understandable

#### `openclawAdapter`

Controls the OpenClaw-side governed export loading boundary.

Default:

```json5
{
  enabled: true,
  governedExports: {
    enabled: true,
    registryDir: "",
    workspaceId: "",
    agentWorkspaceIds: {},
    agentNamespace: {
      enabled: false
    },
    tenant: "local",
    scope: "workspace",
    resource: "openclaw-shared-memory",
    host: "",
    allowedVisibilities: ["private", "workspace", "shared", "public"],
    allowedStates: ["stable"],
    maxCandidates: 4
  }
}
```

Use this when you want the OpenClaw adapter to load governed stable exports from the local registry before merging with builtin recall results.

Important rule:

- `workspaceId` is the shared workspace layer for this plugin instance
- if you set only `workspaceId`, every OpenClaw agent still shares that workspace layer
- use `agentWorkspaceIds` when one agent, such as `code`, should move to a different workspace namespace without moving the others

Example:

```json5
{
  openclawAdapter: {
    governedExports: {
      workspaceId: "default-workspace",
      agentWorkspaceIds: {
        code: "code-workspace"
      },
      agentNamespace: {
        enabled: true
      }
    }
  }
}
```

If you enable `openclawAdapter.governedExports.agentNamespace.enabled`, OpenClaw uses a two-layer layout:

- shared workspace namespace: every agent can read it
- optional agent sub namespace: only the current agent reads it, and nightly self-learning writes agent-specific artifacts into it

Registry-root resolution now follows this order:

1. explicit `registryDir`
2. env `UMC_REGISTRY_DIR`
3. canonical host-neutral root: `~/.unified-memory-core/registry`
4. compatibility fallback: `~/.openclaw/unified-memory-core/registry`

This keeps existing OpenClaw local installs working while the repo moves toward a host-neutral canonical root.

Operator commands:

- inspect topology and findings:
  - `node scripts/unified-memory-core-cli.js registry inspect --format markdown`
- plan or apply non-destructive migration into the canonical root:
  - `node scripts/unified-memory-core-cli.js registry migrate --format markdown`
  - `node scripts/unified-memory-core-cli.js registry migrate --apply --format markdown`

#### `selfLearning`

Controls the plugin-level nightly self-learning pass.

Default:

```json5
{
  enabled: true,
  localTime: "00:00"
}
```

Behavior:

- scans recent OpenClaw session memory at local midnight
- derives governed long-term candidates from recent conversations
- runs the existing daily reflection pipeline
- auto-promotes stable candidates that pass the baseline threshold
- persists scheduler state and latest reflection reports under the local registry

Recommended rule:

- leave this on unless you explicitly do not want automatic governed learning

#### `weights`

Advanced first-stage heuristic weights.

Most users should not change these.

Current ranking intent is:

- relevance first
- recent session memory second
- `workspace/MEMORY.md` as the stable long-term floor

### Recommended Tuning Order

If you need to tune, do it in this order:

1. keep defaults first
2. adjust `excludePaths` if engineering noise enters recall
3. adjust `maxCandidates` and `maxSelectedChunks` if recall is too broad or too narrow
4. enable `llmRerank` only after first-stage behavior is already clear
5. tune `memoryDistillation.preCompactTriggerRatio` only if async extraction fires too early or too late
6. change `weights` only after you already have eval cases

### Common Recipes

#### I only want the plugin on

Use only:

- `enabled`
- `contextEngine`

Leave everything else on defaults.

#### I see too much engineering noise

Tune:

- `excludePaths`

#### I want broader recall before reranking

Tune:

- `maxCandidates`

#### I want fewer chunks entering final context

Tune:

- `maxSelectedChunks`
- `maxChunksPerPath`

#### I want to experiment with model rerank

Turn on:

- `llmRerank.enabled`

But do that only after non-LLM behavior is already understandable.

### Related Docs

- plugin overview:
  [README.md](README.md)
- system architecture:
  [system-architecture.md](system-architecture.md)
- project roadmap:
  [project-roadmap.md](project-roadmap.md)
- test suite:
  [testsuite.md](testsuite.md)

---
