#!/usr/bin/env node

import { createStandaloneRuntime } from "../src/unified-memory-core/standalone-runtime.js";
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
  renderIndependentExecutionReview
} from "../src/unified-memory-core/index.js";

function parseArgs(argv) {
  const flags = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
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
  } else if (sourceType === "conversation") {
    declaredSource.messages = [
      {
        role: normalizeString(flags.role, "user"),
        content: normalizeString(flags.content)
      }
    ];
  } else {
    declaredSource.path = normalizeString(flags.path);
  }

  return declaredSource;
}

async function run() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const [family = "help", action = ""] = positionals;
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
    const report = await runtime.runDailyReflection({
      declaredSources: [buildDeclaredSource(flags)],
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: Boolean(flags.promote)
    });
    result = flags.format === "markdown"
      ? renderDailyReflectionReport(report)
      : report;
  } else if (family === "learn" && action === "lifecycle-run") {
    const report = await runtime.runLearningLifecycle({
      declaredSources: [buildDeclaredSource(flags)],
      dryRun: Boolean(flags["dry-run"]),
      autoPromote: flags.promote !== false,
      comparisonWindowDays: parseNumberFlag(flags["comparison-window-days"], 7),
      maxOpenClawCandidates: parseNumberFlag(flags["max-openclaw-candidates"], 10)
    });
    result = flags.format === "markdown"
      ? renderLearningLifecycleReport(report.learning_audit)
      : report;
  } else if (family === "learn" && action === "policy-loop") {
    const report = await runtime.runPolicyAdaptationLoop({
      declaredSources: [buildDeclaredSource(flags)],
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
    const report = await runtime.runStage34Acceptance({
      declaredSources: [buildDeclaredSource(flags)],
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
  } else {
    result = {
      usage: [
        "source add --source-type manual --content 'text'",
        "registry inspect [--format markdown]",
        "registry migrate [--source-dir <dir>] [--target-dir <dir>] [--apply] [--format markdown]",
        "learn daily-run --source-type manual --content 'text' [--dry-run] [--promote]",
        "learn lifecycle-run --source-type manual --content 'text' [--dry-run] [--format markdown]",
        "learn policy-loop --source-type manual --content 'text' [--query <text>] [--task-prompt <text>] [--format markdown]",
        "verify stage3-stage4 --source-type manual --content 'text' [--query <text>] [--task-prompt <text>] [--format markdown]",
        "reflect run --source-type manual --content 'text' [--dry-run] [--promote]",
        "export build --consumer generic",
        "export inspect --consumer generic [--format markdown]",
        "govern audit [--format markdown]",
        "govern audit-learning [--format markdown]",
        "govern audit-policy [--format markdown]",
        "govern compare-learning [--current-window-days 7] [--previous-window-days 7] [--format markdown]",
        "govern repair --finding-code candidate_missing_decision_trail --action mark_for_review [--format markdown]",
        "govern repair-learning --finding-code learning_candidate_ready_for_decay [--format markdown]",
        "govern replay [--result queued] [--format markdown]",
        "govern replay-learning [--result queued] [--format markdown]",
        "review independent-execution [--format markdown]"
      ]
    };
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
