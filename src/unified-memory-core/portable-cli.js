import fs from "node:fs/promises";
import path from "node:path";

import { createStandaloneRuntime } from "./standalone-runtime.js";
import {
  classifyCliInvocation,
  renderCommandHelp,
  renderGroupHelp,
  renderRootHelp,
  renderUtilityHelp
} from "./cli-help.js";
import {
  renderDailyReflectionReport,
  renderExportReport,
  renderGovernanceAuditReport,
  renderLearningLifecycleReport,
  renderLearningWindowComparisonReport,
  renderPolicyAdaptationReport,
  renderRegistryMigrationReport,
  renderRegistryTopologyReport,
  renderStage34AcceptanceReport,
  renderGovernanceRepairRecord,
  renderGovernanceReplayRun,
  renderIndependentExecutionReview,
  renderMaintenanceWorkflowReport,
  renderExportReproducibilityReport,
  renderSplitRehearsalReport,
  renderStage5AcceptanceReport
} from "./index.js";

function parseArgs(argv) {
  const flags = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--help" || token === "-h") {
      flags.help = true;
      continue;
    }
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }

    const name = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      flags[name] = true;
      continue;
    }

    flags[name] = next;
    index += 1;
  }

  return {
    positionals,
    flags
  };
}

function buildWherePayload() {
  const backendPath = normalizeString(process.env.UMC_BACKEND_PATH, path.resolve(process.argv[1]));
  return {
    umc: normalizeString(process.env.UMC_WRAPPER_PATH, path.resolve(process.argv[1])),
    backend: backendPath,
    mode: normalizeString(process.env.UMC_BACKEND_MODE, "portable")
  };
}

function buildUsageError(message, helpText) {
  const error = new TypeError(message);
  error.code = "UMC_CLI_USAGE";
  error.helpText = helpText;
  return error;
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function parseNamespaceFromFlags(flags) {
  return {
    tenant: normalizeString(flags.tenant, "local"),
    scope: normalizeString(flags.scope, "workspace"),
    resource: normalizeString(flags.resource, "unified-memory-core"),
    key: normalizeString(flags.key, "default"),
    ...(normalizeString(flags.host, "") ? { host: normalizeString(flags.host, "") } : {})
  };
}

function parseListFlag(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberFlag(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function readDeclaredSourcesFile(filePath, flags) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const declaredSources = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.declaredSources)
      ? parsed.declaredSources
      : [];

  if (declaredSources.length === 0) {
    throw new TypeError("sources-file must contain an array or { declaredSources: [] }");
  }

  return declaredSources.map((item) => ({
    ...item,
    namespace: item.namespace || parseNamespaceFromFlags(flags),
    visibility: normalizeString(item.visibility, normalizeString(flags.visibility, "workspace")),
    declaredBy: normalizeString(item.declaredBy || item.declared_by, normalizeString(flags["declared-by"], "umc"))
  }));
}

function buildDeclaredSource(flags) {
  const sourceType = normalizeString(flags["source-type"], "manual");
  const declaredSource = {
    sourceType,
    declaredBy: normalizeString(flags["declared-by"], "umc"),
    namespace: parseNamespaceFromFlags(flags),
    visibility: normalizeString(flags.visibility, "workspace")
  };

  if (sourceType === "manual") {
    declaredSource.content = normalizeString(flags.content);
  } else if (sourceType === "conversation") {
    declaredSource.messages = [
      {
        role: normalizeString(flags.role, "user"),
        content: normalizeString(flags.content)
      }
    ];
  } else if (sourceType === "url") {
    declaredSource.url = normalizeString(flags.url || flags.path);
    declaredSource.content = normalizeString(flags.content);
    declaredSource.path = normalizeString(flags.path);
    declaredSource.title = normalizeString(flags.title);
    declaredSource.contentType = normalizeString(flags["content-type"]);
  } else if (sourceType === "image") {
    declaredSource.path = normalizeString(flags.path);
    declaredSource.altText = normalizeString(flags["alt-text"]);
    declaredSource.caption = normalizeString(flags.caption);
    declaredSource.ocrText = normalizeString(flags["ocr-text"]);
  } else {
    declaredSource.path = normalizeString(flags.path);
  }

  return declaredSource;
}

async function buildDeclaredSources(flags) {
  const sourcesFile = normalizeString(flags["sources-file"]);
  if (sourcesFile) {
    return readDeclaredSourcesFile(sourcesFile, flags);
  }
  return [buildDeclaredSource(flags)];
}

export async function runPortableCli(argv = process.argv.slice(2)) {
  const { positionals, flags } = parseArgs(argv);
  const programName = normalizeString(process.env.UMC_PROGRAM_NAME, "umc");
  const invocation = classifyCliInvocation(positionals, { mode: "portable" });
  const explicitHelpCommand = positionals[0] === "help";

  if (flags.help || explicitHelpCommand) {
    if (invocation.type === "command") {
      return renderCommandHelp(invocation.group.name, invocation.command.name, {
        programName,
        mode: "portable"
      });
    }
    if (invocation.type === "group") {
      return renderGroupHelp(invocation.group.name, {
        programName,
        mode: "portable"
      });
    }
    if (invocation.type === "utility") {
      return renderUtilityHelp(invocation.utility.name, { programName });
    }
    if (invocation.type === "unknown-subcommand") {
      throw buildUsageError(
        `Unknown subcommand: ${positionals[0]} ${invocation.name}`,
        renderGroupHelp(invocation.group.name, {
          programName,
          mode: "portable"
        })
      );
    }
    if (invocation.type === "unknown-group") {
      throw buildUsageError(
        `Unknown command: ${invocation.name}`,
        renderRootHelp({ programName, mode: "portable" })
      );
    }
    return renderRootHelp({ programName, mode: "portable" });
  }

  if (invocation.type === "root") {
    return renderRootHelp({ programName, mode: "portable" });
  }
  if (invocation.type === "group") {
    return renderGroupHelp(invocation.group.name, {
      programName,
      mode: "portable"
    });
  }
  if (invocation.type === "utility") {
    if (invocation.utility.name === "where") {
      return buildWherePayload();
    }
    return renderUtilityHelp(invocation.utility.name, { programName });
  }
  if (invocation.type === "unknown-subcommand") {
    throw buildUsageError(
      `Unknown subcommand: ${positionals[0]} ${invocation.name}`,
      renderGroupHelp(invocation.group.name, {
        programName,
        mode: "portable"
      })
    );
  }
  if (invocation.type === "unknown-group") {
    throw buildUsageError(
      `Unknown command: ${invocation.name}`,
      renderRootHelp({ programName, mode: "portable" })
    );
  }

  const family = invocation.group.name;
  const action = invocation.command.name;

  const runtime = createStandaloneRuntime({
    config: {
      registryDir: normalizeString(flags["registry-dir"], ""),
      namespace: parseNamespaceFromFlags(flags),
      visibility: normalizeString(flags.visibility, "workspace")
    }
  });

  let result;
  if (family === "source" && action === "add") {
    result = await runtime.addSource(buildDeclaredSource(flags), {
      persist: true
    });
  } else if (family === "registry" && action === "inspect") {
    const report = await runtime.inspectRegistryTopology();
    result = flags.format === "markdown"
      ? renderRegistryTopologyReport(report)
      : report;
  } else if (family === "registry" && action === "migrate") {
    const report = await runtime.migrateRegistryRoot({
      sourceDir: normalizeString(flags["source-dir"]),
      targetDir: normalizeString(flags["target-dir"]),
      apply: Boolean(flags.apply)
    });
    result = flags.format === "markdown"
      ? renderRegistryMigrationReport(report)
      : report;
  } else if (family === "learn" && action === "daily-run") {
    const declaredSources = await buildDeclaredSources(flags);
    const report = await runtime.runDailyReflection({
      declaredSources,
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: Boolean(flags.promote)
    });
    result = flags.format === "markdown"
      ? renderDailyReflectionReport(report)
      : report;
  } else if (family === "learn" && action === "lifecycle-run") {
    const declaredSources = await buildDeclaredSources(flags);
    const report = await runtime.runLearningLifecycle({
      declaredSources,
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: flags.promote !== false,
      comparisonWindowDays: parseNumberFlag(flags["comparison-window-days"], 7),
      maxOpenClawCandidates: parseNumberFlag(flags["max-openclaw-candidates"], 10)
    });
    result = flags.format === "markdown"
      ? renderLearningLifecycleReport(report.learning_audit)
      : report;
  } else if (family === "learn" && action === "policy-loop") {
    const declaredSources = await buildDeclaredSources(flags);
    const report = await runtime.runPolicyAdaptationLoop({
      declaredSources,
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: flags.promote !== false,
      query: normalizeString(flags.query, "summarize the current governed policy"),
      taskPrompt: normalizeString(flags["task-prompt"], "apply current governed coding policy"),
      comparisonWindowDays: parseNumberFlag(flags["comparison-window-days"], 7),
      maxCandidates: parseNumberFlag(flags["max-candidates"], 6),
      maxItems: parseNumberFlag(flags["max-items"], 6),
      maxPolicyInputs: parseNumberFlag(flags["max-policy-inputs"], 8)
    });
    result = flags.format === "markdown"
      ? renderPolicyAdaptationReport(report.policy_audit)
      : report;
  } else if (family === "verify" && action === "stage3-stage4") {
    const declaredSources = await buildDeclaredSources(flags);
    const report = await runtime.runStage34Acceptance({
      declaredSources,
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: flags.promote !== false,
      query: normalizeString(flags.query, "summarize the current governed policy"),
      taskPrompt: normalizeString(flags["task-prompt"], "apply current governed coding policy"),
      comparisonWindowDays: parseNumberFlag(flags["comparison-window-days"], 7),
      maxCandidates: parseNumberFlag(flags["max-candidates"], 6),
      maxItems: parseNumberFlag(flags["max-items"], 6),
      maxPolicyInputs: parseNumberFlag(flags["max-policy-inputs"], 8)
    });
    result = flags.format === "markdown"
      ? renderStage34AcceptanceReport(report)
      : report;
  } else if (family === "maintenance" && action === "run") {
    const declaredSources = await buildDeclaredSources(flags);
    const report = await runtime.runMaintenanceWorkflow({
      declaredSources,
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: flags.promote !== false,
      query: normalizeString(flags.query, "summarize the current governed policy"),
      taskPrompt: normalizeString(flags["task-prompt"], "apply current governed coding policy"),
      comparisonWindowDays: parseNumberFlag(flags["comparison-window-days"], 7),
      maxCandidates: parseNumberFlag(flags["max-candidates"], 6),
      maxItems: parseNumberFlag(flags["max-items"], 6),
      maxPolicyInputs: parseNumberFlag(flags["max-policy-inputs"], 8)
    });
    result = flags.format === "markdown"
      ? renderMaintenanceWorkflowReport(report)
      : report;
  } else if (family === "export" && action === "reproducibility") {
    const report = await runtime.auditExportReproducibility({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined),
      consumers: parseListFlag(flags.consumers, ["generic", "openclaw", "codex"]),
      runs: parseNumberFlag(flags.runs, 2),
      maxPolicyInputs: parseNumberFlag(flags["max-policy-inputs"], 8)
    });
    result = flags.format === "markdown"
      ? renderExportReproducibilityReport(report)
      : report;
  } else if (family === "reflect" && action === "run") {
    result = await runtime.reflectDeclaredSource({
      declaredSource: buildDeclaredSource(flags),
      dryRun: Boolean(flags["dry-run"]),
      promoteCandidates: Boolean(flags.promote)
    });
  } else if (family === "export" && action === "build") {
    result = await runtime.buildExport({
      consumer: normalizeString(flags.consumer, "generic"),
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
  } else if (family === "export" && action === "inspect") {
    const exportResult = await runtime.inspectExport({
      consumer: normalizeString(flags.consumer, "generic"),
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    result = flags.format === "markdown"
      ? renderExportReport(exportResult)
      : exportResult;
  } else if (family === "govern" && action === "audit") {
    const report = await runtime.auditNamespace({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    result = flags.format === "markdown"
      ? renderGovernanceAuditReport(report)
      : report;
  } else if (family === "govern" && action === "audit-learning") {
    const report = await runtime.auditLearningLifecycle({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined),
      maxOpenClawCandidates: parseNumberFlag(flags["max-openclaw-candidates"], 10)
    });
    result = flags.format === "markdown"
      ? renderLearningLifecycleReport(report)
      : report;
  } else if (family === "govern" && action === "compare-learning") {
    const report = await runtime.compareLearningTimeWindows({
      namespace: parseNamespaceFromFlags(flags),
      currentWindowDays: parseNumberFlag(flags["current-window-days"], 7),
      previousWindowDays: parseNumberFlag(flags["previous-window-days"], 7)
    });
    result = flags.format === "markdown"
      ? renderLearningWindowComparisonReport(report)
      : report;
  } else if (family === "govern" && action === "audit-policy") {
    const report = await runtime.auditPolicyAdaptation({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined),
      maxPolicyInputs: parseNumberFlag(flags["max-policy-inputs"], 8)
    });
    result = flags.format === "markdown"
      ? renderPolicyAdaptationReport(report)
      : report;
  } else if (family === "govern" && action === "repair") {
    const record = await runtime.planRepair({
      namespace: parseNamespaceFromFlags(flags),
      findingCode: normalizeString(flags["finding-code"]),
      action: normalizeString(flags.action, "mark_for_review"),
      decidedBy: normalizeString(flags["decided-by"], "umc"),
      targetRecordIds: parseListFlag(flags["target-record-ids"], undefined),
      dryRun: flags["dry-run"] !== false,
      notes: parseListFlag(flags.notes, []),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    result = flags.format === "markdown"
      ? renderGovernanceRepairRecord(record)
      : record;
  } else if (family === "govern" && action === "repair-learning") {
    const report = await runtime.auditLearningLifecycle({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    const record = await runtime.planLearningRepair({
      namespace: parseNamespaceFromFlags(flags),
      findingCode: normalizeString(flags["finding-code"]),
      action: normalizeString(flags.action, "mark_learning_review"),
      decidedBy: normalizeString(flags["decided-by"], "umc"),
      targetRecordIds: parseListFlag(flags["target-record-ids"], []),
      dryRun: flags["dry-run"] !== false,
      notes: parseListFlag(flags.notes, []),
      report
    });
    result = flags.format === "markdown"
      ? renderGovernanceRepairRecord(record)
      : record;
  } else if (family === "govern" && action === "replay") {
    const replay = await runtime.planReplay({
      namespace: parseNamespaceFromFlags(flags),
      replayedBy: normalizeString(flags["replayed-by"], "umc"),
      exportId: normalizeString(flags["export-id"]),
      inputRefs: parseListFlag(flags["input-refs"], undefined),
      result: normalizeString(flags.result, "queued"),
      notes: parseListFlag(flags.notes, []),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    result = flags.format === "markdown"
      ? renderGovernanceReplayRun(replay)
      : replay;
  } else if (family === "govern" && action === "replay-learning") {
    const report = await runtime.auditLearningLifecycle({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    const replay = await runtime.planLearningReplay({
      namespace: parseNamespaceFromFlags(flags),
      replayedBy: normalizeString(flags["replayed-by"], "umc"),
      exportId: normalizeString(flags["export-id"]),
      inputRefs: parseListFlag(flags["input-refs"], []),
      result: normalizeString(flags.result, "queued"),
      notes: parseListFlag(flags.notes, []),
      report
    });
    result = flags.format === "markdown"
      ? renderGovernanceReplayRun(replay)
      : replay;
  } else if (family === "review" && action === "independent-execution") {
    const review = await runtime.reviewIndependentExecution({
      repoRoot: normalizeString(flags["repo-root"], process.cwd())
    });
    result = flags.format === "markdown"
      ? renderIndependentExecutionReview(review)
      : review;
  } else if (family === "review" && action === "split-rehearsal") {
    const rehearsal = await runtime.runSplitRehearsal({
      repoRoot: normalizeString(flags["repo-root"], process.cwd()),
      sourceDir: normalizeString(flags["source-dir"], runtime.config.registryDir),
      targetDir: normalizeString(flags["target-dir"], `${runtime.config.registryDir}-split-rehearsal`),
      apply: Boolean(flags.apply)
    });
    result = flags.format === "markdown"
      ? renderSplitRehearsalReport(rehearsal)
      : rehearsal;
  } else if (family === "verify" && action === "stage5") {
    const declaredSources = await buildDeclaredSources(flags);
    const report = await runtime.runStage5Acceptance({
      declaredSources,
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: flags.promote !== false,
      query: normalizeString(flags.query, "summarize the current governed policy"),
      taskPrompt: normalizeString(flags["task-prompt"], "apply current governed coding policy"),
      comparisonWindowDays: parseNumberFlag(flags["comparison-window-days"], 7),
      maxCandidates: parseNumberFlag(flags["max-candidates"], 6),
      maxItems: parseNumberFlag(flags["max-items"], 6),
      maxPolicyInputs: parseNumberFlag(flags["max-policy-inputs"], 8),
      repoRoot: normalizeString(flags["repo-root"], process.cwd()),
      splitTargetDir: normalizeString(flags["target-dir"], `${runtime.config.registryDir}-split-rehearsal`)
    });
    result = flags.format === "markdown"
      ? renderStage5AcceptanceReport(report)
      : report;
  } else {
    return renderRootHelp({ programName, mode: "portable" });
  }

  return result;
}

export async function runPortableCliAsMain(argv = process.argv.slice(2)) {
  try {
    const result = await runPortableCli(argv);
    if (typeof result === "string") {
      console.log(result);
      return;
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error && error.code === "UMC_CLI_USAGE") {
      console.error(error.message);
      if (error.helpText) {
        console.log(error.helpText);
      }
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}
