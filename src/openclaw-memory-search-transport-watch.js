function classifyFailureClass(item = {}) {
  const status = String(item.status || "");
  const errorText = String(item.error || "").toLowerCase();
  const stderrPreview = String(item.stderrPreview || "").toLowerCase();
  const joined = `${errorText}\n${stderrPreview}`;

  if (status === "ok") return "ok";
  if (status === "timeout") return "timeout";
  if (status === "empty_results") return "empty_results";
  if (status === "invalid_json") {
    if (!joined.trim()) return "missing_json_payload";
    if (joined.includes("gateway")) return "gateway_noise";
    if (joined.includes("session")) return "session_noise";
    return "missing_json_payload";
  }
  if (status === "command_failed") {
    if (joined.includes("timed out")) return "timeout";
    if (joined.includes("gateway")) return "gateway_noise";
    if (joined.includes("session")) return "session_noise";
    return "command_failed";
  }
  return "other_failure";
}

export function summarizeTransportProbeResults(results = []) {
  const summary = {
    total: results.length,
    ok: 0,
    emptyResults: 0,
    timeout: 0,
    invalidJson: 0,
    commandFailed: 0,
    otherFailure: 0,
    averageDurationMs: 0,
    maxDurationMs: 0,
    watchlist: [],
    byCategory: {},
    byFailureClass: {}
  };

  const durations = [];

  for (const item of results) {
    const category = item.category || "unknown";
    summary.byCategory[category] ||= { total: 0, ok: 0, failures: 0, averageDurationMs: 0, maxDurationMs: 0 };
    summary.byCategory[category].total += 1;
    if (Number.isFinite(item.durationMs)) {
      durations.push(item.durationMs);
      const bucket = summary.byCategory[category];
      bucket.averageDurationMs += item.durationMs;
      bucket.maxDurationMs = Math.max(bucket.maxDurationMs, item.durationMs);
    }

    switch (item.status) {
      case "ok":
        summary.ok += 1;
        summary.byCategory[category].ok += 1;
        summary.byFailureClass.ok = (summary.byFailureClass.ok || 0) + 1;
        break;
      case "empty_results":
        summary.emptyResults += 1;
        summary.byCategory[category].failures += 1;
        summary.byFailureClass.empty_results = (summary.byFailureClass.empty_results || 0) + 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          failureClass: classifyFailureClass(item),
          reason: "raw openclaw memory search returned no results"
        });
        break;
      case "timeout":
        summary.timeout += 1;
        summary.byCategory[category].failures += 1;
        summary.byFailureClass.timeout = (summary.byFailureClass.timeout || 0) + 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          failureClass: classifyFailureClass(item),
          reason: "raw openclaw memory search timed out"
        });
        break;
      case "invalid_json":
        summary.invalidJson += 1;
        summary.byCategory[category].failures += 1;
        {
          const failureClass = classifyFailureClass(item);
          summary.byFailureClass[failureClass] = (summary.byFailureClass[failureClass] || 0) + 1;
        }
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          failureClass: classifyFailureClass(item),
          reason: "raw openclaw memory search returned a non-JSON payload"
        });
        break;
      case "command_failed":
        summary.commandFailed += 1;
        summary.byCategory[category].failures += 1;
        {
          const failureClass = classifyFailureClass(item);
          summary.byFailureClass[failureClass] = (summary.byFailureClass[failureClass] || 0) + 1;
        }
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          failureClass: classifyFailureClass(item),
          reason: item.error || "raw openclaw memory search command failed"
        });
        break;
      default:
        summary.otherFailure += 1;
        summary.byCategory[category].failures += 1;
        {
          const failureClass = classifyFailureClass(item);
          summary.byFailureClass[failureClass] = (summary.byFailureClass[failureClass] || 0) + 1;
        }
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status || "other_failure",
          failureClass: classifyFailureClass(item),
          reason: item.error || "unexpected raw transport failure"
        });
        break;
    }
  }

  if (durations.length > 0) {
    summary.averageDurationMs = Math.round(
      durations.reduce((sum, value) => sum + value, 0) / durations.length
    );
    summary.maxDurationMs = Math.max(...durations);
  }
  for (const bucket of Object.values(summary.byCategory)) {
    if (bucket.total > 0) {
      bucket.averageDurationMs = Math.round(bucket.averageDurationMs / bucket.total);
    }
  }

  return summary;
}

export function renderTransportWatchReport(report, { generatedAt } = {}) {
  const summary = report?.summary || summarizeTransportProbeResults(report?.results || []);
  const lines = [];
  lines.push("# OpenClaw Memory Search Transport Watchlist");
  lines.push("");
  if (generatedAt) {
    lines.push(`- generatedAt: \`${generatedAt}\``);
  }
  lines.push(`- totalProbes: \`${summary.total}\``);
  lines.push(`- rawOk: \`${summary.ok}\``);
  lines.push(`- emptyResults: \`${summary.emptyResults}\``);
  lines.push(`- timeout: \`${summary.timeout}\``);
  lines.push(`- invalidJson: \`${summary.invalidJson}\``);
  lines.push(`- commandFailed: \`${summary.commandFailed}\``);
  lines.push(`- otherFailure: \`${summary.otherFailure}\``);
  lines.push(`- averageDurationMs: \`${summary.averageDurationMs}\``);
  lines.push(`- maxDurationMs: \`${summary.maxDurationMs}\``);
  lines.push("");
  lines.push("## Category Summary");
  for (const [category, stats] of Object.entries(summary.byCategory)) {
    lines.push(`- ${category}: ok=\`${stats.ok}\` failures=\`${stats.failures}\` total=\`${stats.total}\` avgMs=\`${stats.averageDurationMs}\` maxMs=\`${stats.maxDurationMs}\``);
  }
  lines.push("");
  lines.push("## Failure Classes");
  for (const [failureClass, count] of Object.entries(summary.byFailureClass || {})) {
    lines.push(`- ${failureClass}: \`${count}\``);
  }
  lines.push("");
  lines.push("## Watchlist");
  if (summary.watchlist.length === 0) {
    lines.push("- none");
  } else {
    for (const item of summary.watchlist) {
      lines.push(`- ${item.id} [${item.category}] \`${item.status}\` / \`${item.failureClass || "unknown"}\`: ${item.reason}`);
    }
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("- This watchlist tracks raw `openclaw memory search` transport health only.");
  lines.push("- Failures here should not be counted as Unified Memory Core retrieval algorithm regressions when sqlite fallback or agent-path evidence remains green.");
  lines.push("- Use this report to separate host transport instability from plugin-side retrieval and assembly work.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}
