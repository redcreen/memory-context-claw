#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

import { createStandaloneRuntime } from "../src/unified-memory-core/standalone-runtime.js";
import {
  buildOpenClawReleaseBundle,
  renderOpenClawReleaseBundleReport
} from "./build-openclaw-release-bundle.js";
import {
  runOpenClawBundleInstallVerification,
  renderOpenClawBundleInstallReport
} from "./run-openclaw-bundle-install.js";
import {
  runReleasePreflight,
  renderReleasePreflightReport
} from "./run-release-preflight.js";
import {
  classifyCliInvocation,
  renderCommandHelp,
  renderGroupHelp,
  renderRootHelp,
  renderUtilityHelp
} from "../src/unified-memory-core/cli-help.js";
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
} from "../src/unified-memory-core/index.js";

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
    mode: normalizeString(process.env.UMC_BACKEND_MODE, "full")
  };
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

function parseBooleanFlag(value, fallback) {
  if (typeof value === "boolean") {
    return value;
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
    declaredBy: normalizeString(item.declaredBy || item.declared_by, normalizeString(flags["declared-by"], "standalone-cli"))
  }));
}

function buildDeclaredSource(flags) {
  const sourceType = normalizeString(flags["source-type"], "manual");
  const declaredSource = {
    sourceType,
    declaredBy: normalizeString(flags["declared-by"], "standalone-cli"),
    namespace: parseNamespaceFromFlags(flags),
    visibility: normalizeString(flags.visibility, "workspace")
  };

  if (sourceType === "manual") {
    declaredSource.content = normalizeString(flags.content);
  } else if (sourceType === "accepted_action") {
    declaredSource.actionType = normalizeString(flags["action-type"]);
    declaredSource.status = normalizeString(flags.status, "succeeded");
    declaredSource.accepted = parseBooleanFlag(flags.accepted, true);
    declaredSource.succeeded = parseBooleanFlag(flags.succeeded, /success|succeed|applied|completed|done/iu.test(normalizeString(flags.status, "succeeded")));
    declaredSource.agentId = normalizeString(flags["agent-id"]);
    declaredSource.targets = parseListFlag(flags.targets, []);
    declaredSource.artifacts = parseListFlag(flags.artifacts, []);
    declaredSource.content = normalizeString(flags.content || flags.summary);
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

async function run() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const programName = normalizeString(process.env.UMC_PROGRAM_NAME, "umc");
  const invocation = classifyCliInvocation(positionals, { mode: "full" });
  const explicitHelpCommand = positionals[0] === "help";

  if (flags.help || explicitHelpCommand) {
    if (invocation.type === "command") {
      console.log(renderCommandHelp(invocation.group.name, invocation.command.name, {
        programName,
        mode: "full"
      }));
      return;
    }
    if (invocation.type === "group") {
      console.log(renderGroupHelp(invocation.group.name, {
        programName,
        mode: "full"
      }));
      return;
    }
    if (invocation.type === "utility") {
      console.log(renderUtilityHelp(invocation.utility.name, { programName }));
      return;
    }
    if (invocation.type === "unknown-subcommand") {
      console.error(`Unknown subcommand: ${positionals[0]} ${invocation.name}`);
      console.log(renderGroupHelp(invocation.group.name, {
        programName,
        mode: "full"
      }));
      process.exitCode = 1;
      return;
    }
    if (invocation.type === "unknown-group") {
      console.error(`Unknown command: ${invocation.name}`);
      console.log(renderRootHelp({ programName, mode: "full" }));
      process.exitCode = 1;
      return;
    }
    console.log(renderRootHelp({ programName, mode: "full" }));
    return;
  }

  if (invocation.type === "root") {
    console.log(renderRootHelp({ programName, mode: "full" }));
    return;
  }
  if (invocation.type === "group") {
    console.log(renderGroupHelp(invocation.group.name, {
      programName,
      mode: "full"
    }));
    return;
  }
  if (invocation.type === "utility") {
    if (invocation.utility.name === "where") {
      console.log(JSON.stringify(buildWherePayload(), null, 2));
      return;
    }
    console.log(renderUtilityHelp(invocation.utility.name, { programName }));
    return;
  }
  if (invocation.type === "unknown-group") {
    console.error(`Unknown command: ${invocation.name}`);
    console.log(renderRootHelp({ programName, mode: "full" }));
    process.exitCode = 1;
    return;
  }
  if (invocation.type === "unknown-subcommand") {
    console.error(`Unknown subcommand: ${positionals[0]} ${invocation.name}`);
    console.log(renderGroupHelp(invocation.group.name, {
      programName,
      mode: "full"
    }));
    process.exitCode = 1;
    return;
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
      decidedBy: normalizeString(flags["decided-by"], "standalone-cli"),
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
      decidedBy: normalizeString(flags["decided-by"], "standalone-cli"),
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
      replayedBy: normalizeString(flags["replayed-by"], "standalone-cli"),
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
      replayedBy: normalizeString(flags["replayed-by"], "standalone-cli"),
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
  } else if (family === "release" && action === "build-bundle") {
    const report = await buildOpenClawReleaseBundle({
      repoRoot: normalizeString(flags["repo-root"], process.cwd()),
      outputDir: normalizeString(flags["output-dir"], path.join(process.cwd(), "dist", "openclaw-release"))
    });
    result = flags.format === "markdown"
      ? renderOpenClawReleaseBundleReport(report)
      : report;
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
  } else if (family === "verify" && action === "openclaw-install") {
    const report = await runOpenClawBundleInstallVerification({
      openclawBin: normalizeString(flags["openclaw-bin"], "openclaw"),
      profile: normalizeString(flags.profile),
      profileExplicit: Boolean(flags.profile),
      keepProfile: Boolean(flags["keep-profile"]),
      keepBundle: Boolean(flags["keep-bundle"]),
      format: normalizeString(flags.format, "json"),
      agentId: normalizeString(flags.agent, "main"),
      preset: normalizeString(flags.preset, "safe-local"),
      workspacePath: normalizeString(flags.workspace),
      workspaceExplicit: Boolean(flags.workspace),
      query: normalizeString(flags.query, "concise progress"),
      expectedText: normalizeString(flags["expected-text"], "concise progress reports"),
      repoRoot: normalizeString(flags["repo-root"], process.cwd()),
      outputDir: normalizeString(flags["output-dir"]),
      archivePath: normalizeString(flags.archive)
    });
    result = flags.format === "markdown"
      ? renderOpenClawBundleInstallReport(report)
      : report;
  } else if (family === "verify" && action === "release-preflight") {
    const report = await runReleasePreflight({
      repoRoot: normalizeString(flags["repo-root"], process.cwd())
    });
    result = flags.format === "markdown"
      ? renderReleasePreflightReport(report)
      : report;
  } else {
    console.log(renderRootHelp({ programName, mode: "full" }));
    return;
  }

  if (typeof result === "string") {
    console.log(result);
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
