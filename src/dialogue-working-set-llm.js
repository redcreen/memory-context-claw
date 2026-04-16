import { renderDialogueTurns } from "./dialogue-working-set-shadow.js";

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
