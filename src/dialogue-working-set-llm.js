import { renderDialogueTurns } from "./dialogue-working-set-shadow.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeIdList(values) {
  return Array.isArray(values)
    ? [...new Set(values.map((item) => normalizeString(item)).filter(Boolean))]
    : [];
}

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const direct = trimmed.match(/\{[\s\S]*\}$/);
  if (direct) {
    return direct[0];
  }
  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  return fenced ? fenced[1] : trimmed;
}

export function buildWorkingSetDecisionPrompt(caseDef) {
  const transcript = renderDialogueTurns(caseDef.transcript);

  return [
    "You are producing one hidden runtime decision for a chat system.",
    "Do not use tools, shell commands, or repository inspection.",
    "Use only the transcript provided below and return the final structured decision directly.",
    "",
    "Goal:",
    "- shrink the NEXT-TURN raw prompt working set when earlier topics are resolved or irrelevant",
    "- never delete the session log",
    "- preserve unresolved tasks and still-relevant topic context",
    "- preserve durable user facts, preferences, and rules as semantic pins when raw turns can leave the prompt",
    "",
    "Important constraints:",
    "- the latest user turn is always kept by the runtime; do not list it in evict_turn_ids",
    "- pin_turn_ids means the semantic content should survive as a compact pin or capsule even if the raw turn is evicted",
    "- use relation=continue for the same active topic",
    "- use relation=branch for a side question while an older task is still open",
    "- use relation=switch when the active topic changed and the old raw block can leave the next-turn prompt",
    "- use relation=resolve when the conversation mostly closes and only pins + the latest user turn should remain",
    "- for continue: keep the raw turns that the latest user question still depends on; do not demote active-topic evidence into pin-only form",
    "- for branch: the older unfinished main task should stay as raw turns, not only as pins",
    "- unresolved tasks should remain raw until resolved; pins are for durable facts or archived older topics",
    "- on switch: durable user facts, preferences, and style rules may move from raw turns into pins so the new topic can travel lighter",
    "- be strict: off-topic status snapshots and solved blocks are good eviction candidates",
    "",
    `Case: ${caseDef.id}`,
    `Description: ${caseDef.description}`,
    "",
    "Transcript:",
    transcript
  ].join("\n");
}

export function buildWorkingSetDecisionSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    required: [
      "relation",
      "confidence",
      "evict_turn_ids",
      "pin_turn_ids",
      "archive_summary",
      "reasoning_summary"
    ],
    properties: {
      relation: {
        type: "string",
        enum: ["continue", "branch", "switch", "resolve"]
      },
      confidence: {
        type: "number"
      },
      evict_turn_ids: {
        type: "array",
        items: { type: "string" }
      },
      pin_turn_ids: {
        type: "array",
        items: { type: "string" }
      },
      archive_summary: {
        type: "string"
      },
      reasoning_summary: {
        type: "string"
      }
    }
  };
}

export function normalizeWorkingSetDecisionPayload(payload = {}) {
  const relation = normalizeString(payload?.relation, "continue");

  return {
    relation: ["continue", "branch", "switch", "resolve"].includes(relation)
      ? relation
      : "continue",
    confidence: Number(payload?.confidence || 0),
    evict_turn_ids: normalizeIdList(payload?.evict_turn_ids),
    pin_turn_ids: normalizeIdList(payload?.pin_turn_ids),
    archive_summary: normalizeString(payload?.archive_summary),
    reasoning_summary: normalizeString(payload?.reasoning_summary)
  };
}

export function parseWorkingSetDecisionResponse(text = "") {
  return normalizeWorkingSetDecisionPayload(JSON.parse(extractJson(text)));
}
