import { randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseSourceArtifact
} from "./contracts.js";

const EXPLICIT_REMEMBER_PATTERN = /\b(remember this|remember that|please remember|save this|keep this in mind)\b|记住这个|记住这点|请记住|记下来/iu;

function getSourceText(sourceArtifact) {
  const payload = sourceArtifact.normalized_payload || {};

  if (sourceArtifact.source_type === "manual"
    || sourceArtifact.source_type === "file"
    || sourceArtifact.source_type === "url"
    || sourceArtifact.source_type === "accepted_action") {
    return typeof payload.text === "string" ? payload.text.trim() : "";
  }

  if (sourceArtifact.source_type === "conversation") {
    const turns = Array.isArray(payload.turns) ? payload.turns : [];
    return turns
      .map((turn) => (typeof turn?.content === "string" ? turn.content.trim() : ""))
      .filter(Boolean)
      .join("\n");
  }

  if (sourceArtifact.source_type === "image") {
    return typeof payload.text === "string" ? payload.text.trim() : "";
  }

  return "";
}

function summarizeSourceArtifacts(sourceArtifacts) {
  const byType = {};
  const namespaceKeys = new Set();

  for (const sourceArtifact of sourceArtifacts) {
    byType[sourceArtifact.source_type] = (byType[sourceArtifact.source_type] || 0) + 1;
    namespaceKeys.add(createNamespaceKey(sourceArtifact.namespace));
  }

  return {
    source_count: sourceArtifacts.length,
    by_source_type: byType,
    namespace_count: namespaceKeys.size
  };
}

function summarizeReflectionOutputs(outputs) {
  const byLabel = {};
  const byState = {};
  let repeatedSignalCount = 0;
  let promotableCount = 0;

  for (const output of outputs) {
    byLabel[output.primary_label] = (byLabel[output.primary_label] || 0) + 1;
    byState[output.candidate_artifact.state] = (byState[output.candidate_artifact.state] || 0) + 1;
    if (output.repeated_source_count > 0) {
      repeatedSignalCount += 1;
    }
    if (output.recommendation.should_promote) {
      promotableCount += 1;
    }
  }

  return {
    candidate_count: outputs.length,
    by_label: byLabel,
    by_state: byState,
    repeated_signal_count: repeatedSignalCount,
    promotable_candidate_count: promotableCount
  };
}

function buildRepeatedSignals(outputs) {
  return outputs
    .filter((output) => output.repeated_source_count > 0)
    .map((output) => ({
      source_artifact_id: output.source_artifact_id,
      candidate_artifact_id: output.candidate_artifact.artifact_id,
      label: output.primary_label,
      repeated_source_count: output.repeated_source_count,
      confidence: output.candidate_artifact.confidence,
      summary: output.candidate_artifact.summary
    }));
}

function buildExplicitRememberSignals(sourceArtifacts, outputs) {
  const outputBySourceId = new Map(
    outputs.map((output) => [output.source_artifact_id, output])
  );

  return sourceArtifacts
    .map((sourceArtifact) => {
      const text = getSourceText(sourceArtifact);
      if (!text || !EXPLICIT_REMEMBER_PATTERN.test(text)) {
        return null;
      }

      const reflectionOutput = outputBySourceId.get(sourceArtifact.artifact_id);
      return {
        source_artifact_id: sourceArtifact.artifact_id,
        candidate_artifact_id: reflectionOutput?.candidate_artifact?.artifact_id || "",
        namespace_key: createNamespaceKey(sourceArtifact.namespace),
        snippet: text.replace(/\s+/g, " ").slice(0, 180),
        suggested_action:
          reflectionOutput?.recommendation?.should_promote ? "promote_review" : "observation_review"
      };
    })
    .filter(Boolean);
}

function buildPromotionReview(outputs) {
  return outputs.map((output) => ({
    candidate_artifact_id: output.candidate_artifact.artifact_id,
    label: output.primary_label,
    state: output.candidate_artifact.state,
    confidence: output.candidate_artifact.confidence,
    should_promote: output.recommendation.should_promote,
    promotion_score: output.recommendation.promotion_score,
    recommended_action: output.recommendation.recommended_action,
    reason_codes: output.recommendation.reason_codes || [],
    blocker_codes: output.recommendation.blocker_codes || [],
    reason:
      output.recommendation.should_promote
        ? "confidence_threshold_met"
        : output.candidate_artifact.state !== "candidate"
          ? "non_promotable_state"
          : "needs_more_evidence"
  }));
}

export function renderDailyReflectionReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Daily Reflection");
  lines.push(`- runId: \`${report.run_id}\``);
  lines.push(`- generatedAt: \`${report.generated_at}\``);
  lines.push(`- sourceCount: \`${report.summary.sources.source_count}\``);
  lines.push(`- candidateCount: \`${report.summary.reflection.candidate_count}\``);
  lines.push(`- repeatedSignals: \`${report.summary.reflection.repeated_signal_count}\``);
  lines.push(`- explicitRememberSignals: \`${report.explicit_remember_signals.length}\``);
  lines.push(`- promotedStableArtifacts: \`${report.promoted_stable_artifacts.length}\``);
  lines.push(`- reusedStableArtifacts: \`${(report.reused_stable_artifacts || []).length}\``);
  lines.push("");
  lines.push("## Labels");
  if (Object.keys(report.summary.reflection.by_label).length === 0) {
    lines.push("- none");
  } else {
    for (const [label, count] of Object.entries(report.summary.reflection.by_label)) {
      lines.push(`- ${label}: ${count}`);
    }
  }
  lines.push("");
  lines.push("## Promotion Review");
  if (report.promotion_review.length === 0) {
    lines.push("- none");
  } else {
    for (const item of report.promotion_review) {
      lines.push(`- ${item.label}: promote=${item.should_promote} score=${item.promotion_score ?? item.confidence} action=${item.recommended_action || "review"}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function createDailyReflectionRunner(options = {}) {
  const sourceSystem = options.sourceSystem;
  const reflectionSystem = options.reflectionSystem;
  const registry = options.registry;
  const idGenerator = options.idGenerator || randomUUID;
  const clock = options.clock || (() => new Date());

  if (!sourceSystem || typeof sourceSystem.ingestDeclaredSource !== "function") {
    throw new TypeError("daily reflection runner requires a sourceSystem with ingestDeclaredSource()");
  }
  if (!reflectionSystem || typeof reflectionSystem.runReflection !== "function") {
    throw new TypeError("daily reflection runner requires a reflectionSystem with runReflection()");
  }
  if (!registry || typeof registry.persistSourceArtifact !== "function" || typeof registry.promoteCandidateToStable !== "function") {
    throw new TypeError("daily reflection runner requires a registry");
  }

  async function runDailyReflection({
    declaredSources = [],
    sourceArtifacts = [],
    dryRun = false,
    autoPromote = false,
    decidedBy = "daily-reflection"
  } = {}) {
    if ((!Array.isArray(declaredSources) || declaredSources.length === 0) &&
      (!Array.isArray(sourceArtifacts) || sourceArtifacts.length === 0)) {
      throw new TypeError("runDailyReflection requires declaredSources or sourceArtifacts");
    }

    const ingestedSourceResults = [];
    const parsedSourceArtifacts = [];

    for (const sourceArtifact of sourceArtifacts) {
      parsedSourceArtifacts.push(parseSourceArtifact(sourceArtifact));
    }

    for (const declaredSource of declaredSources) {
      const sourceResult = await sourceSystem.ingestDeclaredSource(declaredSource);
      ingestedSourceResults.push(sourceResult);
      parsedSourceArtifacts.push(sourceResult.sourceArtifact);
    }

    if (!dryRun) {
      for (const sourceResult of ingestedSourceResults) {
        sourceResult.sourceRecord = await registry.persistSourceArtifact(sourceResult.sourceArtifact);
      }
    }

    const reflectionResult = await reflectionSystem.runReflection({
      sourceArtifacts: parsedSourceArtifacts,
      persistCandidates: !dryRun,
      decidedBy
    });

    const explicitRememberSignals = buildExplicitRememberSignals(
      parsedSourceArtifacts,
      reflectionResult.outputs
    );
    const promotionReview = buildPromotionReview(reflectionResult.outputs);
    const promotedStableArtifacts = [];
    const reusedStableArtifacts = [];

    if (!dryRun && autoPromote) {
      for (const reviewItem of promotionReview) {
        if (!reviewItem.should_promote) {
          continue;
        }
        const promotion = await registry.promoteCandidateToStable({
          candidateArtifactId: reviewItem.candidate_artifact_id,
          decidedBy,
          reasonCodes: ["daily_reflection_promotion", `label:${reviewItem.label}`]
        });
        if (promotion.reusedExisting) {
          reusedStableArtifacts.push(promotion);
        } else {
          promotedStableArtifacts.push(promotion);
        }
      }
    }

    return {
      run_id: createContractId("daily_reflection", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      generated_at: createContractTimestamp(clock),
      summary: {
        sources: summarizeSourceArtifacts(parsedSourceArtifacts),
        reflection: summarizeReflectionOutputs(reflectionResult.outputs)
      },
      ingested_sources: ingestedSourceResults.map((result) => ({
        source_id: result.sourceManifest.source_id,
        source_type: result.sourceManifest.source_type,
        namespace_key: createNamespaceKey(result.sourceManifest.namespace)
      })),
      repeated_signals: buildRepeatedSignals(reflectionResult.outputs),
      explicit_remember_signals: explicitRememberSignals,
      promotion_review: promotionReview,
      promoted_stable_artifacts: promotedStableArtifacts.map((item) => ({
        stable_artifact_id: item.stableArtifact.artifact_id,
        source_candidate_id: item.stableArtifact.source_candidate_id,
        decision_id: item.decisionTrail.decision_id
      })),
      reused_stable_artifacts: reusedStableArtifacts.map((item) => ({
        stable_artifact_id: item.stableArtifact.artifact_id,
        source_candidate_id: item.stableArtifact.source_candidate_id,
        decision_id: item.decisionTrail.decision_id
      })),
      reflection: reflectionResult
    };
  }

  return {
    runDailyReflection
  };
}
