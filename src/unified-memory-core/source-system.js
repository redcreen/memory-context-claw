import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";

import { normalizeWhitespace } from "../utils.js";
import {
  SHARED_CONTRACT_VERSION,
  SOURCE_TYPES,
  createContractId,
  createContractTimestamp,
  createNamespaceKey,
  parseNamespace,
  parseSourceArtifact,
  parseVisibility
} from "./contracts.js";

function createFingerprint(payload) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createBufferHash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function toLocator(value, fallbackKind) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {
    kind: fallbackKind,
    value: typeof value === "string" ? value : ""
  };
}

function normalizeText(value) {
  return normalizeWhitespace(typeof value === "string" ? value : "");
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
  if (["true", "1", "yes", "y", "accepted", "success", "succeeded"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n", "rejected", "failed"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean);
  }
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(",")
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function normalizeOptionalObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value;
}

function buildAcceptedActionText({
  actionType,
  status,
  accepted,
  succeeded,
  agentId,
  content,
  targets,
  artifacts
}) {
  const parts = [];
  parts.push(`accepted action ${actionType}`);
  if (status) {
    parts.push(`status ${status}`);
  }
  parts.push(accepted ? "user accepted" : "user not accepted");
  parts.push(succeeded ? "execution succeeded" : "execution not confirmed");
  if (agentId) {
    parts.push(`agent ${agentId}`);
  }
  if (targets.length > 0) {
    parts.push(`targets ${targets.join(", ")}`);
  }
  if (artifacts.length > 0) {
    parts.push(`artifacts ${artifacts.join(", ")}`);
  }
  if (content) {
    parts.push(content);
  }
  return normalizeText(parts.join("; "));
}

function detectMediaType(filePath, fallback = "application/octet-stream") {
  const extension = path.extname(String(filePath || "")).toLowerCase();
  const byExtension = {
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".json": "application/json",
    ".html": "text/html",
    ".htm": "text/html",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml"
  };
  return byExtension[extension] || fallback;
}

async function readTextFileSnapshot(filePath) {
  const buffer = await fs.readFile(filePath);
  const stats = await fs.stat(filePath);
  const text = buffer.toString("utf8");

  return {
    text,
    stats,
    sha256: createBufferHash(buffer),
    mediaType: detectMediaType(filePath, "text/plain"),
    extension: path.extname(filePath)
  };
}

async function readDirectorySnapshot(rootDir) {
  const entries = [];

  async function walk(currentDir) {
    const children = await fs.readdir(currentDir, { withFileTypes: true });
    const sorted = [...children].sort((left, right) => left.name.localeCompare(right.name));

    for (const child of sorted) {
      const absolutePath = path.join(currentDir, child.name);
      const relativePath = path.relative(rootDir, absolutePath) || child.name;
      if (child.isDirectory()) {
        entries.push({
          path: relativePath,
          kind: "directory"
        });
        await walk(absolutePath);
        continue;
      }

      const stats = await fs.stat(absolutePath);
      entries.push({
        path: relativePath,
        kind: child.isSymbolicLink() ? "symlink" : "file",
        size_bytes: stats.size
      });
    }
  }

  await walk(rootDir);

  return {
    root_path: rootDir,
    entry_count: entries.length,
    snapshot_fingerprint: createFingerprint(entries),
    entries
  };
}

function normalizeConversationMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new TypeError("declared conversation source requires messages");
  }

  const turns = messages.map((message, index) => {
    if (!message || typeof message !== "object") {
      throw new TypeError(`conversation message at index ${index} must be an object`);
    }
    const role = typeof message.role === "string" && message.role.trim() ? message.role.trim() : "unknown";
    const content = normalizeWhitespace(message.content);
    if (!content) {
      throw new TypeError(`conversation message at index ${index} requires content`);
    }

    return {
      role,
      content
    };
  });

  return {
    format: "conversation_turns",
    turn_count: turns.length,
    turns
  };
}

async function normalizeUrlSource(declaredSource) {
  const url = String(declaredSource.url || declaredSource.href || "").trim();
  if (!url) {
    throw new TypeError("url source requires url");
  }

  let snapshotPath = String(
    declaredSource.path || declaredSource.snapshotPath || declaredSource.cachePath || ""
  ).trim();
  let text = normalizeText(
    declaredSource.content
    ?? declaredSource.text
    ?? declaredSource.snapshot
    ?? declaredSource.body
  );
  const title = normalizeText(declaredSource.title || declaredSource.pageTitle);
  let contentType = normalizeText(declaredSource.contentType || declaredSource.mediaType);
  let sizeBytes;
  let sha256 = "";

  if (!text && snapshotPath) {
    const snapshot = await readTextFileSnapshot(snapshotPath);
    text = normalizeText(snapshot.text);
    contentType = contentType || snapshot.mediaType;
    sizeBytes = snapshot.stats.size;
    sha256 = snapshot.sha256;
  }

  if (!text) {
    throw new TypeError("url source requires content or snapshotPath");
  }

  return {
    locator: {
      kind: "url",
      value: url
    },
    normalizedPayload: {
      format: "web_snapshot",
      url,
      title,
      text,
      char_count: text.length,
      content_type: contentType || "text/plain",
      ...(snapshotPath ? { snapshot_path: snapshotPath } : {})
    },
    rawMetadata: {
      source_type: "url",
      content_type: contentType || "text/plain",
      title,
      ...(snapshotPath ? { snapshot_path: snapshotPath } : {}),
      ...(Number.isFinite(sizeBytes) ? { size_bytes: sizeBytes } : {}),
      ...(sha256 ? { sha256 } : {})
    }
  };
}

async function normalizeImageSource(declaredSource) {
  const imagePath = String(declaredSource.path || declaredSource.imagePath || "").trim();
  if (!imagePath) {
    throw new TypeError("image source requires path");
  }

  const buffer = await fs.readFile(imagePath);
  const stats = await fs.stat(imagePath);
  const altText = normalizeText(declaredSource.altText || declaredSource.alt_text);
  const caption = normalizeText(declaredSource.caption);
  const extractedText = normalizeText(declaredSource.ocrText || declaredSource.ocr_text || declaredSource.text);
  const text = normalizeText([altText, caption, extractedText].filter(Boolean).join("\n"));
  const mediaType = detectMediaType(imagePath);

  return {
    locator: {
      kind: "image",
      value: imagePath
    },
    normalizedPayload: {
      format: "image_snapshot",
      path: imagePath,
      media_type: mediaType,
      alt_text: altText,
      caption,
      extracted_text: extractedText,
      text,
      size_bytes: stats.size,
      sha256: createBufferHash(buffer)
    },
    rawMetadata: {
      source_type: "image",
      media_type: mediaType,
      size_bytes: stats.size,
      extension: path.extname(imagePath),
      sha256: createBufferHash(buffer),
      has_text_context: Boolean(text)
    }
  };
}

async function normalizeAcceptedActionSource(declaredSource) {
  const actionType = normalizeText(
    declaredSource.actionType || declaredSource.action_type || declaredSource.kind || ""
  );
  if (!actionType) {
    throw new TypeError("accepted_action source requires actionType");
  }

  const status = normalizeText(declaredSource.status || "succeeded");
  const accepted = normalizeBoolean(
    declaredSource.accepted ?? declaredSource.userAccepted ?? declaredSource.user_accepted,
    true
  );
  const succeeded = normalizeBoolean(
    declaredSource.succeeded
      ?? declaredSource.executionSucceeded
      ?? declaredSource.execution_succeeded
      ?? status,
    /success|succeed|applied|completed|done/iu.test(status || "")
  );
  const agentId = normalizeText(
    declaredSource.agentId || declaredSource.agent_id || declaredSource.runtime || ""
  );
  const content = normalizeText(
    declaredSource.content ?? declaredSource.text ?? declaredSource.summary ?? ""
  );
  const externalTargets = normalizeStringArray(
    declaredSource.externalTargets
      ?? declaredSource.external_targets
      ?? declaredSource.targets
      ?? declaredSource.target
  );
  const artifactPaths = normalizeStringArray(
    declaredSource.artifacts ?? declaredSource.artifactPaths ?? declaredSource.artifact_paths
  );
  const inputs = normalizeOptionalObject(declaredSource.inputs);
  const outputs = normalizeOptionalObject(declaredSource.outputs);
  const text = buildAcceptedActionText({
    actionType,
    status,
    accepted,
    succeeded,
    agentId,
    content,
    targets: externalTargets,
    artifacts: artifactPaths
  });

  return {
    locator: {
      kind: "accepted_action",
      value: actionType
    },
    normalizedPayload: {
      format: "accepted_action",
      action_type: actionType,
      status,
      accepted,
      execution_succeeded: succeeded,
      agent_id: agentId,
      text,
      summary: content || text,
      external_targets: externalTargets,
      artifact_paths: artifactPaths,
      ...(inputs ? { inputs } : {}),
      ...(outputs ? { outputs } : {}),
      char_count: text.length
    },
    rawMetadata: {
      source_type: "accepted_action",
      action_type: actionType,
      status,
      accepted,
      execution_succeeded: succeeded,
      ...(agentId ? { agent_id: agentId } : {}),
      external_target_count: externalTargets.length,
      artifact_path_count: artifactPaths.length
    }
  };
}

export function createSourceSystem(options = {}) {
  const idGenerator = options.idGenerator || randomUUID;
  const clock = options.clock || (() => new Date());
  const defaultNamespace = parseNamespace(
    options.defaultNamespace || {
      tenant: "local",
      scope: "workspace",
      resource: "unified-memory-core",
      key: "default"
    }
  );
  const defaultVisibility = parseVisibility(options.defaultVisibility || "private");

  async function ingestDeclaredSource(declaredSource) {
    if (!declaredSource || typeof declaredSource !== "object" || Array.isArray(declaredSource)) {
      throw new TypeError("declaredSource must be an object");
    }

    const sourceType = String(declaredSource.sourceType || declaredSource.source_type || "").trim();
    if (!SOURCE_TYPES.includes(sourceType)) {
      throw new TypeError(`sourceType must be one of ${SOURCE_TYPES.join(", ")}`);
    }

    const namespace = parseNamespace(declaredSource.namespace || defaultNamespace);
    const visibility = parseVisibility(declaredSource.visibility || defaultVisibility);
    const declaredBy = String(declaredSource.declaredBy || declaredSource.declared_by || "manual").trim();
    const createdAt = createContractTimestamp(clock);
    const sourceId = createContractId("source", idGenerator);
    const artifactId = createContractId("artifact", idGenerator);
    const ingestRunId = createContractId("ingest", idGenerator);

    let locator;
    let normalizedPayload;
    let rawMetadata = {
      source_type: sourceType
    };

    if (sourceType === "manual") {
      const text = normalizeText(
        declaredSource.content ?? declaredSource.text ?? declaredSource.input ?? ""
      );
      if (!text) {
        throw new TypeError("manual source requires content");
      }

      locator = toLocator(declaredSource.locator, "inline");
      normalizedPayload = {
        format: "text",
        text,
        char_count: text.length
      };
    } else if (sourceType === "file") {
      const filePath = String(declaredSource.path || declaredSource.filePath || "").trim();
      if (!filePath) {
        throw new TypeError("file source requires path");
      }
      const snapshot = await readTextFileSnapshot(filePath);
      locator = toLocator(declaredSource.locator || filePath, "file");
      normalizedPayload = {
        format: "text",
        path: filePath,
        text: normalizeText(snapshot.text),
        char_count: normalizeText(snapshot.text).length,
        sha256: snapshot.sha256,
        media_type: snapshot.mediaType
      };
      rawMetadata = {
        ...rawMetadata,
        size_bytes: snapshot.stats.size,
        extension: snapshot.extension,
        sha256: snapshot.sha256,
        media_type: snapshot.mediaType
      };
    } else if (sourceType === "directory") {
      const directoryPath = String(declaredSource.path || declaredSource.directoryPath || "").trim();
      if (!directoryPath) {
        throw new TypeError("directory source requires path");
      }
      locator = toLocator(declaredSource.locator || directoryPath, "directory");
      normalizedPayload = await readDirectorySnapshot(directoryPath);
      rawMetadata = {
        ...rawMetadata,
        snapshot_fingerprint: normalizedPayload.snapshot_fingerprint
      };
    } else if (sourceType === "url") {
      const normalized = await normalizeUrlSource(declaredSource);
      locator = toLocator(declaredSource.locator || normalized.locator, "url");
      normalizedPayload = normalized.normalizedPayload;
      rawMetadata = normalized.rawMetadata;
    } else if (sourceType === "image") {
      const normalized = await normalizeImageSource(declaredSource);
      locator = toLocator(declaredSource.locator || normalized.locator, "image");
      normalizedPayload = normalized.normalizedPayload;
      rawMetadata = normalized.rawMetadata;
    } else if (sourceType === "accepted_action") {
      const normalized = await normalizeAcceptedActionSource(declaredSource);
      locator = toLocator(declaredSource.locator || normalized.locator, "accepted_action");
      normalizedPayload = normalized.normalizedPayload;
      rawMetadata = normalized.rawMetadata;
    } else {
      locator = toLocator(declaredSource.locator, "conversation");
      normalizedPayload = normalizeConversationMessages(declaredSource.messages);
    }

    const fingerprint = createFingerprint({
      namespace_key: createNamespaceKey(namespace),
      source_type: sourceType,
      locator,
      normalized_payload: normalizedPayload
    });

    const sourceManifest = {
      source_id: sourceId,
      source_type: sourceType,
      declared_by: declaredBy,
      namespace,
      visibility,
      locator,
      fingerprint,
      created_at: createdAt
    };

    const sourceArtifact = parseSourceArtifact({
      artifact_id: artifactId,
      artifact_type: "source_artifact",
      contract_version: SHARED_CONTRACT_VERSION,
      source_id: sourceId,
      source_type: sourceType,
      declared_by: declaredBy,
      namespace,
      visibility,
      locator,
      normalized_payload: normalizedPayload,
      raw_metadata: {
        ...rawMetadata,
        manifest_fingerprint: fingerprint
      },
      fingerprint,
      ingest_run_id: ingestRunId,
      created_at: createdAt,
      export_hints: Array.isArray(declaredSource.exportHints) ? declaredSource.exportHints : []
    });

    return {
      sourceManifest,
      sourceArtifact
    };
  }

  return {
    ingestDeclaredSource
  };
}
