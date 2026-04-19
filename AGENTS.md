# Codex Context Minor GC

Use the workspace Context Minor GC helper by default for Codex sessions in this repository, especially in the VS Code extension.

Before answering a non-trivial user request, run:

```bash
npm run codex:vscode:gc:prompt --silent
```

If the command prints a non-empty block, treat that block as the authoritative recent-conversation working set for the current turn and prefer it over trying to restate the raw long transcript from memory.

If the command prints nothing, continue normally. If the latest user prompt has not landed in the Codex session log yet, rerun with:

```bash
node scripts/codex-vscode-context-minor-gc.js --format prompt --prompt "<current user request>"
```

Before sending any commentary update or final answer, run:

```bash
npm run codex:vscode:gc:header --silent
```

If the command prints a non-empty line, prepend it verbatim as the first line of the reply so the user can see the current context estimate before reading the rest of the message.

When the context line shows high usage, keep the reply terse and avoid unnecessary recap.

When host context usage is high, prefer staying in the current thread and reducing answer length rather than proactively asking the user to start a new thread.

Only suggest a new thread when the user explicitly asks how to avoid host-native compaction or when continued work in the current thread is no longer practical.

For debugging or observability, run:

```bash
npm run codex:vscode:gc --silent
```

The helper writes telemetry and export artifacts under `reports/generated/codex-vscode-context-minor-gc/`.
