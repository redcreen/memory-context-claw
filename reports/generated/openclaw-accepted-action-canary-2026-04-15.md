# OpenClaw Accepted-Action Host Canary Report

Date: `2026-04-15`  
Target: `unified-memory-core v0.2.1`  
Host: real local `OpenClaw` runtime  
Result: `pass`

## Summary

This report verifies the strictest accepted-action path on the real host:

1. a real OpenClaw tool executes
2. the host emits `after_tool_call`
3. `unified-memory-core` captures the structured `accepted_action`
4. the canonical registry receives the source and reflection outputs automatically

This run no longer depends on `style-engine`.

Instead, `unified-memory-core` now provides a dedicated tool:

- `umc_emit_accepted_action_canary`

That tool is:

- disabled by default
- registered only when `openclawAdapter.debug.canaryTool = true`
- intended only for host verification, not daily usage

After the canary run, the debug switch was turned back off and the tool disappeared from the normal host tool list.

## What Changed

The host verification path now uses a tool that lives inside `unified-memory-core` itself.

Relevant files:

- [src/config.js](../../src/config.js)
- [src/plugin/index.js](../../src/plugin/index.js)
- [openclaw.plugin.json](../../openclaw.plugin.json)
- [test/openclaw-plugin-accepted-action.test.js](../../test/openclaw-plugin-accepted-action.test.js)

Behavior:

- default: canary tool is not registered
- debug mode: canary tool is registered and can be called through the real host

## Validation Steps

### 1. Unit Coverage

Executed:

```bash
node --test test/openclaw-plugin-accepted-action.test.js
git diff --check
```

Result:

- `3 / 3` tests passed
- no patch formatting errors

The test suite now covers:

- `after_tool_call` accepted-action capture
- ignoring unstructured tool outputs
- debug-only canary tool payload generation

### 2. Host Deployment

Executed:

```bash
npm run deploy:local
```

Result:

- current workspace deployed to `~/.openclaw/extensions/unified-memory-core`

### 3. Debug-Only Host Registration

The local host config was temporarily updated with:

```json
{
  "openclawAdapter": {
    "debug": {
      "canaryTool": true
    }
  }
}
```

Then the host was reloaded and inspected:

```bash
openclaw plugins inspect unified-memory-core --json
```

Confirmed:

- plugin status: `loaded`
- version: `0.2.1`
- typed hook: `after_tool_call`
- tool registered: `umc_emit_accepted_action_canary`

### 4. Real End-to-End Host Canary

Executed through the real host:

```bash
openclaw agent --agent main --local --thinking off --json --message "Call umc_emit_accepted_action_canary exactly once ... After the tool returns, reply only with DONE."
```

Canary id:

- `umc-host-canary-1776220410`

Observed host result:

- agent final reply: `DONE`
- host log included:

```text
[unified-memory-core] openclaw accepted_action captured (tool=umc_emit_accepted_action_canary, namespace=local:workspace:openclaw-shared-memory:default-workspace.agent.main, promoted=0)
```

Registry counters changed:

- `records.jsonl`: `159 -> 162`
- `decision-trails.jsonl`: `111 -> 113`

## Registry Evidence

Canonical registry:

- `~/.unified-memory-core/registry`

Recorded artifacts:

- source artifact: [records.jsonl](/Users/redcreen/.unified-memory-core/registry/records.jsonl:160)
- outcome candidate 1: [records.jsonl](/Users/redcreen/.unified-memory-core/registry/records.jsonl:161)
- outcome candidate 2: [records.jsonl](/Users/redcreen/.unified-memory-core/registry/records.jsonl:162)
- decision trail 1: [decision-trails.jsonl](/Users/redcreen/.unified-memory-core/registry/decision-trails.jsonl:112)
- decision trail 2: [decision-trails.jsonl](/Users/redcreen/.unified-memory-core/registry/decision-trails.jsonl:113)

What those records show:

- `declared_by = openclaw-plugin:umc_emit_accepted_action_canary`
- `source_type = accepted_action`
- the host did not require any external tool payload from `style-engine`
- reflection labeled the outputs as `outcome_artifact`
- outputs were kept as `observation`

## Why `promoted=0` Is Correct

This canary deliberately emits only one-off outcomes:

- one external target URL
- one artifact path

Those are not reusable long-term facts, so the correct policy result is:

- capture source
- generate outcome candidates
- keep them in observation
- do not promote to stable

So `promoted=0` is expected and correct here.

## Debug Switch Rollback

After the canary completed, the local host config was restored:

- `openclawAdapter.debug.canaryTool = false`

Host inspect then showed:

- `toolNames = []`

This confirms the canary tool does not remain available in normal daily runtime.

## Final Conclusion

The accepted-action host canary is now verified end-to-end on the real OpenClaw host.

Proven:

- `unified-memory-core` can expose a dedicated host verification tool
- that tool can run through real `openclaw agent`
- the host fires `after_tool_call`
- `unified-memory-core` captures the structured `accepted_action`
- the canonical registry is updated automatically
- the tool can be kept out of normal runtime by default

This closes the earlier gap where end-to-end verification depended on modifying `style-engine`.
