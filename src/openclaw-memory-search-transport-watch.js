export function summarizeTransportProbeResults(results = []) {
  const summary = {
    total: results.length,
    ok: 0,
    emptyResults: 0,
    timeout: 0,
    invalidJson: 0,
    commandFailed: 0,
    otherFailure: 0,
    watchlist: [],
    byCategory: {}
  };

  for (const item of results) {
    const category = item.category || "unknown";
    summary.byCategory[category] ||= { total: 0, ok: 0, failures: 0 };
    summary.byCategory[category].total += 1;

    switch (item.status) {
      case "ok":
        summary.ok += 1;
        summary.byCategory[category].ok += 1;
        break;
      case "empty_results":
        summary.emptyResults += 1;
        summary.byCategory[category].failures += 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          reason: "raw openclaw memory search returned no results"
        });
        break;
      case "timeout":
        summary.timeout += 1;
        summary.byCategory[category].failures += 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          reason: "raw openclaw memory search timed out"
        });
        break;
      case "invalid_json":
        summary.invalidJson += 1;
        summary.byCategory[category].failures += 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          reason: "raw openclaw memory search returned a non-JSON payload"
        });
        break;
      case "command_failed":
        summary.commandFailed += 1;
        summary.byCategory[category].failures += 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status,
          reason: item.error || "raw openclaw memory search command failed"
        });
        break;
      default:
        summary.otherFailure += 1;
        summary.byCategory[category].failures += 1;
        summary.watchlist.push({
          id: item.id,
          category,
          status: item.status || "other_failure",
          reason: item.error || "unexpected raw transport failure"
        });
        break;
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
  lines.push("");
  lines.push("## Category Summary");
  for (const [category, stats] of Object.entries(summary.byCategory)) {
    lines.push(`- ${category}: ok=\`${stats.ok}\` failures=\`${stats.failures}\` total=\`${stats.total}\``);
  }
  lines.push("");
  lines.push("## Watchlist");
  if (summary.watchlist.length === 0) {
    lines.push("- none");
  } else {
    for (const item of summary.watchlist) {
      lines.push(`- ${item.id} [${item.category}] \`${item.status}\`: ${item.reason}`);
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
