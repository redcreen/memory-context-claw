export function summarizeMemorySearchResults(results = []) {
  const items = Array.isArray(results) ? results : [];
  const summary = {
    cases: items.length,
    builtinSignalHits: 0,
    builtinSourceHits: 0,
    pluginSignalHits: 0,
    pluginSourceHits: 0,
    pluginFastPathLikely: 0,
    builtinFailures: 0,
    pluginFailures: 0,
    watchlist: []
  };

  for (const item of items) {
    if (item?.builtin?.expectedSignalsHit) {
      summary.builtinSignalHits += 1;
    }
    if (item?.builtin?.expectedSourceHit) {
      summary.builtinSourceHits += 1;
    }
    if (item?.plugin?.expectedSignalsHit) {
      summary.pluginSignalHits += 1;
    }
    if (item?.plugin?.expectedSourceHit) {
      summary.pluginSourceHits += 1;
    }
    if (item?.plugin?.fastPathLikely) {
      summary.pluginFastPathLikely += 1;
    }

    const builtinFailure = !item?.builtin?.expectedSignalsHit || !item?.builtin?.expectedSourceHit;
    const pluginFailure = !item?.plugin?.expectedSignalsHit || !item?.plugin?.expectedSourceHit;

    if (builtinFailure) {
      summary.builtinFailures += 1;
    }
    if (pluginFailure) {
      summary.pluginFailures += 1;
      summary.watchlist.push({
        id: item?.id || "",
        query: item?.query || "",
        pluginSignals: !!item?.plugin?.expectedSignalsHit,
        pluginSource: !!item?.plugin?.expectedSourceHit,
        builtinSignals: !!item?.builtin?.expectedSignalsHit,
        builtinSource: !!item?.builtin?.expectedSourceHit
      });
    }
  }

  return summary;
}

export function renderMemorySearchGovernanceReport(result, { generatedAt } = {}) {
  const summary = result?.summary || summarizeMemorySearchResults(result?.results || []);
  const lines = [];
  lines.push("# Memory Search Governance Report");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- cases: \`${summary.cases}\``);
  lines.push(`- builtinSignalHits: \`${summary.builtinSignalHits}\``);
  lines.push(`- builtinSourceHits: \`${summary.builtinSourceHits}\``);
  lines.push(`- pluginSignalHits: \`${summary.pluginSignalHits}\``);
  lines.push(`- pluginSourceHits: \`${summary.pluginSourceHits}\``);
  lines.push(`- pluginFastPathLikely: \`${summary.pluginFastPathLikely}\``);
  lines.push(`- builtinFailures: \`${summary.builtinFailures}\``);
  lines.push(`- pluginFailures: \`${summary.pluginFailures}\``);
  lines.push("");

  if (Array.isArray(summary.watchlist) && summary.watchlist.length > 0) {
    lines.push("## Watchlist");
    for (const item of summary.watchlist) {
      lines.push(`- \`${item.id}\`: builtin(signal=${item.builtinSignals ? "ok" : "miss"}, source=${item.builtinSource ? "ok" : "miss"}), plugin(signal=${item.pluginSignals ? "ok" : "miss"}, source=${item.pluginSource ? "ok" : "miss"})`);
      if (item.query) {
        lines.push(`  query: \`${item.query}\``);
      }
    }
    lines.push("");
  }

  if (Array.isArray(result?.results) && result.results.length > 0) {
    lines.push("## Cases");
    for (const item of result.results) {
      lines.push(`- \`${item.id}\``);
      lines.push(`  - builtin: signal=\`${item?.builtin?.expectedSignalsHit ? "ok" : "miss"}\`, source=\`${item?.builtin?.expectedSourceHit ? "ok" : "miss"}\``);
      lines.push(`  - plugin: signal=\`${item?.plugin?.expectedSignalsHit ? "ok" : "miss"}\`, source=\`${item?.plugin?.expectedSourceHit ? "ok" : "miss"}\`, fastPath=\`${item?.plugin?.fastPathLikely ? "yes" : "no"}\``);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
