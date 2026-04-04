# Context Assembly Claw

`context-assembly-claw` is an OpenClaw context-engine plugin focused on one job:
take already-indexed long memory and assemble better model context from it.

It keeps the existing OpenClaw memory index as the retrieval layer, then adds:

- candidate recall via `openclaw memory search --json`
- rule-based reranking tuned for `MEMORY.md`, `memory/`, and workspace docs
- optional LLM-assisted reranking through an OpenClaw subagent run
- token-budget-aware context packing
- safe fallback to runtime compaction

## What it is for

This plugin is useful when:

- long memory already works
- retrieval can find relevant snippets
- but the final context still needs better assembly and prioritization

## Use It Like An OpenClaw Plugin

This plugin is meant to feel like a normal OpenClaw plugin:

1. install it with `openclaw plugins install`
2. enable it in `~/.openclaw/openclaw.json`
3. keep using OpenClaw normally

After it is enabled, users do not need to run plugin-specific commands during
normal use. They just keep chatting with OpenClaw.

## Install

From the plugin directory:

```bash
openclaw plugins install -l .
```

Then point the `contextEngine` slot at `context-assembly-claw` in
`~/.openclaw/openclaw.json`.

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
          extraPaths: ["/ABSOLUTE/PATH/TO/YOUR-WORKSPACE"]
        }
      }
    ]
  },
  plugins: {
    allow: ["context-assembly-claw"],
    load: {
      paths: ["/ABSOLUTE/PATH/TO/context-assembly-claw"]
    },
    slots: {
      contextEngine: "context-assembly-claw"
    },
    entries: {
      "context-assembly-claw": {
        enabled: true,
        config: {
          enabled: true,
          maxCandidates: 18,
          maxSelectedChunks: 4,
          maxChunksPerPath: 1,
          memoryBudgetRatio: 0.35,
          recentMessageCount: 8,
          llmRerank: {
            enabled: false,
            topN: 6,
            model: "gpt-5.4",
            timeoutMs: 20000,
            maxSnippetChars: 900,
            minScoreDeltaToSkip: 0.18
          }
        }
      }
    }
  }
}
```

Template files are included here:

- [openclaw.context-assembly.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.example.json)
- [openclaw.context-assembly.llm-rerank.example.json](/Users/redcreen/Project/长记忆/context-assembly-claw/templates/openclaw.context-assembly.llm-rerank.example.json)

## Use

Once enabled:

- keep writing long-term rules in `MEMORY.md`
- keep writing daily notes in `memory/*.md`
- keep writing topic documents in your Workspace
- chat with OpenClaw as usual

The plugin runs automatically during context assembly. There is no extra user
command for normal use.

By default, the plugin excludes obvious engineering paths such as its own plugin
repo, `node_modules`, `.git`, and similar implementation directories from
post-retrieval candidates.

It also enables rule-based query rewrite by default, so one user question can
be recalled as a few nearby variants before reranking.

## Verify

Use OpenClaw-native checks first:

```bash
openclaw plugins list
openclaw memory status --json
openclaw memory search "你的测试问题"
```

If the plugin is installed and your memory search is healthy, the plugin can
start contributing assembled context automatically.

## Design

The engine follows a four-step pipeline:

1. recall candidates from the current agent memory index
2. rerank them with structure-aware heuristics
3. optionally rerank the top-N again with a model
4. pack selected snippets into `systemPromptAddition`

The original conversation messages stay mostly intact, and recent messages are
preserved first.

## Deployment note for local embeddings

If OpenClaw uses `memorySearch.provider = "local"` on macOS Apple Silicon, keep
runtime stability settings scoped to the Gateway service instead of putting them
in a user's shell profile.

Recommended approach:

- set `NODE_LLAMA_CPP_GPU=false` only for the OpenClaw Gateway process
- do not place this in `~/.zshrc` or other global shell startup files
- treat it as an operational default for the service, not a user-wide setting
- automate this with a repo-owned setup script instead of hand-editing plist files

Why:

- it avoids leaking local-embedding policy into unrelated terminals and tools
- it is easier to share across machines and document in setup steps
- it keeps the install reproducible for other users

For this machine, the setting currently lives in the launchd Gateway plist:

- [ai.openclaw.gateway.plist](/Users/redcreen/Library/LaunchAgents/ai.openclaw.gateway.plist)

From this repo, you can manage that setup with:

```bash
npm run runtime:check
npm run runtime:apply
npm run runtime:remove
```

What `runtime:apply` does:

- writes `NODE_LLAMA_CPP_GPU=false` into the Gateway launch agent environment
- rebuilds `node-llama-cpp` with `--gpu false`
- reloads the Gateway
- verifies `openclaw memory status --json`

## Optional Maintainer Scripts

The repo also includes helper scripts for maintainers and repeatable rollout.
These are optional convenience tools, not the primary user-facing plugin flow.

Config merge helper:

```bash
npm run config:apply -- --workspace /ABSOLUTE/PATH/TO/YOUR-WORKSPACE --preset safe-local
npm run config:apply -- --workspace /ABSOLUTE/PATH/TO/YOUR-WORKSPACE --preset llm-rerank
```

Preset intent:

- `safe-local`: stable local-memory setup, heuristic rerank only
- `llm-rerank`: same local-memory setup with second-stage model reranking enabled

Runtime helper:

```bash
npm run runtime:apply
npm run runtime:check
npm run runtime:remove
```

Suggested maintainer rollout on a new machine:

1. `openclaw plugins install -l .`
2. update `~/.openclaw/openclaw.json` manually or with `npm run config:apply`
3. run `npm run runtime:apply` if local embeddings need the CPU-safe runtime policy
4. verify with `openclaw plugins list` and `openclaw memory status --json`

For a one-off rerank-oriented smoke check without changing your installed config:

```bash
npm run smoke -- --preset safe-local "长期记忆和 Lossless 的区别"
npm run smoke:llm -- "长期记忆和 Lossless 的区别"
npm run smoke:compare -- "长期记忆和 Lossless 的区别"
```

The smoke output shows whether LLM rerank would currently be skipped because the
heuristic winner is already clearly ahead.

## Evaluate relevance quality

This repo includes a small golden dataset for retrieval quality checks:

```bash
npm run eval
npm run verify
```

It reports:

- `Recall@3`
- `Recall@5`
- `MRR`
- `nDCG@5`

The initial cases live in `evals/golden-cases.json`, so you can keep growing the
dataset as your memory base expands.

`npm run verify` is the maintainer-friendly regression pass. It runs:

- unit and integration tests
- golden-case evaluation
- preset comparison smoke for a representative query

## Notes

- The plugin uses the OpenClaw CLI for retrieval so it can reuse the current
  hybrid memory search stack.
- LLM reranking is optional and defaults to off.
- When LLM reranking is enabled, the plugin skips it when the heuristic winner
  is already clearly ahead, to avoid unnecessary latency and cost.
- Recall results are filtered by `excludePaths` after retrieval so engineering
  files do not accidentally enter user-facing context.
- Query recall supports `queryRewrite`, which expands one user query into a few
  stable variants before dedupe and reranking.
- Path diversity is enabled by default so one document does not monopolize the
  final assembled context.
- Compaction delegates safely to the OpenClaw runtime.
- The evaluation script is intentionally small and local-first so you can tune
  weights before introducing model-based reranking.
