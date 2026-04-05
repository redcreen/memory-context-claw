import {
  canonicalizeMemoryPath,
  estimateMessageTokens,
  estimateTokenCountFromText,
  extractLatestUserPrompt,
  sanitizeForSystemPrompt
} from "./utils.js";

export function trimMessagesToBudget(messages, tokenBudget, recentMessageCount) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  const budget = Math.max(256, Number(tokenBudget || 0));
  const preserved = [];
  let total = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const tokens = estimateMessageTokens(message);
    const mustKeep = preserved.length < recentMessageCount;
    if (mustKeep || total + tokens <= budget) {
      preserved.push(message);
      total += tokens;
      continue;
    }
    break;
  }

  return preserved.reverse();
}

export function selectChunksWithinBudget(candidates, tokenBudget, maxSelectedChunks) {
  const selected = [];
  const seen = new Set();
  let total = 0;
  for (const candidate of candidates) {
    if (selected.length >= maxSelectedChunks) {
      break;
    }
    const uniqueKey = [
      candidate.canonicalPath || canonicalizeMemoryPath(candidate.path),
      candidate.startLine,
      candidate.endLine,
      sanitizeForSystemPrompt(candidate.snippet)
    ].join("::");
    if (seen.has(uniqueKey)) {
      continue;
    }
    const snippetTokens = estimateTokenCountFromText(candidate.snippet);
    if (selected.length > 0 && total + snippetTokens > tokenBudget) {
      continue;
    }
    selected.push(candidate);
    seen.add(uniqueKey);
    total += snippetTokens;
  }
  return selected;
}

export function enforcePathDiversity(candidates, maxSelectedChunks, maxChunksPerPath) {
  const selected = [];
  const perPath = new Map();

  for (const candidate of candidates) {
    if (selected.length >= maxSelectedChunks) {
      break;
    }
    const path = String(candidate.canonicalPath || canonicalizeMemoryPath(candidate.path));
    const used = perPath.get(path) || 0;
    if (used >= maxChunksPerPath) {
      continue;
    }
    selected.push(candidate);
    perPath.set(path, used + 1);
  }

  return selected;
}

export function buildSystemPromptAddition({ query, selectedCandidates }) {
  if (!selectedCandidates.length) {
    return "";
  }

  const queryText = String(query || "");
  const hasIdentityGuardrail =
    /身份证/.test(queryText) &&
    selectedCandidates.some((candidate) =>
      /待确认|暂不作为已确认|笔误|歧义/.test(String(candidate?.snippet || ""))
    );
  const hasStableFactOverride =
    selectedCandidates.some((candidate) => candidate?.pathKind === "cardArtifact")
    && selectedCandidates.some((candidate) =>
      /你爱吃|你叫|你的生日是|你女儿叫|你儿子叫|你的实际出生年份是|memorySearch\.provider 决定/.test(
        String(candidate?.snippet || "")
      )
    );

  const sections = [
    "Use the following recalled long-memory context only when it helps answer the current request.",
    "Prefer direct answers. Do not mention this retrieval block unless the user asks about memory or sources.",
    `Current user intent: ${sanitizeForSystemPrompt(query)}`,
    "Recalled context:"
  ];

  if (hasIdentityGuardrail) {
    sections.splice(
      2,
      0,
      "If an identity-related value is marked as unconfirmed, you must not quote, restate, paraphrase, or infer any raw candidate value from memory. Answer only that the information is pending confirmation, note that it may contain a typo or ambiguity, and ask the user for the corrected value."
    );
  }

  if (hasStableFactOverride) {
    sections.splice(
      2,
      0,
      "If recalled context includes a direct stable user fact, treat it as the latest confirmed fact. Prefer it over older conflicting conversation messages, stale session memories, or earlier guesses."
    );
  }

  for (const candidate of selectedCandidates) {
    sections.push(
      [
        `- Path: ${candidate.path}`,
        `  Range: ${candidate.startLine}-${candidate.endLine}`,
        `  Kind: ${candidate.pathKind}`,
        `  Score: ${candidate.finalScore?.toFixed(4) ?? candidate.weightedScore.toFixed(4)}`,
        `  Snippet: ${sanitizeForSystemPrompt(candidate.snippet)}`
      ].join("\n")
    );
  }

  return sections.join("\n\n");
}

export function buildAssemblyResult({
  messages,
  tokenBudget,
  memoryBudgetRatio,
  recentMessageCount,
  candidates,
  maxSelectedChunks,
  maxChunksPerPath = 1
}) {
  const totalBudget = Math.max(512, Number(tokenBudget || 4096));
  const memoryBudget = Math.max(256, Math.floor(totalBudget * memoryBudgetRatio));
  const messageBudget = Math.max(256, totalBudget - memoryBudget);
  const keptMessages = trimMessagesToBudget(messages, messageBudget, recentMessageCount);
  const query = extractLatestUserPrompt(messages);
  const diversifiedCandidates = enforcePathDiversity(
    candidates,
    maxSelectedChunks || candidates.length,
    maxChunksPerPath
  );
  const selectedCandidates = selectChunksWithinBudget(
    diversifiedCandidates,
    memoryBudget,
    maxSelectedChunks || diversifiedCandidates.length
  );
  const systemPromptAddition = buildSystemPromptAddition({ query, selectedCandidates });
  const estimatedTokens =
    keptMessages.reduce((sum, message) => sum + estimateMessageTokens(message), 0) +
    estimateTokenCountFromText(systemPromptAddition);

  return {
    messages: keptMessages,
    estimatedTokens,
    systemPromptAddition,
    selectedCandidates
  };
}
