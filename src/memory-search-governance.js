export function summarizeMemorySearchResults(results = []) {
  const items = Array.isArray(results) ? results : [];
  const summary = {
    cases: items.length,
    builtinUnavailable: 0,
    builtinSignalHits: 0,
    builtinSourceHits: 0,
    pluginSignalHits: 0,
    pluginSourceHits: 0,
    pluginFastPathLikely: 0,
    pluginSingleCard: 0,
    pluginMultiCard: 0,
    pluginNoisySupporting: 0,
    pluginUnexpectedSupportingTotal: 0,
    builtinFailures: 0,
    pluginFailures: 0,
    watchlist: []
  };

  for (const item of items) {
    if (item?.builtin?.commandOk === false) {
      summary.builtinUnavailable += 1;
    }
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
    if (item?.plugin?.selectionQuality?.singleCard) {
      summary.pluginSingleCard += 1;
    }
    if (item?.plugin?.selectionQuality?.multiCard) {
      summary.pluginMultiCard += 1;
    }
    if (item?.plugin?.selectionQuality?.noisySupporting) {
      summary.pluginNoisySupporting += 1;
    }
    summary.pluginUnexpectedSupportingTotal += Number(item?.plugin?.selectionQuality?.unexpectedSupportingCount || 0);

    const builtinFailure =
      item?.builtin?.commandOk === false
        ? false
        : !item?.builtin?.expectedSignalsHit || !item?.builtin?.expectedSourceHit;
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

export function compareMemorySearchSummaries(current = {}, previous = {}) {
  if (!previous || Object.keys(previous).length === 0) {
    return null;
  }

  const diff = (key) => Number(current?.[key] || 0) - Number(previous?.[key] || 0);
  const currentWatchlist = new Set((current?.watchlist || []).map((item) => item.id));
  const previousWatchlist = new Set((previous?.watchlist || []).map((item) => item.id));

  return {
    builtinUnavailableDelta: diff("builtinUnavailable"),
    builtinSignalHitsDelta: diff("builtinSignalHits"),
    builtinSourceHitsDelta: diff("builtinSourceHits"),
    pluginSignalHitsDelta: diff("pluginSignalHits"),
    pluginSourceHitsDelta: diff("pluginSourceHits"),
    pluginFastPathLikelyDelta: diff("pluginFastPathLikely"),
    pluginSingleCardDelta: diff("pluginSingleCard"),
    pluginMultiCardDelta: diff("pluginMultiCard"),
    pluginNoisySupportingDelta: diff("pluginNoisySupporting"),
    pluginUnexpectedSupportingTotalDelta: diff("pluginUnexpectedSupportingTotal"),
    builtinFailuresDelta: diff("builtinFailures"),
    pluginFailuresDelta: diff("pluginFailures"),
    watchlistAdded: [...currentWatchlist].filter((id) => !previousWatchlist.has(id)),
    watchlistResolved: [...previousWatchlist].filter((id) => !currentWatchlist.has(id)),
    watchlistPersisting: [...currentWatchlist].filter((id) => previousWatchlist.has(id))
  };
}

export function renderMemorySearchGovernanceReport(result, { generatedAt } = {}) {
  const summary = result?.summary || summarizeMemorySearchResults(result?.results || []);
  const comparison = result?.comparison || null;
  const lines = [];
  lines.push("# Memory Search Governance Report");
  if (generatedAt) {
    lines.push(`- 生成时间：${generatedAt}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push(`- cases: \`${summary.cases}\``);
  lines.push(`- builtinUnavailable: \`${summary.builtinUnavailable}\``);
  lines.push(`- builtinSignalHits: \`${summary.builtinSignalHits}\``);
  lines.push(`- builtinSourceHits: \`${summary.builtinSourceHits}\``);
  lines.push(`- pluginSignalHits: \`${summary.pluginSignalHits}\``);
  lines.push(`- pluginSourceHits: \`${summary.pluginSourceHits}\``);
  lines.push(`- pluginFastPathLikely: \`${summary.pluginFastPathLikely}\``);
  lines.push(`- pluginSingleCard: \`${summary.pluginSingleCard}\``);
  lines.push(`- pluginMultiCard: \`${summary.pluginMultiCard}\``);
  lines.push(`- pluginNoisySupporting: \`${summary.pluginNoisySupporting}\``);
  lines.push(`- pluginUnexpectedSupportingTotal: \`${summary.pluginUnexpectedSupportingTotal}\``);
  lines.push(`- builtinFailures: \`${summary.builtinFailures}\``);
  lines.push(`- pluginFailures: \`${summary.pluginFailures}\``);
  lines.push("");

  if (comparison) {
    lines.push("## Delta vs Previous");
    lines.push(`- builtinUnavailableDelta: \`${comparison.builtinUnavailableDelta}\``);
    lines.push(`- builtinSignalHitsDelta: \`${comparison.builtinSignalHitsDelta}\``);
    lines.push(`- builtinSourceHitsDelta: \`${comparison.builtinSourceHitsDelta}\``);
    lines.push(`- pluginSignalHitsDelta: \`${comparison.pluginSignalHitsDelta}\``);
    lines.push(`- pluginSourceHitsDelta: \`${comparison.pluginSourceHitsDelta}\``);
    lines.push(`- pluginFastPathLikelyDelta: \`${comparison.pluginFastPathLikelyDelta}\``);
    lines.push(`- pluginSingleCardDelta: \`${comparison.pluginSingleCardDelta}\``);
    lines.push(`- pluginMultiCardDelta: \`${comparison.pluginMultiCardDelta}\``);
    lines.push(`- pluginNoisySupportingDelta: \`${comparison.pluginNoisySupportingDelta}\``);
    lines.push(`- pluginUnexpectedSupportingTotalDelta: \`${comparison.pluginUnexpectedSupportingTotalDelta}\``);
    lines.push(`- builtinFailuresDelta: \`${comparison.builtinFailuresDelta}\``);
    lines.push(`- pluginFailuresDelta: \`${comparison.pluginFailuresDelta}\``);
    lines.push("");
    lines.push("## Watchlist Changes");
    lines.push(`- added: ${comparison.watchlistAdded.length ? comparison.watchlistAdded.map((id) => `\`${id}\``).join(", ") : "none"}`);
    lines.push(`- resolved: ${comparison.watchlistResolved.length ? comparison.watchlistResolved.map((id) => `\`${id}\``).join(", ") : "none"}`);
    lines.push(`- persisting: ${comparison.watchlistPersisting.length ? comparison.watchlistPersisting.map((id) => `\`${id}\``).join(", ") : "none"}`);
    lines.push("");
  }

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
      lines.push(`  - plugin: signal=\`${item?.plugin?.expectedSignalsHit ? "ok" : "miss"}\`, source=\`${item?.plugin?.expectedSourceHit ? "ok" : "miss"}\`, fastPath=\`${item?.plugin?.fastPathLikely ? "yes" : "no"}\`, selectedCount=\`${item?.plugin?.selectionQuality?.selectedCount ?? 0}\`, noisySupporting=\`${item?.plugin?.selectionQuality?.noisySupporting ? "yes" : "no"}\``);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
