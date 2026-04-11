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

function toLocator(value, fallbackKind) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {
    kind: fallbackKind,
    value: typeof value === "string" ? value : ""
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
      const text = normalizeWhitespace(
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
      const content = await fs.readFile(filePath, "utf8");
      const stats = await fs.stat(filePath);
      locator = toLocator(declaredSource.locator || filePath, "file");
      normalizedPayload = {
        format: "text",
        path: filePath,
        text: content,
        char_count: content.length
      };
      rawMetadata = {
        ...rawMetadata,
        size_bytes: stats.size,
        extension: path.extname(filePath)
      };
    } else if (sourceType === "directory") {
      const directoryPath = String(declaredSource.path || declaredSource.directoryPath || "").trim();
      if (!directoryPath) {
        throw new TypeError("directory source requires path");
      }
      locator = toLocator(declaredSource.locator || directoryPath, "directory");
      normalizedPayload = await readDirectorySnapshot(directoryPath);
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
