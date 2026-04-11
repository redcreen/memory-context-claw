import os from "node:os";
import path from "node:path";

import {
  createCodexAdapterBridge,
  createContractId,
  createContractTimestamp,
  createMemoryRegistry,
  createProjectionSystem,
  createSourceSystem,
  createNamespaceKey,
  parseNamespace,
  parseVisibility,
  SHARED_CONTRACT_VERSION
} from "./unified-memory-core/index.js";
import { ingestDeclaredSourceToCandidate } from "./unified-memory-core/pipeline.js";

const DEFAULT_REGISTRY_DIR = path.join(
  os.homedir(),
  ".openclaw",
  "unified-memory-core",
  "registry"
);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeStringList(values, fallback) {
  if (!Array.isArray(values)) {
    return [...fallback];
  }
  const normalized = values
    .map((value) => normalizeString(value))
    .filter(Boolean);
  return normalized.length > 0 ? normalized : [...fallback];
}

function normalizeTaskPrompt(value) {
  return normalizeString(value).replace(/\s+/g, " ").trim();
}

function formatWriteBackContent(event) {
  const lines = [
    `task_id: ${event.task_id}`,
    `event_type: ${event.event_type}`,
    `task_title: ${event.task_title}`,
    `summary: ${event.summary}`
  ];
  if (event.details) {
    lines.push(`details: ${event.details}`);
  }
  if (event.tags.length > 0) {
    lines.push(`tags: ${event.tags.join(", ")}`);
  }
  return lines.join("\n");
}

function createWriteBackCandidateBuilder(event, clock) {
  return ({ sourceArtifact }) => {
    const now = createContractTimestamp(clock);
    return {
      artifact_id: createContractId("artifact"),
      artifact_type: "candidate_artifact",
      contract_version: SHARED_CONTRACT_VERSION,
      state: "candidate",
      namespace: sourceArtifact.namespace,
      visibility: event.visibility,
      title: `codex:${event.event_type}:${event.task_id}`,
      summary: event.summary,
      source_artifact_id: sourceArtifact.artifact_id,
      evidence_refs: [sourceArtifact.artifact_id],
      fingerprint: sourceArtifact.fingerprint,
      confidence: 0.66,
      attributes: {
        adapter: "codex",
        event_type: event.event_type,
        task_id: event.task_id,
        task_title: event.task_title,
        tags: event.tags,
        actor_id: event.actor_id,
        project_id: event.project_id,
        project_path: event.project_path,
        write_back_event_id: event.event_id
      },
      export_hints: ["codex", "write-back-review"],
      created_at: now,
      updated_at: now
    };
  };
}

export function resolveCodexAdapterConfig(raw = {}) {
  const projectPath = normalizeString(raw.projectPath, process.cwd());
  const projectId = normalizeString(raw.projectId, path.basename(projectPath) || "default-project");
  const userId = normalizeString(raw.userId, os.userInfo().username || "default-user");

  return {
    registryDir: normalizeString(raw.registryDir, DEFAULT_REGISTRY_DIR),
    projectPath,
    projectId,
    userId,
    tenant: normalizeString(raw.tenant, "local"),
    scope: normalizeString(raw.scope, "project"),
    resource: normalizeString(raw.resource, "shared-code-memory"),
    namespaceHint: normalizeString(raw.namespaceHint, `${projectId}-${userId}`),
    host: normalizeString(raw.host, ""),
    allowedVisibilities: normalizeStringList(
      raw.allowedVisibilities,
      ["private", "workspace", "shared", "public"]
    ),
    allowedStates: normalizeStringList(raw.allowedStates, ["stable"]),
    maxItems: Number.isFinite(raw.maxItems) ? Math.max(1, Math.min(20, Number(raw.maxItems))) : 6,
    writeBackVisibility: normalizeString(raw.writeBackVisibility, "workspace")
  };
}

export function createCodexWriteBackEvent(input = {}, context = {}, options = {}) {
  const clock = options.clock || (() => new Date());
  const config = resolveCodexAdapterConfig(context);
  const namespace = parseNamespace(
    options.namespace || {
      tenant: config.tenant,
      scope: config.scope,
      resource: config.resource,
      key: config.namespaceHint,
      ...(config.host ? { host: config.host } : {})
    }
  );

  const eventType = normalizeString(input.eventType || input.event_type, "task_result");
  const taskId = normalizeString(input.taskId || input.task_id, createContractId("task"));
  const taskTitle = normalizeTaskPrompt(input.taskTitle || input.task_title || "codex task");
  const summary = normalizeTaskPrompt(input.summary || input.resultSummary || input.content || "");
  if (!summary) {
    throw new TypeError("Codex write-back event requires a summary");
  }

  return {
    event_id: createContractId("codex_event"),
    contract_version: SHARED_CONTRACT_VERSION,
    event_type: eventType,
    namespace,
    visibility: parseVisibility(input.visibility || config.writeBackVisibility),
    actor_id: normalizeString(input.actorId || input.actor_id, config.userId),
    project_id: normalizeString(input.projectId || input.project_id, config.projectId),
    project_path: normalizeString(input.projectPath || input.project_path, config.projectPath),
    task_id: taskId,
    task_title: taskTitle,
    summary,
    details: normalizeTaskPrompt(input.details || ""),
    tags: normalizeStringList(input.tags, []),
    metadata: input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? { ...input.metadata }
      : {},
    emitted_at: createContractTimestamp(clock)
  };
}

export function mapCodexExportToTaskMemory(exportResult, { taskPrompt, maxItems }) {
  const items = Array.isArray(exportResult?.payload?.code_memory)
    ? exportResult.payload.code_memory
    : [];
  const memoryItems = items.slice(0, maxItems).map((item) => ({
    memory_id: item.memory_id,
    title: item.title,
    summary: item.summary,
    namespace: item.namespace,
    evidence_refs: item.evidence_refs,
    attributes: item.attributes,
    export_hints: item.export_hints
  }));

  const promptBlock = memoryItems.length === 0
    ? ""
    : [
        "## Shared Code Memory",
        ...memoryItems.map((item) => `- ${item.title}: ${item.summary}`)
      ].join("\n");

  return {
    task_prompt: normalizeTaskPrompt(taskPrompt),
    export_version: exportResult.exportVersion,
    export_contract: exportResult.exportContract,
    namespace: exportResult.exportContract.namespace,
    memory_items: memoryItems,
    prompt_block: promptBlock
  };
}

export function createCodexAdapterRuntime(options = {}) {
  const logger = options.logger;
  const clock = options.clock || (() => new Date());
  const config = resolveCodexAdapterConfig(options.config);
  const registry = createMemoryRegistry({
    rootDir: config.registryDir,
    clock
  });
  const projectionSystem = createProjectionSystem({
    registry,
    clock
  });
  const bridge = createCodexAdapterBridge({ projectionSystem });
  const sourceSystem = createSourceSystem({
    clock,
    defaultNamespace: {
      tenant: config.tenant,
      scope: config.scope,
      resource: config.resource,
      key: config.namespaceHint,
      ...(config.host ? { host: config.host } : {})
    },
    defaultVisibility: config.writeBackVisibility
  });
  const writeChains = new Map();

  async function readBeforeTask(input = {}) {
    const exportResult = await bridge.loadExports(
      {
        projectPath: normalizeString(input.projectPath, config.projectPath),
        projectId: normalizeString(input.projectId, config.projectId),
        userId: normalizeString(input.userId, config.userId),
        tenant: normalizeString(input.tenant, config.tenant),
        scope: normalizeString(input.scope, config.scope),
        resource: normalizeString(input.resource, config.resource),
        namespaceHint: normalizeString(
          input.namespaceHint,
          config.namespaceHint
        ),
        host: normalizeString(input.host, config.host)
      },
      {
        allowedVisibilities: input.allowedVisibilities || config.allowedVisibilities,
        allowedStates: input.allowedStates || config.allowedStates
      }
    );

    return mapCodexExportToTaskMemory(exportResult, {
      taskPrompt: input.taskPrompt || input.prompt || "",
      maxItems: Number.isFinite(input.maxItems)
        ? Math.max(1, Math.min(20, Number(input.maxItems)))
        : config.maxItems
    });
  }

  async function withNamespaceWriteLock(namespace, task) {
    const namespaceKey = createNamespaceKey(namespace);
    const previous = writeChains.get(namespaceKey) || Promise.resolve();
    const next = previous.then(task, task);
    const settled = next.finally(() => {
      if (writeChains.get(namespaceKey) === settled) {
        writeChains.delete(namespaceKey);
      }
    });
    writeChains.set(namespaceKey, settled);
    return settled;
  }

  async function writeAfterTask(input = {}) {
    const event = createCodexWriteBackEvent(input, {
      registryDir: config.registryDir,
      projectPath: normalizeString(input.projectPath, config.projectPath),
      projectId: normalizeString(input.projectId, config.projectId),
      userId: normalizeString(input.userId, config.userId),
      tenant: normalizeString(input.tenant, config.tenant),
      scope: normalizeString(input.scope, config.scope),
      resource: normalizeString(input.resource, config.resource),
      namespaceHint: normalizeString(input.namespaceHint, config.namespaceHint),
      host: normalizeString(input.host, config.host),
      writeBackVisibility: normalizeString(
        input.visibility,
        config.writeBackVisibility
      )
    }, { clock });

    return withNamespaceWriteLock(event.namespace, async () => {
      const persistence = await ingestDeclaredSourceToCandidate({
        declaredSource: {
          sourceType: "manual",
          declaredBy: `codex-adapter:${event.actor_id}`,
          namespace: event.namespace,
          visibility: event.visibility,
          content: formatWriteBackContent(event)
        },
        sourceSystem,
        registry,
        decidedBy: `codex-adapter:${event.actor_id}`,
        decisionMetadata: {
          write_back_event_id: event.event_id,
          event_type: event.event_type,
          task_id: event.task_id
        },
        candidateBuilder: createWriteBackCandidateBuilder(event, clock)
      });

      logger?.info?.(
        `[unified-memory-core] codex write-back persisted (event=${event.event_id}, namespace=${createNamespaceKey(event.namespace)})`
      );

      return {
        write_back_event: event,
        ...persistence
      };
    });
  }

  return {
    config,
    readBeforeTask,
    writeAfterTask
  };
}
