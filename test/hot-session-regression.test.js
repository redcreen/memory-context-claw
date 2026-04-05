import test from "node:test";
import assert from "node:assert/strict";

import { extractHotSessionMeta } from "../src/hot-session-regression.js";

test("extractHotSessionMeta marks hot main alias as non-isolated", () => {
  const meta = extractHotSessionMeta(
    {
      result: {
        meta: {
          agentMeta: {
            sessionId: "existing-main-session"
          }
        },
        systemPromptReport: {
          sessionKey: "agent:main:main"
        }
      }
    },
    "codex-agent-regression-123"
  );

  assert.equal(meta.observedSessionKey, "agent:main:main");
  assert.equal(meta.observedSessionId, "existing-main-session");
  assert.equal(meta.hotMainAlias, true);
  assert.equal(meta.matchedRequestedSessionId, false);
  assert.equal(meta.isolated, false);
});

test("extractHotSessionMeta treats matching non-main session as isolated", () => {
  const meta = extractHotSessionMeta(
    {
      result: {
        meta: {
          agentMeta: {
            sessionId: "codex-agent-regression-456"
          }
        },
        systemPromptReport: {
          sessionKey: "agent:main:telegram:direct:case-456"
        }
      }
    },
    "codex-agent-regression-456"
  );

  assert.equal(meta.hotMainAlias, false);
  assert.equal(meta.matchedRequestedSessionId, true);
  assert.equal(meta.isolated, true);
});

