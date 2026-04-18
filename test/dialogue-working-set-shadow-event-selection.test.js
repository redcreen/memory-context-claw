import test from "node:test";
import assert from "node:assert/strict";

import {
  pickDialogueWorkingSetShadowEvent,
  sortDialogueWorkingSetShadowEvents
} from "../src/dialogue-working-set-shadow-event-selection.js";

test("sortDialogueWorkingSetShadowEvents sorts by generated_at", () => {
  const sorted = sortDialogueWorkingSetShadowEvents([
    { generated_at: "2026-04-18T02:00:10.000Z", status: "skipped" },
    { generated_at: "2026-04-18T02:00:02.000Z", status: "captured" },
    { generated_at: "2026-04-18T02:00:05.000Z", status: "error" }
  ]);

  assert.deepEqual(sorted.map((item) => item.generated_at), [
    "2026-04-18T02:00:02.000Z",
    "2026-04-18T02:00:05.000Z",
    "2026-04-18T02:00:10.000Z"
  ]);
});

test("pickDialogueWorkingSetShadowEvent prefers the latest captured event for the final query", () => {
  const picked = pickDialogueWorkingSetShadowEvent([
    {
      generated_at: "2026-04-18T02:10:12.795Z",
      session_key: "agent:main:main",
      query: "final question",
      status: "captured",
      reason: ""
    },
    {
      generated_at: "2026-04-18T02:11:17.182Z",
      session_key: "agent:main:main",
      query: "final question",
      status: "skipped",
      reason: "not_enough_turns"
    }
  ], {
    sessionKey: "agent:main:final-shadow",
    query: "final question"
  });

  assert.equal(picked?.status, "captured");
  assert.equal(picked?.generated_at, "2026-04-18T02:10:12.795Z");
});

test("pickDialogueWorkingSetShadowEvent falls back to the latest non-skipped query event when no capture exists", () => {
  const picked = pickDialogueWorkingSetShadowEvent([
    {
      generated_at: "2026-04-18T02:12:30.709Z",
      session_key: "agent:main:main",
      query: "final question",
      status: "error",
      reason: "transport failed"
    },
    {
      generated_at: "2026-04-18T02:12:57.443Z",
      session_key: "agent:main:main",
      query: "middle question",
      status: "skipped",
      reason: "not_enough_turns"
    }
  ], {
    query: "final question"
  });

  assert.equal(picked?.status, "error");
  assert.equal(picked?.query, "final question");
});
