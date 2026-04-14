import { normalizeWhitespace } from "../utils.js";

export const MEMORY_INTENT_CATEGORIES = [
  "none",
  "task_instruction",
  "session_constraint",
  "durable_rule",
  "tool_routing_preference",
  "user_profile_fact"
];

export const MEMORY_INTENT_DURABILITIES = ["none", "session", "durable"];

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = normalizeWhitespace(value);
  return normalized || fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeNumber(value, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeStringArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values.map((value) => normalizeString(value)).filter(Boolean);
}

function normalizeOptionalObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return { ...value };
}

function normalizeStructuredRule(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const trigger = normalizeOptionalObject(value.trigger) || {};
  const action = normalizeOptionalObject(value.action) || {};
  const contentKind = normalizeString(trigger.contentKind || trigger.content_kind);
  const domains = normalizeStringArray(trigger.domains);
  const tool = normalizeString(action.tool);

  if (!contentKind && domains.length === 0 && !tool) {
    return null;
  }

  return {
    trigger: {
      content_kind: contentKind,
      domains
    },
    action: {
      tool
    }
  };
}

export function determineMemoryIntentAdmission(input = {}) {
  const shouldWriteMemory = normalizeBoolean(
    input.shouldWriteMemory ?? input.should_write_memory,
    false
  );
  const category = normalizeString(input.category, "none");
  const durability = normalizeString(input.durability, "none");
  const confidence = Math.max(0, Math.min(1, normalizeNumber(input.confidence, 0)));

  if (!shouldWriteMemory || category === "none" || durability === "none") {
    return "skip";
  }
  if (category === "task_instruction") {
    return "observation_task_instruction";
  }
  if (category === "session_constraint" || durability === "session") {
    return "observation_session";
  }
  if (confidence < 0.75) {
    return "observation_low_confidence";
  }
  if (category === "tool_routing_preference" || category === "durable_rule") {
    return "candidate_rule";
  }
  if (category === "user_profile_fact") {
    return "candidate_profile";
  }
  return "candidate_generic";
}

export function parseMemoryIntentExtraction(input = {}) {
  const category = normalizeString(input.category, "none");
  if (!MEMORY_INTENT_CATEGORIES.includes(category)) {
    throw new TypeError(
      `memory_intent.category must be one of ${MEMORY_INTENT_CATEGORIES.join(", ")}`
    );
  }

  const durability = normalizeString(input.durability, "none");
  if (!MEMORY_INTENT_DURABILITIES.includes(durability)) {
    throw new TypeError(
      `memory_intent.durability must be one of ${MEMORY_INTENT_DURABILITIES.join(", ")}`
    );
  }

  const structuredRule = normalizeStructuredRule(
    input.structuredRule || input.structured_rule
  );
  const parsed = {
    should_write_memory: normalizeBoolean(
      input.shouldWriteMemory ?? input.should_write_memory,
      false
    ),
    category,
    durability,
    confidence: Math.max(0, Math.min(1, normalizeNumber(input.confidence, 0))),
    summary: normalizeString(input.summary),
    user_message: normalizeString(input.userMessage || input.user_message),
    assistant_reply: normalizeString(
      input.assistantReply
        || input.assistant_reply
        || input.userVisibleReply
        || input.user_visible_reply
    ),
    structured_rule: structuredRule,
    metadata: normalizeOptionalObject(input.metadata)
  };

  parsed.admission_route = determineMemoryIntentAdmission(parsed);
  return parsed;
}

export function renderMemoryIntentText(memoryIntent) {
  const structuredRule = memoryIntent.structured_rule || {};
  const trigger = structuredRule.trigger || {};
  const action = structuredRule.action || {};
  const lines = [
    `memory intent category: ${memoryIntent.category}`,
    `memory intent durability: ${memoryIntent.durability}`,
    `memory intent confidence: ${memoryIntent.confidence.toFixed(2)}`,
    `memory intent admission route: ${memoryIntent.admission_route}`,
    `memory summary: ${memoryIntent.summary}`
  ];

  if (memoryIntent.user_message) {
    lines.push(`user message: ${memoryIntent.user_message}`);
  }
  if (memoryIntent.assistant_reply) {
    lines.push(`assistant visible reply: ${memoryIntent.assistant_reply}`);
  }
  if (trigger.content_kind) {
    lines.push(`trigger content kind: ${trigger.content_kind}`);
  }
  if (Array.isArray(trigger.domains) && trigger.domains.length > 0) {
    lines.push(`trigger domains: ${trigger.domains.join(", ")}`);
  }
  if (action.tool) {
    lines.push(`action tool: ${action.tool}`);
  }

  return lines.join("\n");
}
