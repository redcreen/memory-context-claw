import { createHash } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createNamespaceKey,
  parsePolicyInputArtifact
} from "./contracts.js";
import { inferLearningSignalType, isLearningArtifact } from "./learning-lifecycle.js";

export const POLICY_INPUT_CONTRACT_VERSION = "policy-input/v1";

const COMPACT_PATTERNS = [
  /\b(concise|brief|short|terse|minimal)\b/iu,
  /简洁/u,
  /简短/u,
  /精简/u,
  /少废话/u
];

const HARD_CODE_PATTERNS = [
  /\bhardcod(?:e|ed|ing)\b/iu,
  /硬编码/u
];

const TEST_PATTERNS = [
  /\btest(?:s|ing|-driven)?\b/iu,
  /测试/u
];

const DOC_PATTERNS = [
  /\b(doc|docs|documentation)\b/iu,
  /文档/u
];

const TERMINAL_PATTERNS = [
  /\bterminal\b/iu,
  /\bcli\b/iu,
  /\bcommand line\b/iu,
  /终端/u,
  /命令行/u
];

const PROGRESS_PATTERNS = [
  /\bprogress\b/iu,
  /\bstatus\b/iu,
  /\bupdate\b/iu,
  /进展/u,
  /汇报/u,
  /状态/u
];

const EN_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "user",
  "users",
  "prefers",
  "prefer",
  "should",
  "must",
  "keep",
  "from",
  "into",
  "after",
  "before",
  "when",
  "then",
  "them",
  "they",
  "their",
  "your",
  "you",
  "use",
  "using",
  "only",
  "more",
  "less",
  "just"
]);

function normalizeString(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeText(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[`"'“”‘’]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function clampNumber(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Number(value)));
}

function uniqueStrings(values) {
  return [...new Set(
    (Array.isArray(values) ? values : [])
      .map((item) => normalizeString(item))
      .filter(Boolean)
  )];
}

function createFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function extractTerms(text) {
  const normalized = normalizeText(text);
  const tokens = normalized.match(/[\p{L}\p{N}_-]{2,}/gu) || [];
  return uniqueStrings(
    tokens.filter((token) => !EN_STOPWORDS.has(token) && !/^\d+$/u.test(token))
  ).slice(0, 8);
}

function includesAnyPattern(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function derivePolicyKind({ signalType, polarity, text }) {
  if (signalType === "fact") {
    return "fact_priority";
  }
  if (polarity === "negative" || includesAnyPattern(text, HARD_CODE_PATTERNS)) {
    return "guardrail";
  }
  if (includesAnyPattern(text, COMPACT_PATTERNS) || includesAnyPattern(text, PROGRESS_PATTERNS)) {
    return "presentation";
  }
  if (
    includesAnyPattern(text, TEST_PATTERNS)
    || includesAnyPattern(text, DOC_PATTERNS)
    || includesAnyPattern(text, TERMINAL_PATTERNS)
  ) {
    return "workflow";
  }
  return "context_bias";
}

function derivePolicyEffects({ artifact, consumer }) {
  const text = `${normalizeString(artifact.title)}\n${normalizeString(artifact.summary)}`;
  const normalizedText = normalizeText(text);
  const signalType = inferLearningSignalType(artifact);
  const polarity = normalizeString(artifact.attributes?.learning_polarity) || "neutral";
  const queryMatchTerms = [
    ...extractTerms(artifact.title),
    ...extractTerms(artifact.summary)
  ];
  const instructions = [normalizeString(artifact.summary)];
  const avoidPatterns = [];
  const preferPatterns = [];

  let responseStyle = "default";
  let supportingContextMode = "default";
  let recommendedMaxSelectedChunks = null;
  let recommendedMaxMemoryItems = null;
  let factPriority = signalType === "fact";

  if (includesAnyPattern(normalizedText, COMPACT_PATTERNS)) {
    responseStyle = "concise";
    supportingContextMode = "compact";
    recommendedMaxSelectedChunks = 3;
    recommendedMaxMemoryItems = 4;
    instructions.push("Prefer concise supporting context and concise output.");
    queryMatchTerms.push("concise", "brief", "progress", "update");
  }

  if (includesAnyPattern(normalizedText, HARD_CODE_PATTERNS)) {
    avoidPatterns.push("hardcode", "hardcoded", "hardcoding", "硬编码");
    instructions.push("Avoid hardcoded or brittle implementation choices.");
    queryMatchTerms.push("hardcode");
  }

  if (includesAnyPattern(normalizedText, TEST_PATTERNS)) {
    preferPatterns.push("test", "tests", "testing", "测试");
    instructions.push("Prefer adding or updating tests when behavior changes.");
    queryMatchTerms.push("test");
  }

  if (includesAnyPattern(normalizedText, DOC_PATTERNS)) {
    preferPatterns.push("doc", "docs", "documentation", "文档");
    instructions.push("Keep documentation aligned when behavior changes.");
    queryMatchTerms.push("docs", "documentation");
  }

  if (includesAnyPattern(normalizedText, TERMINAL_PATTERNS)) {
    preferPatterns.push("terminal", "cli", "command", "终端", "命令行");
    instructions.push("Prefer terminal-first or scriptable workflows.");
    queryMatchTerms.push("terminal", "cli");
  }

  if (includesAnyPattern(normalizedText, PROGRESS_PATTERNS)) {
    instructions.push("Keep progress updates direct and compact.");
    queryMatchTerms.push("progress", "status", "update", "进展");
  }

  if (signalType === "fact") {
    instructions.push("Treat this as a governed stable fact when directly relevant.");
    recommendedMaxSelectedChunks = recommendedMaxSelectedChunks ?? 4;
    recommendedMaxMemoryItems = recommendedMaxMemoryItems ?? 5;
  }

  const rankingBase = {
    rule: 0.18,
    preference: 0.16,
    fact: 0.14,
    habit: 0.12,
    question: 0.08,
    observation: 0.08
  }[signalType] ?? 0.1;

  const rankingWeight = clampNumber(
    rankingBase
      + (polarity === "negative" ? 0.02 : 0)
      + (artifact.attributes?.explicit_remember_signal === true ? 0.04 : 0),
    0.04,
    0.32,
    0.12
  );

  if (consumer === "codex" && responseStyle === "concise") {
    instructions.push("Optimize for concise, high-signal task memory.");
  }
  if (consumer === "openclaw" && supportingContextMode === "compact") {
    instructions.push("Do not inflate retrieved supporting context.");
  }

  return {
    ranking_weight: rankingWeight,
    response_style: responseStyle,
    supporting_context_mode: supportingContextMode,
    recommended_max_selected_chunks: recommendedMaxSelectedChunks,
    recommended_max_memory_items: recommendedMaxMemoryItems,
    avoid_patterns: uniqueStrings(avoidPatterns),
    prefer_patterns: uniqueStrings(preferPatterns),
    instructions: uniqueStrings(instructions),
    fact_priority: factPriority,
    query_match_terms: uniqueStrings(queryMatchTerms)
  };
}

function comparePolicyInputs(left, right) {
  const leftPriority = Number(left.effects?.ranking_weight || 0);
  const rightPriority = Number(right.effects?.ranking_weight || 0);
  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }
  if (left.confidence !== right.confidence) {
    return right.confidence - left.confidence;
  }
  return String(left.source_artifact_id).localeCompare(String(right.source_artifact_id));
}

function buildRollbackStatus({
  invalidCount,
  truncated,
  rollbackOnError,
  validCount
}) {
  if (rollbackOnError && invalidCount > 0 && validCount === 0) {
    return "disabled";
  }
  if (invalidCount > 0 || truncated) {
    return "reduced";
  }
  return "ok";
}

function computePolicyMatchScore(policyInput, text) {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return 0;
  }

  const matchTerms = uniqueStrings([
    ...(Array.isArray(policyInput.query_match_terms) ? policyInput.query_match_terms : []),
    ...((Array.isArray(policyInput.effects?.prefer_patterns) ? policyInput.effects.prefer_patterns : [])),
    ...((Array.isArray(policyInput.effects?.avoid_patterns) ? policyInput.effects.avoid_patterns : []))
  ]);

  if (matchTerms.length === 0) {
    return normalizedText.includes(normalizeText(policyInput.statement)) ? 1 : 0;
  }

  let hits = 0;
  for (const term of matchTerms) {
    if (normalizedText.includes(normalizeText(term))) {
      hits += 1;
    }
  }
  return hits / matchTerms.length;
}

function summarizePolicyInputs(policyInputs) {
  const summary = {
    policy_input_count: policyInputs.length,
    compact_mode_inputs: 0,
    guardrail_inputs: 0,
    fact_priority_inputs: 0,
    response_style: "default",
    supporting_context_mode: "default",
    recommended_max_selected_chunks: null,
    recommended_max_memory_items: null,
    avoid_patterns: [],
    prefer_patterns: []
  };

  for (const policyInput of policyInputs) {
    if (policyInput.effects?.supporting_context_mode === "compact") {
      summary.compact_mode_inputs += 1;
      summary.supporting_context_mode = "compact";
    }
    if (policyInput.policy_kind === "guardrail") {
      summary.guardrail_inputs += 1;
    }
    if (policyInput.effects?.fact_priority === true) {
      summary.fact_priority_inputs += 1;
    }
    if (policyInput.effects?.response_style === "concise") {
      summary.response_style = "concise";
    }
    if (Number.isFinite(policyInput.effects?.recommended_max_selected_chunks)) {
      summary.recommended_max_selected_chunks = summary.recommended_max_selected_chunks === null
        ? Number(policyInput.effects.recommended_max_selected_chunks)
        : Math.min(
            summary.recommended_max_selected_chunks,
            Number(policyInput.effects.recommended_max_selected_chunks)
          );
    }
    if (Number.isFinite(policyInput.effects?.recommended_max_memory_items)) {
      summary.recommended_max_memory_items = summary.recommended_max_memory_items === null
        ? Number(policyInput.effects.recommended_max_memory_items)
        : Math.min(
            summary.recommended_max_memory_items,
            Number(policyInput.effects.recommended_max_memory_items)
          );
    }
    summary.avoid_patterns.push(...(policyInput.effects?.avoid_patterns || []));
    summary.prefer_patterns.push(...(policyInput.effects?.prefer_patterns || []));
  }

  summary.avoid_patterns = uniqueStrings(summary.avoid_patterns);
  summary.prefer_patterns = uniqueStrings(summary.prefer_patterns);

  return summary;
}

export function buildPolicyInputArtifact({ artifact, consumer }) {
  const effects = derivePolicyEffects({ artifact, consumer });
  const signalType = inferLearningSignalType(artifact);
  const polarity = normalizeString(artifact.attributes?.learning_polarity) || "neutral";
  const confidence = clampNumber(
    Number(artifact.attributes?.promotion_score ?? artifact.confidence ?? 0.75),
    0,
    1,
    0.75
  );
  const policyInput = {
    policy_input_id: `policy_input:${consumer}:${artifact.artifact_id}`,
    contract_version: SHARED_CONTRACT_VERSION,
    policy_contract_version: POLICY_INPUT_CONTRACT_VERSION,
    consumer,
    namespace: artifact.namespace,
    source_artifact_id: artifact.artifact_id,
    source_fingerprint: artifact.fingerprint,
    signal_type: signalType,
    policy_kind: derivePolicyKind({
      signalType,
      polarity,
      text: `${artifact.title}\n${artifact.summary}`
    }),
    polarity,
    title: artifact.title,
    statement: artifact.summary,
    confidence,
    query_match_terms: effects.query_match_terms,
    effects: {
      ranking_weight: effects.ranking_weight,
      response_style: effects.response_style,
      supporting_context_mode: effects.supporting_context_mode,
      recommended_max_selected_chunks: effects.recommended_max_selected_chunks,
      recommended_max_memory_items: effects.recommended_max_memory_items,
      avoid_patterns: effects.avoid_patterns,
      prefer_patterns: effects.prefer_patterns,
      instructions: effects.instructions,
      fact_priority: effects.fact_priority
    },
    evidence_refs: Array.isArray(artifact.evidence_refs) ? artifact.evidence_refs : [],
    rollback: {
      mode: "ignore_policy_input",
      rollback_key: `rollback:${consumer}:${artifact.artifact_id}`,
      fallback_action: "ignore_policy_inputs_on_validation_failure"
    },
    metadata: {
      namespace_key: createNamespaceKey(artifact.namespace),
      source_candidate_id: normalizeString(artifact.source_candidate_id),
      visibility: normalizeString(artifact.visibility),
      learning_topic_signature: normalizeString(artifact.attributes?.learning_topic_signature),
      export_hints: Array.isArray(artifact.export_hints) ? artifact.export_hints : []
    },
    created_at: artifact.updated_at || artifact.created_at
  };

  return parsePolicyInputArtifact(policyInput);
}

export function buildPolicyProjection({
  artifacts,
  consumer
}) {
  const learningArtifacts = (Array.isArray(artifacts) ? artifacts : [])
    .filter((artifact) => isLearningArtifact(artifact))
    .map((artifact) => buildPolicyInputArtifact({ artifact, consumer }))
    .sort(comparePolicyInputs);

  const policySummary = summarizePolicyInputs(learningArtifacts);
  const policyFingerprint = createFingerprint({
    consumer,
    source_artifact_ids: learningArtifacts.map((item) => item.source_artifact_id),
    source_fingerprints: learningArtifacts.map((item) => item.source_fingerprint),
    policy_kinds: learningArtifacts.map((item) => item.policy_kind)
  });

  return {
    consumer,
    policy_inputs: learningArtifacts,
    policy_summary: policySummary,
    policy_fingerprint: policyFingerprint,
    policy_contract_version: POLICY_INPUT_CONTRACT_VERSION,
    rollback: {
      status: "ok",
      reason_codes: [],
      fallback_action: "ignore_policy_inputs_on_validation_failure"
    }
  };
}

export function renderPolicyBlock(policyContext, { audience = "consumer" } = {}) {
  if (!policyContext?.enabled || !Array.isArray(policyContext.policy_inputs) || policyContext.policy_inputs.length === 0) {
    return "";
  }

  const lines = [];
  lines.push(`## Governed Policy Guidance (${audience})`);
  for (const policyInput of policyContext.policy_inputs) {
    lines.push(`- ${policyInput.statement}`);
    for (const instruction of policyInput.effects?.instructions || []) {
      if (instruction === policyInput.statement) {
        continue;
      }
      lines.push(`- ${instruction}`);
    }
  }
  return uniqueStrings(lines).join("\n");
}

export function createPolicyContext({
  exportResults = [],
  consumer = "generic",
  maxPolicyInputs = 8,
  rollbackOnError = true
} = {}) {
  const artifactRefs = new Set(
    exportResults.flatMap((exportResult) =>
      Array.isArray(exportResult?.exportContract?.artifact_refs)
        ? exportResult.exportContract.artifact_refs
        : []
    )
  );
  const rawInputs = exportResults.flatMap((exportResult) =>
    Array.isArray(exportResult?.payload?.policy_inputs)
      ? exportResult.payload.policy_inputs
      : []
  );
  const invalidInputs = [];
  const validInputs = [];
  const seen = new Set();

  for (const rawInput of rawInputs) {
    try {
      const parsed = parsePolicyInputArtifact(rawInput);
      if (parsed.consumer !== consumer) {
        invalidInputs.push({
          policy_input_id: parsed.policy_input_id,
          reason: "consumer_mismatch"
        });
        continue;
      }
      if (artifactRefs.size > 0 && !artifactRefs.has(parsed.source_artifact_id)) {
        invalidInputs.push({
          policy_input_id: parsed.policy_input_id,
          reason: "missing_source_artifact_ref"
        });
        continue;
      }
      if (seen.has(parsed.policy_input_id)) {
        continue;
      }
      seen.add(parsed.policy_input_id);
      validInputs.push(parsed);
    } catch (error) {
      invalidInputs.push({
        policy_input_id: normalizeString(rawInput?.policy_input_id) || "unknown",
        reason: String(error?.message || error)
      });
    }
  }

  const limit = clampNumber(maxPolicyInputs, 1, 20, 8);
  const sortedInputs = validInputs.sort(comparePolicyInputs);
  const truncated = sortedInputs.length > limit;
  const policyInputs = sortedInputs.slice(0, limit);
  const summary = summarizePolicyInputs(policyInputs);
  const reasonCodes = [];
  if (invalidInputs.length > 0) {
    reasonCodes.push("invalid_policy_inputs_dropped");
  }
  if (truncated) {
    reasonCodes.push("policy_input_limit_applied");
  }
  const status = buildRollbackStatus({
    invalidCount: invalidInputs.length,
    truncated,
    rollbackOnError,
    validCount: policyInputs.length
  });
  const enabled = status !== "disabled" && policyInputs.length > 0;

  return {
    enabled,
    consumer,
    policy_inputs: enabled ? policyInputs : [],
    summary,
    policy_fingerprint: enabled
      ? createFingerprint({
          consumer,
          policy_input_ids: policyInputs.map((item) => item.policy_input_id)
        })
      : "",
    rollback: {
      status,
      reason_codes: reasonCodes,
      invalid_inputs: invalidInputs,
      fallback_action: "ignore_policy_inputs_on_validation_failure"
    },
    response_style: summary.response_style,
    supporting_context_mode: summary.supporting_context_mode,
    recommended_max_selected_chunks: summary.recommended_max_selected_chunks,
    recommended_max_memory_items: summary.recommended_max_memory_items,
    avoid_patterns: summary.avoid_patterns,
    prefer_patterns: summary.prefer_patterns,
    policy_block: enabled ? renderPolicyBlock({ enabled, policy_inputs: policyInputs }, { audience: consumer }) : ""
  };
}

export function applyPolicyToScoredCandidates(candidates, { policyContext, query } = {}) {
  const baseCandidates = Array.isArray(candidates) ? candidates.map((candidate) => ({ ...candidate })) : [];
  if (!policyContext?.enabled || baseCandidates.length === 0) {
    return {
      candidates: baseCandidates,
      adaptation: {
        applied: false,
        matched_policy_input_ids: [],
        recommended_max_selected_chunks: policyContext?.recommended_max_selected_chunks ?? null
      }
    };
  }

  const queryText = normalizeText(query);
  const matchedPolicyInputIds = new Set();
  const adjustedCandidates = baseCandidates
    .map((candidate) => {
      const candidateText = normalizeText([
        candidate.path,
        candidate.canonicalPath,
        candidate.snippet
      ].filter(Boolean).join("\n"));
      const pathText = `${candidate.path || ""}\n${candidate.canonicalPath || ""}`;
      let policyScoreAdjustment = 0;
      const candidateMatches = [];

      for (const policyInput of policyContext.policy_inputs) {
        const queryMatchScore = computePolicyMatchScore(policyInput, queryText);
        const candidateMatchScore = computePolicyMatchScore(policyInput, candidateText);
        const sourceMatch = pathText.includes(policyInput.source_artifact_id);

        if (sourceMatch && queryMatchScore > 0) {
          policyScoreAdjustment += Number(policyInput.effects?.ranking_weight || 0.12);
          candidateMatches.push(policyInput.policy_input_id);
          matchedPolicyInputIds.add(policyInput.policy_input_id);
          continue;
        }

        if (candidateMatchScore > 0 && queryMatchScore > 0) {
          policyScoreAdjustment += Number(policyInput.effects?.ranking_weight || 0.12) * candidateMatchScore * 0.5;
          candidateMatches.push(policyInput.policy_input_id);
          matchedPolicyInputIds.add(policyInput.policy_input_id);
        }

        if (
          !sourceMatch
          && policyInput.polarity === "negative"
          && Array.isArray(policyInput.effects?.avoid_patterns)
          && policyInput.effects.avoid_patterns.some((pattern) => candidateText.includes(normalizeText(pattern)))
        ) {
          policyScoreAdjustment -= 0.06;
          candidateMatches.push(policyInput.policy_input_id);
          matchedPolicyInputIds.add(policyInput.policy_input_id);
        }

        if (
          policyInput.effects?.fact_priority === true
          && queryMatchScore > 0
          && (candidate.pathKind === "governedArtifact" || candidate.pathKind === "cardArtifact")
        ) {
          policyScoreAdjustment += 0.04;
          candidateMatches.push(policyInput.policy_input_id);
          matchedPolicyInputIds.add(policyInput.policy_input_id);
        }
      }

      const currentScore = Number.isFinite(candidate.finalScore)
        ? Number(candidate.finalScore)
        : Number(candidate.weightedScore || 0);

      return {
        ...candidate,
        policyScoreAdjustment,
        matchedPolicyInputIds: uniqueStrings(candidateMatches),
        finalScore: currentScore + policyScoreAdjustment
      };
    })
    .sort((left, right) => right.finalScore - left.finalScore);

  return {
    candidates: adjustedCandidates,
    adaptation: {
      applied: true,
      matched_policy_input_ids: [...matchedPolicyInputIds],
      recommended_max_selected_chunks: policyContext.recommended_max_selected_chunks ?? null
    }
  };
}

export function applyPolicyToMemoryItems(memoryItems, { policyContext, prompt, maxItems } = {}) {
  const baseItems = Array.isArray(memoryItems) ? memoryItems.map((item) => ({ ...item })) : [];
  if (!policyContext?.enabled || baseItems.length === 0) {
    return {
      memory_items: baseItems.slice(0, maxItems || baseItems.length),
      adaptation: {
        applied: false,
        matched_policy_input_ids: [],
        recommended_max_memory_items: policyContext?.recommended_max_memory_items ?? null
      }
    };
  }

  const promptText = normalizeText(prompt);
  const matchedPolicyInputIds = new Set();
  const adjustedItems = baseItems
    .map((item, index) => {
      const itemText = normalizeText([
        item.memory_id,
        item.title,
        item.summary
      ].filter(Boolean).join("\n"));
      let policyScore = 0;
      const itemMatches = [];

      for (const policyInput of policyContext.policy_inputs) {
        const promptMatchScore = computePolicyMatchScore(policyInput, promptText);
        const itemMatchScore = computePolicyMatchScore(policyInput, itemText);
        const sourceMatch = String(item.memory_id || "").includes(policyInput.source_artifact_id);

        if (sourceMatch && promptMatchScore > 0) {
          policyScore += Number(policyInput.effects?.ranking_weight || 0.12);
          itemMatches.push(policyInput.policy_input_id);
          matchedPolicyInputIds.add(policyInput.policy_input_id);
          continue;
        }

        if (itemMatchScore > 0 && promptMatchScore > 0) {
          policyScore += Number(policyInput.effects?.ranking_weight || 0.12) * itemMatchScore * 0.5;
          itemMatches.push(policyInput.policy_input_id);
          matchedPolicyInputIds.add(policyInput.policy_input_id);
        }
      }

      return {
        ...item,
        policyScore,
        matchedPolicyInputIds: uniqueStrings(itemMatches),
        originalIndex: index
      };
    })
    .sort((left, right) => {
      if (left.policyScore !== right.policyScore) {
        return right.policyScore - left.policyScore;
      }
      return left.originalIndex - right.originalIndex;
    });

  const itemLimit = clampNumber(
    policyContext.recommended_max_memory_items ?? maxItems ?? adjustedItems.length,
    1,
    20,
    maxItems ?? adjustedItems.length
  );

  return {
    memory_items: adjustedItems.slice(0, itemLimit).map(({ originalIndex, ...item }) => item),
    adaptation: {
      applied: true,
      matched_policy_input_ids: [...matchedPolicyInputIds],
      recommended_max_memory_items: policyContext.recommended_max_memory_items ?? null
    }
  };
}
