import path from "node:path";

import { parseNamespace } from "./contracts.js";

function sanitizePart(value, fallback) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  return normalized || fallback;
}

function normalizeProjectId(projectPath, projectId) {
  if (typeof projectId === "string" && projectId.trim()) {
    return sanitizePart(projectId, "default-project");
  }
  if (typeof projectPath === "string" && projectPath.trim()) {
    return sanitizePart(path.basename(projectPath), "default-project");
  }
  return "default-project";
}

export function resolveOpenClawNamespace(context = {}) {
  return parseNamespace({
    tenant: sanitizePart(context.tenant || "local", "local"),
    scope: sanitizePart(context.scope || "workspace", "workspace"),
    resource: sanitizePart(context.resource || "openclaw-shared-memory", "openclaw-shared-memory"),
    key: sanitizePart(context.workspaceId || context.namespaceHint || "default-workspace", "default-workspace"),
    host: sanitizePart(context.host || "", "")
  });
}

export function resolveCodexNamespace(context = {}) {
  const projectId = normalizeProjectId(context.projectPath, context.projectId);
  const userId = sanitizePart(context.userId || "default-user", "default-user");

  return parseNamespace({
    tenant: sanitizePart(context.tenant || "local", "local"),
    scope: sanitizePart(context.scope || "project", "project"),
    resource: sanitizePart(context.resource || "shared-code-memory", "shared-code-memory"),
    key: sanitizePart(context.namespaceHint || `${projectId}-${userId}`, `${projectId}-${userId}`),
    host: sanitizePart(context.host || "", "")
  });
}

export function createOpenClawAdapterBridge(options = {}) {
  const projectionSystem = options.projectionSystem;
  if (!projectionSystem || typeof projectionSystem.buildOpenClawExport !== "function") {
    throw new TypeError("createOpenClawAdapterBridge requires projectionSystem.buildOpenClawExport()");
  }
  const namespaceResolver = options.namespaceResolver || resolveOpenClawNamespace;

  return {
    resolveNamespace(context = {}) {
      return namespaceResolver(context);
    },
    async loadExports(context = {}, projectionOptions = {}) {
      const namespace = namespaceResolver(context);
      return projectionSystem.buildOpenClawExport({
        namespace,
        allowedVisibilities: projectionOptions.allowedVisibilities || ["private", "workspace", "shared", "public"],
        allowedStates: projectionOptions.allowedStates || ["stable"]
      });
    }
  };
}

export function createCodexAdapterBridge(options = {}) {
  const projectionSystem = options.projectionSystem;
  if (!projectionSystem || typeof projectionSystem.buildCodexExport !== "function") {
    throw new TypeError("createCodexAdapterBridge requires projectionSystem.buildCodexExport()");
  }
  const namespaceResolver = options.namespaceResolver || resolveCodexNamespace;

  return {
    resolveNamespace(context = {}) {
      return namespaceResolver(context);
    },
    async loadExports(context = {}, projectionOptions = {}) {
      const namespace = namespaceResolver(context);
      return projectionSystem.buildCodexExport({
        namespace,
        allowedVisibilities: projectionOptions.allowedVisibilities || ["private", "workspace", "shared", "public"],
        allowedStates: projectionOptions.allowedStates || ["stable"]
      });
    }
  };
}
