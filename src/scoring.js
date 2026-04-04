import {
  buildKeywordSet,
  canonicalizeMemoryPath,
  normalizeWhitespace,
  scoreRecencyFromIsoDate,
  toIsoDateFromMemoryPath
} from "./utils.js";

function computePathKind(pathname) {
  if (pathname === "MEMORY.md" || pathname.endsWith("/MEMORY.md")) {
    return "memoryFile";
  }
  if (pathname.includes("/memory/") || pathname.startsWith("memory/")) {
    return "dailyMemory";
  }
  return "workspaceDoc";
}

function computeKeywordOverlap(promptKeywords, candidateText) {
  if (promptKeywords.length === 0) {
    return 0;
  }
  const haystack = normalizeWhitespace(candidateText).toLowerCase();
  let hits = 0;
  for (const keyword of promptKeywords) {
    if (haystack.includes(keyword)) {
      hits += 1;
    }
  }
  return hits / promptKeywords.length;
}

function hasStructuredSummary(text) {
  return /一句话结论|适用场景|关键信息|今日结论/.test(text);
}

export function scoreCandidates(candidates, prompt, weights, now = new Date()) {
  const promptKeywords = buildKeywordSet(prompt);
  const maxRetrievalScore = Math.max(1e-9, ...candidates.map((item) => Number(item.score || 0)));

  return candidates
    .map((candidate, index) => {
      const path = String(candidate.path || "");
      const canonicalPath = canonicalizeMemoryPath(path);
      const snippet = String(candidate.snippet || "");
      const retrievalScore = Number(candidate.score || 0) / maxRetrievalScore;
      const pathKind = computePathKind(canonicalPath);
      const keywordOverlap = computeKeywordOverlap(promptKeywords, `${canonicalPath}\n${snippet}`);
      const summaryBoost = hasStructuredSummary(snippet) ? 1 : 0;
      const recency = scoreRecencyFromIsoDate(toIsoDateFromMemoryPath(canonicalPath), now);

      const weightedScore =
        retrievalScore * weights.retrievalScore +
        keywordOverlap * weights.keywordOverlap +
        summaryBoost * weights.summarySection +
        recency * weights.recency +
        (pathKind === "memoryFile" ? weights.memoryFile : 0) +
        (pathKind === "dailyMemory" ? weights.dailyMemory : 0) +
        (pathKind === "workspaceDoc" ? weights.workspaceDoc : 0);

      return {
        id: `cand-${index + 1}`,
        path,
        canonicalPath,
        pathKind,
        startLine: Number(candidate.startLine || 0),
        endLine: Number(candidate.endLine || 0),
        retrievalScore: Number(candidate.score || 0),
        keywordOverlap,
        summaryBoost,
        recency,
        weightedScore,
        snippet,
        source: String(candidate.source || "memory")
      };
    })
    .sort((left, right) => right.weightedScore - left.weightedScore);
}
