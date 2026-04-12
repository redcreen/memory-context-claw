function normalizeMaxCandidates(value, fallback = 4) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.min(20, Number(value)));
}

export function mapOpenClawExportToCandidates(exportResult, { query, maxCandidates } = {}) {
  const items = Array.isArray(exportResult?.payload?.memory_items)
    ? exportResult.payload.memory_items
    : [];
  const limit = normalizeMaxCandidates(maxCandidates, items.length || 4);

  return items.slice(0, limit).map((item, index) => {
    const baseScore = Math.max(0.01, 0.92 - index * 0.03);
    return {
      id: item.memory_id,
      path: `umc://openclaw-export/${item.memory_id}`,
      canonicalPath: `umc://openclaw-export/${item.memory_id}`,
      startLine: 1,
      endLine: 1,
      snippet: String(item.summary || item.title || ""),
      source: "governedArtifact",
      pathKind: "governedArtifact",
      title: item.title,
      visibility: item.visibility,
      exportHints: item.export_hints,
      attributes: item.attributes,
      learning: item.learning || {},
      score: baseScore,
      retrievalScore: baseScore,
      sourceQuery: query,
      fusionScore: baseScore + 1 / (index + 1)
    };
  });
}

export function validateOpenClawExportConsumption({
  exportResult,
  query = "validate promoted learning artifacts",
  maxCandidates,
  expectedArtifactIds = []
} = {}) {
  const candidates = mapOpenClawExportToCandidates(exportResult, {
    query,
    maxCandidates
  });
  const consumedArtifactIds = candidates.map((candidate) => candidate.id);
  const missingExpectedArtifactIds = expectedArtifactIds.filter(
    (artifactId) => !consumedArtifactIds.includes(artifactId)
  );

  return {
    requested_candidates: normalizeMaxCandidates(maxCandidates, expectedArtifactIds.length || 4),
    consumed_candidates: candidates.length,
    consumed_artifact_ids: consumedArtifactIds,
    missing_expected_artifact_ids: missingExpectedArtifactIds,
    status: missingExpectedArtifactIds.length === 0 ? "ok" : "missing_promoted_artifacts",
    preview_candidates: candidates.map((candidate) => ({
      artifact_id: candidate.id,
      title: candidate.title,
      snippet: candidate.snippet,
      learning: candidate.learning
    }))
  };
}
