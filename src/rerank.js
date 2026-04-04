import { messageContentToText, sanitizeForSystemPrompt } from "./utils.js";

function truncateSnippet(text, maxChars) {
  const value = sanitizeForSystemPrompt(text);
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

export function prepareRerankCandidates(candidates, config) {
  return candidates.slice(0, config.topN).map((candidate) => ({
    ...candidate,
    snippet: truncateSnippet(candidate.snippet, config.maxSnippetChars)
  }));
}

export function shouldSkipLlmRerank(candidates, config) {
  if (!config.enabled) {
    return true;
  }
  if (!Array.isArray(candidates) || candidates.length < 2) {
    return true;
  }
  const relevant = candidates.slice(0, Math.max(2, config.topN));
  if (relevant.length < 2) {
    return true;
  }
  const [first, second] = relevant;
  const firstScore = Number(first?.weightedScore || 0);
  const secondScore = Number(second?.weightedScore || 0);
  return firstScore - secondScore >= config.minScoreDeltaToSkip;
}

export function buildRerankPrompt(query, candidates) {
  return [
    "You are ranking long-memory snippets for context assembly.",
    "Return strict JSON only.",
    "",
    "Schema:",
    '{"selected":[{"id":"cand-1","score":0.92,"reason":"short reason"}]}',
    "",
    "Ranking goals:",
    "- prefer snippets that directly answer the current user intent",
    "- prefer stable rules from MEMORY.md when they matter",
    "- prefer recent daily notes when they are more actionable",
    "- avoid near-duplicate snippets",
    "",
    `User query: ${query}`,
    "",
    "Candidates:",
    ...candidates.map((candidate) =>
      [
        `ID: ${candidate.id}`,
        `Path: ${candidate.path}`,
        `Range: ${candidate.startLine}-${candidate.endLine}`,
        `Heuristic score: ${candidate.weightedScore.toFixed(4)}`,
        `Snippet: ${candidate.snippet}`
      ].join("\n")
    )
  ].join("\n\n");
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

export function parseRerankResponse(text) {
  const payload = JSON.parse(extractJson(text));
  if (!Array.isArray(payload?.selected)) {
    return [];
  }
  return payload.selected
    .filter((item) => item && typeof item.id === "string")
    .map((item) => ({
      id: item.id,
      score: typeof item.score === "number" ? item.score : 0,
      reason: typeof item.reason === "string" ? item.reason : ""
    }));
}

export async function rerankCandidatesWithSubagent({
  runtime,
  sessionKey,
  query,
  candidates,
  config,
  logger
}) {
  const rerankSessionKey = `${sessionKey}:context-rerank:${Date.now()}`;
  const prompt = buildRerankPrompt(query, prepareRerankCandidates(candidates, config));
  const runResult = await runtime.subagent.run({
    sessionKey: rerankSessionKey,
    message: prompt,
    provider: config.provider || undefined,
    model: config.model || undefined,
    extraSystemPrompt:
      "Return only JSON. Do not include markdown fences, prose, or explanation outside the JSON payload.",
    lane: "subagent",
    deliver: false,
    idempotencyKey: `context-rerank-${Date.now()}`
  });

  const waitResult = await runtime.subagent.waitForRun({
    runId: runResult.runId,
    timeoutMs: config.timeoutMs
  });

  if (waitResult.status !== "ok") {
    throw new Error(waitResult.error || `rerank run failed: ${waitResult.status}`);
  }

  const session = await runtime.subagent.getSessionMessages({
    sessionKey: rerankSessionKey,
    limit: 20
  });

  const assistantMessages = Array.isArray(session?.messages) ? session.messages : [];
  const finalAssistant = [...assistantMessages]
    .reverse()
    .find((message) => message && message.role === "assistant");
  const text = sanitizeForSystemPrompt(messageContentToText(finalAssistant?.content));
  const reranked = parseRerankResponse(text);

  try {
    await runtime.subagent.deleteSession({
      sessionKey: rerankSessionKey,
      deleteTranscript: true
    });
  } catch (error) {
    logger?.warn?.(
      `[context-assembly-claw] failed to delete rerank session ${rerankSessionKey}: ${String(error)}`
    );
  }

  return reranked;
}

export function applyRerankOrder(candidates, reranked) {
  const lookup = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const used = new Set();
  const ordered = [];

  for (const item of reranked) {
    const candidate = lookup.get(item.id);
    if (!candidate || used.has(item.id)) {
      continue;
    }
    ordered.push({
      ...candidate,
      rerankScore: item.score,
      rerankReason: item.reason,
      finalScore: candidate.weightedScore + item.score
    });
    used.add(item.id);
  }

  for (const candidate of candidates) {
    if (used.has(candidate.id)) {
      continue;
    }
    ordered.push({
      ...candidate,
      rerankScore: 0,
      rerankReason: "",
      finalScore: candidate.weightedScore
    });
  }

  return ordered.sort((left, right) => right.finalScore - left.finalScore);
}
