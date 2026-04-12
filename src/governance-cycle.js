export function renderGovernanceCycleReport(result, { generatedAt, workspaceRoot } = {}) {
  const lines = [];
  lines.push("# Governance Cycle Report");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  if (workspaceRoot) {
    lines.push(`- 工作区：${workspaceRoot}`);
  }
  lines.push("");

  lines.push("## Formal Memory Audit");
  lines.push(`- total: \`${result.formalAudit?.summary?.total ?? 0}\``);
  lines.push(`- clean: \`${result.formalAudit?.summary?.clean ?? 0}\``);
  lines.push(`- pendingRisk: \`${result.formalAudit?.summary?.pendingRisk ?? 0}\``);
  lines.push(`- archiveReview: \`${result.formalAudit?.summary?.archiveReview ?? 0}\``);
  lines.push("");

  if (result.postGovernanceFormalAudit) {
    lines.push("## Formal Memory Audit (Post-Governance)");
    lines.push(`- total: \`${result.postGovernanceFormalAudit?.summary?.total ?? 0}\``);
    lines.push(`- clean: \`${result.postGovernanceFormalAudit?.summary?.clean ?? 0}\``);
    lines.push(`- pendingRisk: \`${result.postGovernanceFormalAudit?.summary?.pendingRisk ?? 0}\``);
    lines.push(`- archiveReview: \`${result.postGovernanceFormalAudit?.summary?.archiveReview ?? 0}\``);
    lines.push("");
  }

  lines.push("## Session-Memory Exit Audit");
  lines.push(`- total: \`${result.sessionExitAudit?.summary?.total ?? 0}\``);
  lines.push(`- cardBackedFact: \`${result.sessionExitAudit?.summary?.cardBackedFact ?? 0}\``);
  lines.push(`- cardBackedReview: \`${result.sessionExitAudit?.summary?.cardBackedReview ?? 0}\``);
  lines.push(`- rawOnly: \`${result.sessionExitAudit?.summary?.rawOnly ?? 0}\``);
  lines.push("");

  lines.push("## Fact Conflict Audit");
  lines.push(`- slotsScanned: \`${result.factConflictAudit?.summary?.slotsScanned ?? 0}\``);
  lines.push(`- conflicts: \`${result.factConflictAudit?.summary?.conflicts ?? 0}\``);
  lines.push("");

  lines.push("## Fact Duplicate Audit");
  lines.push(`- cardsScanned: \`${result.factDuplicateAudit?.summary?.cardsScanned ?? 0}\``);
  lines.push(`- duplicateFacts: \`${result.factDuplicateAudit?.summary?.duplicateFacts ?? 0}\``);
  lines.push(`- duplicateSlotValues: \`${result.factDuplicateAudit?.summary?.duplicateSlotValues ?? 0}\``);
  lines.push(`- acceptableLayered: \`${result.factDuplicateAudit?.summary?.acceptableLayered ?? 0}\``);
  lines.push(`- review: \`${result.factDuplicateAudit?.summary?.review ?? 0}\``);
  lines.push("");

  lines.push("## Memory Search Governance");
  if (result.memorySearchGovernance?.summary) {
    lines.push(`- cases: \`${result.memorySearchGovernance.summary.cases ?? 0}\``);
    lines.push(`- builtinSignalHits: \`${result.memorySearchGovernance.summary.builtinSignalHits ?? 0}\``);
    lines.push(`- builtinSourceHits: \`${result.memorySearchGovernance.summary.builtinSourceHits ?? 0}\``);
    lines.push(`- pluginSignalHits: \`${result.memorySearchGovernance.summary.pluginSignalHits ?? 0}\``);
    lines.push(`- pluginSourceHits: \`${result.memorySearchGovernance.summary.pluginSourceHits ?? 0}\``);
    lines.push(`- pluginFastPathLikely: \`${result.memorySearchGovernance.summary.pluginFastPathLikely ?? 0}\``);
    lines.push(`- pluginFailures: \`${result.memorySearchGovernance.summary.pluginFailures ?? 0}\``);
  } else {
    lines.push("- skipped");
  }
  lines.push("");

  lines.push("## Registry Root Governance");
  if (result.registryRootGovernance?.summary) {
    lines.push(`- activeRoot: \`${result.registryRootGovernance.summary.activeRoot ?? ""}\``);
    lines.push(`- activeSource: \`${result.registryRootGovernance.summary.activeSource ?? ""}\``);
    lines.push(`- migrationNeeded: \`${result.registryRootGovernance.summary.migrationNeeded ?? false}\``);
    lines.push(`- cutoverReady: \`${result.registryRootGovernance.summary.cutoverReady ?? false}\``);
    lines.push(`- findingCount: \`${result.registryRootGovernance.summary.findingCount ?? 0}\``);
    lines.push(`- warningCount: \`${result.registryRootGovernance.summary.warningCount ?? 0}\``);
    lines.push(`- errorCount: \`${result.registryRootGovernance.summary.errorCount ?? 0}\``);
  } else {
    lines.push("- skipped");
  }
  lines.push("");

  lines.push("## Safe Governance");
  lines.push(`- candidates: \`${(result.safeGovernance?.candidates || []).length}\``);
  lines.push(`- applied: \`${result.safeGovernance?.applied ? "yes" : "no"}\``);
  lines.push(`- moved: \`${(result.safeGovernance?.moved || []).length}\``);
  if (result.safeGovernance?.archiveDir) {
    lines.push(`- archiveDir: \`${result.safeGovernance.archiveDir}\``);
  }
  lines.push("");

  lines.push("## Critical Hot-Session Regression");
  if (result.liveRegression) {
    lines.push(`- cases: \`${result.liveRegression.summary?.cases ?? 0}\``);
    lines.push(`- passed: \`${result.liveRegression.summary?.passed ?? 0}\``);
    lines.push(`- failed: \`${result.liveRegression.summary?.failed ?? 0}\``);
    lines.push(`- isolated: \`${result.liveRegression.summary?.isolated ?? 0}\``);
    lines.push(`- hotMainAlias: \`${result.liveRegression.summary?.hotMainAlias ?? 0}\``);
    lines.push(`- matchedRequestedSessionId: \`${result.liveRegression.summary?.matchedRequestedSessionId ?? 0}\``);
    lines.push("- note: this is a hot-session check for `main`, not a guaranteed isolated-session baseline");
  } else {
    lines.push("- skipped");
  }
  lines.push("");

  if (Array.isArray(result.safeGovernance?.candidates) && result.safeGovernance.candidates.length) {
    lines.push("## Safe Governance Candidates");
    for (const candidate of result.safeGovernance.candidates) {
      lines.push(`- ${candidate}`);
    }
    lines.push("");
  }

  if (Array.isArray(result.safeGovernance?.moved) && result.safeGovernance.moved.length) {
    lines.push("## Moved");
    for (const item of result.safeGovernance.moved) {
      lines.push(`- ${item.from} -> ${item.to}`);
    }
    lines.push("");
  }

  if (Array.isArray(result.registryRootGovernance?.findings) && result.registryRootGovernance.findings.length) {
    lines.push("## Registry Root Findings");
    for (const finding of result.registryRootGovernance.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
