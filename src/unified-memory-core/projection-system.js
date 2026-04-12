import { createHash, randomUUID } from "node:crypto";

import {
  SHARED_CONTRACT_VERSION,
  VISIBILITY_LEVELS,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseExportContract,
  parseNamespace,
  parseStableArtifact
} from "./contracts.js";

function createHashValue(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function sanitizeList(values, fallback) {
  if (!Array.isArray(values) || values.length === 0) {
    return [...fallback];
  }
  return values.filter((value) => typeof value === "string" && value.trim());
}

function createOpenClawPayload(artifacts) {
  return {
    consumer: "openclaw",
    memory_items: artifacts.map((artifact) => ({
      memory_id: artifact.artifact_id,
      title: artifact.title,
      summary: artifact.summary,
      visibility: artifact.visibility,
      evidence_refs: artifact.evidence_refs,
      attributes: artifact.attributes,
      export_hints: artifact.export_hints,
      learning: {
        signal_type: artifact.attributes?.learning_signal_type || "",
        polarity: artifact.attributes?.learning_polarity || "",
        lifecycle_state: artifact.attributes?.lifecycle_state || artifact.state,
        promotion_score: artifact.attributes?.promotion_score
      }
    }))
  };
}

function createCodexPayload(artifacts) {
  return {
    consumer: "codex",
    code_memory: artifacts.map((artifact) => ({
      memory_id: artifact.artifact_id,
      title: artifact.title,
      summary: artifact.summary,
      namespace: createNamespaceKey(artifact.namespace),
      evidence_refs: artifact.evidence_refs,
      attributes: artifact.attributes,
      export_hints: artifact.export_hints,
      learning: {
        signal_type: artifact.attributes?.learning_signal_type || "",
        polarity: artifact.attributes?.learning_polarity || "",
        lifecycle_state: artifact.attributes?.lifecycle_state || artifact.state,
        promotion_score: artifact.attributes?.promotion_score
      }
    }))
  };
}

function createGenericPayload(artifacts) {
  return {
    consumer: "generic",
    artifacts: artifacts.map((artifact) => ({ ...artifact }))
  };
}

function filterRecords(records, { namespace, allowedVisibilities, allowedStates }) {
  const namespaceKey = createNamespaceKey(namespace);
  const visibilitySet = new Set(allowedVisibilities);
  const stateSet = new Set(allowedStates);

  return records
    .filter((record) => record.record_type === "stable_artifact")
    .map((record) => parseStableArtifact(record.payload))
    .filter((artifact) => {
      if (createNamespaceKey(artifact.namespace) !== namespaceKey) {
        return false;
      }
      if (!visibilitySet.has(artifact.visibility)) {
        return false;
      }
      if (!stateSet.has(artifact.state)) {
        return false;
      }
      return true;
    })
    .sort((left, right) => {
      if (left.updated_at === right.updated_at) {
        return left.artifact_id.localeCompare(right.artifact_id);
      }
      return left.updated_at.localeCompare(right.updated_at);
    });
}

function countPayloadItems(exportResult) {
  if (Array.isArray(exportResult?.payload?.memory_items)) {
    return exportResult.payload.memory_items.length;
  }
  if (Array.isArray(exportResult?.payload?.code_memory)) {
    return exportResult.payload.code_memory.length;
  }
  if (Array.isArray(exportResult?.payload?.artifacts)) {
    return exportResult.payload.artifacts.length;
  }
  return 0;
}

export function renderExportReport(exportResult, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(exportResult, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Export Report");
  lines.push(`- exportId: \`${exportResult.exportContract.export_id}\``);
  lines.push(`- consumer: \`${exportResult.exportContract.consumer}\``);
  lines.push(`- namespace: \`${createNamespaceKey(exportResult.exportContract.namespace)}\``);
  lines.push(`- exportVersion: \`${exportResult.exportVersion}\``);
  lines.push(`- generatedAt: \`${exportResult.exportContract.generated_at}\``);
  lines.push(`- artifactCount: \`${countPayloadItems(exportResult)}\``);
  lines.push("");
  lines.push("## Filters");
  lines.push(`- allowedVisibilities: \`${(exportResult.exportContract.metadata?.allowed_visibilities || []).join(", ")}\``);
  lines.push(`- allowedStates: \`${(exportResult.exportContract.metadata?.allowed_states || []).join(", ")}\``);
  lines.push("");
  lines.push("## Artifacts");
  if (!Array.isArray(exportResult.artifacts) || exportResult.artifacts.length === 0) {
    lines.push("- none");
  } else {
    for (const artifact of exportResult.artifacts) {
      lines.push(`- ${artifact.title}: ${artifact.summary}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

export function createProjectionSystem(options = {}) {
  const registry = options.registry;
  if (!registry || typeof registry.listRecords !== "function") {
    throw new TypeError("createProjectionSystem requires a registry with listRecords()");
  }

  const exportVersion = typeof options.exportVersion === "string" && options.exportVersion.trim()
    ? options.exportVersion.trim()
    : "v1";
  const idGenerator = options.idGenerator || randomUUID;
  const clock = options.clock || (() => new Date());

  async function buildExport({
    consumer,
    namespace,
    allowedVisibilities = VISIBILITY_LEVELS,
    allowedStates = ["stable"]
  }) {
    const parsedNamespace = parseNamespace(namespace);
    const visibilities = sanitizeList(allowedVisibilities, VISIBILITY_LEVELS);
    const states = sanitizeList(allowedStates, ["stable"]);
    const records = await registry.listRecords({ recordType: "stable_artifact" });
    const artifacts = filterRecords(records, {
      namespace: parsedNamespace,
      allowedVisibilities: visibilities,
      allowedStates: states
    });
    const projectedAt = createContractTimestamp(clock);

    let consumerPayload;
    if (consumer === "openclaw") {
      consumerPayload = createOpenClawPayload(artifacts);
    } else if (consumer === "codex") {
      consumerPayload = createCodexPayload(artifacts);
    } else {
      consumerPayload = createGenericPayload(artifacts);
    }

    const payloadFingerprint = createHashValue({
      consumer,
      namespace: parsedNamespace,
      visibility: visibilities,
      states,
      artifact_refs: artifacts.map((artifact) => artifact.artifact_id),
      fingerprints: artifacts.map((artifact) => artifact.fingerprint)
    });

    const exportContract = parseExportContract({
      export_id: createContractId("export", idGenerator),
      contract_version: SHARED_CONTRACT_VERSION,
      consumer,
      namespace: parsedNamespace,
      visibility: visibilities[visibilities.length - 1] || "private",
      artifact_refs: artifacts.map((artifact) => artifact.artifact_id),
      generated_at: projectedAt,
      metadata: {
        export_version: exportVersion,
        payload_fingerprint: payloadFingerprint,
        allowed_visibilities: visibilities,
        allowed_states: states
      }
    });

    return {
      exportContract,
      exportVersion,
      payloadFingerprint,
      artifacts,
      payload: {
        ...consumerPayload,
        export_version: exportVersion,
        payload_fingerprint: payloadFingerprint,
        projected_at: projectedAt
      }
    };
  }

  return {
    buildExport,
    buildOpenClawExport(params) {
      return buildExport({ ...params, consumer: "openclaw" });
    },
    buildCodexExport(params) {
      return buildExport({ ...params, consumer: "codex" });
    },
    buildGenericExport(params) {
      return buildExport({ ...params, consumer: "generic" });
    }
  };
}
