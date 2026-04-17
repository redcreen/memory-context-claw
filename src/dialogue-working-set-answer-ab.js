function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

export function includesAny(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  const haystack = String(text || "").toLowerCase();
  return patterns.some((pattern) => haystack.includes(String(pattern || "").toLowerCase()));
}

export function includesAll(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  const haystack = String(text || "").toLowerCase();
  return patterns.every((pattern) => haystack.includes(String(pattern || "").toLowerCase()));
}

export function excludesAll(text, patterns = []) {
  if (!patterns.length) {
    return true;
  }
  const haystack = String(text || "").toLowerCase();
  return patterns.every((pattern) => !haystack.includes(String(pattern || "").toLowerCase()));
}

export function evaluateAnswer(caseDef, answerText) {
  const checks = [
    {
      name: "expected_any",
      passed: includesAny(answerText, caseDef.expectedAny || []),
      expected: caseDef.expectedAny || [],
      actual: answerText
    },
    {
      name: "expected_all",
      passed: includesAll(answerText, caseDef.expectedAll || []),
      expected: caseDef.expectedAll || [],
      actual: answerText
    },
    {
      name: "forbidden_any",
      passed: excludesAll(answerText, caseDef.forbiddenAny || []),
      expected: caseDef.forbiddenAny || [],
      actual: answerText
    }
  ];

  return {
    passed: checks.every((item) => item.passed),
    checks
  };
}

export function buildAnswerSchema() {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    additionalProperties: false,
    required: ["answer"],
    properties: {
      answer: {
        type: "string"
      }
    }
  };
}

export function buildAnswerPrompt(caseDef, contextText) {
  return [
    "Answer the latest user message using only the context below.",
    "Do not use tools, shell commands, or repository inspection.",
    "If the conversation context is insufficient, answer exactly: I don't know based on current context.",
    "",
    `Case: ${normalizeString(caseDef?.id, "runtime-shadow-export")}`,
    `Description: ${normalizeString(caseDef?.description, "runtime shadow replay export")}`,
    "",
    "Context:",
    String(contextText || "")
  ].join("\n");
}

export function buildTranscriptText(turns = []) {
  return (Array.isArray(turns) ? turns : [])
    .map((turn) => `${normalizeString(turn?.id)} ${normalizeString(turn?.role)}: ${normalizeString(turn?.content)}`)
    .filter(Boolean)
    .join("\n");
}

export function buildBaselineAnswerPrompt(caseDef) {
  return buildAnswerPrompt(caseDef, buildTranscriptText(caseDef?.transcript || []));
}

export function buildShadowAnswerPrompt(caseDef, snapshot = {}) {
  return buildAnswerPrompt(
    caseDef,
    normalizeString(snapshot?.shadowPackageText)
    || normalizeString(snapshot?.shadowRawTranscript)
    || "(none)"
  );
}

export function classifyAnswerAbOutcome(item = {}) {
  const baseline = item.baseline?.passed === true;
  const shadow = item.shadow?.passed === true;
  if (baseline && shadow) return "both_pass";
  if (!baseline && shadow) return "shadow_only";
  if (baseline && !shadow) return "baseline_only";
  return "both_fail";
}
