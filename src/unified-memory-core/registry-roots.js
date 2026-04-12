import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

export const DEFAULT_CANONICAL_REGISTRY_DIR = path.join(
  os.homedir(),
  ".unified-memory-core",
  "registry"
);

export const DEFAULT_LEGACY_OPENCLAW_REGISTRY_DIR = path.join(
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

async function pathExists(targetPath) {
  try {
    await fsp.access(targetPath);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

async function readJsonLines(filePath) {
  try {
    const raw = await fsp.readFile(filePath, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function inspectJsonlFile(filePath) {
  const exists = await pathExists(filePath);
  if (!exists) {
    return {
      path: filePath,
      exists: false,
      line_count: 0,
      size_bytes: 0,
      sha256: "",
      updated_at: ""
    };
  }

  const [lines, stats] = await Promise.all([
    readJsonLines(filePath),
    fsp.stat(filePath)
  ]);
  const sha256 = createHash("sha256").update(lines.join("\n")).digest("hex");

  return {
    path: filePath,
    exists: true,
    line_count: lines.length,
    size_bytes: stats.size,
    sha256,
    updated_at: stats.mtime.toISOString()
  };
}

async function inspectRegistryDirectory(registryDir) {
  const resolvedDir = path.resolve(registryDir);
  const rootExists = await pathExists(resolvedDir);
  const records = await inspectJsonlFile(path.join(resolvedDir, "records.jsonl"));
  const decisionTrails = await inspectJsonlFile(path.join(resolvedDir, "decision-trails.jsonl"));
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({
      records: records.sha256,
      decision_trails: decisionTrails.sha256
    }))
    .digest("hex");

  return {
    registry_dir: resolvedDir,
    root_exists: rootExists,
    records,
    decision_trails: decisionTrails,
    total_lines: records.line_count + decisionTrails.line_count,
    fingerprint
  };
}

function compareRegistryRoots(canonical, legacy) {
  if (!canonical.root_exists && !legacy.root_exists) {
    return {
      both_present: false,
      diverged: false,
      mirrored: false
    };
  }

  if (!(canonical.root_exists && legacy.root_exists)) {
    return {
      both_present: false,
      diverged: false,
      mirrored: false
    };
  }

  const mirrored = canonical.fingerprint === legacy.fingerprint;
  return {
    both_present: true,
    diverged: !mirrored,
    mirrored
  };
}

function buildTopologyFindings({ resolution, canonical, legacy, comparison }) {
  const findings = [];

  if (!canonical.root_exists && !legacy.root_exists) {
    findings.push({
      severity: "info",
      code: "no_registry_roots_present",
      message: "Neither canonical nor legacy registry root currently exists."
    });
    return findings;
  }

  if (resolution.source === "legacy_fallback") {
    findings.push({
      severity: "warning",
      code: "active_root_uses_legacy_fallback",
      message: "Active registry root resolved through the legacy OpenClaw fallback."
    });
  }

  if (!canonical.root_exists && legacy.root_exists) {
    findings.push({
      severity: "warning",
      code: "canonical_root_missing",
      message: "Legacy OpenClaw registry exists but the canonical host-neutral registry root does not."
    });
  }

  if (comparison.diverged) {
    findings.push({
      severity: "warning",
      code: "registry_roots_diverged",
      message: "Canonical and legacy registry roots both exist but do not contain the same records."
    });
  }

  if ((resolution.source === "explicit" || resolution.source === "env")
    && resolution.registryDir !== resolution.canonicalRegistryDir) {
    findings.push({
      severity: "info",
      code: "registry_root_override_active",
      message: "Registry root is currently driven by an explicit path or environment override."
    });
  }

  if (comparison.mirrored) {
    findings.push({
      severity: "info",
      code: "registry_roots_mirrored",
      message: "Canonical and legacy registry roots currently contain matching data."
    });
  }

  return findings;
}

function buildTopologySummary({ resolution, canonical, legacy, comparison }) {
  const migrationNeeded = resolution.source === "legacy_fallback"
    || (!canonical.root_exists && legacy.root_exists)
    || comparison.diverged;
  const cutoverReady = canonical.root_exists
    && (!legacy.root_exists || comparison.mirrored || resolution.registryDir === canonical.registry_dir);

  return {
    active_root: resolution.registryDir,
    active_source: resolution.source,
    canonical_root_exists: canonical.root_exists,
    legacy_root_exists: legacy.root_exists,
    migration_needed: migrationNeeded,
    cutover_ready: cutoverReady
  };
}

export function resolveRegistryRoot(options = {}) {
  const explicitDir = normalizeString(options.explicitDir);
  const envValue = normalizeString(
    options.env?.UMC_REGISTRY_DIR,
    normalizeString(options.envValue)
  );
  const canonicalRegistryDir = path.resolve(
    normalizeString(options.canonicalRegistryDir, DEFAULT_CANONICAL_REGISTRY_DIR)
  );
  const legacyRegistryDir = path.resolve(
    normalizeString(options.legacyRegistryDir, DEFAULT_LEGACY_OPENCLAW_REGISTRY_DIR)
  );
  const exists = options.exists || ((targetPath) => fs.existsSync(targetPath));

  if (explicitDir) {
    return {
      registryDir: path.resolve(explicitDir),
      source: "explicit",
      canonicalRegistryDir,
      legacyRegistryDir,
      usedCompatibilityFallback: false
    };
  }

  if (envValue) {
    return {
      registryDir: path.resolve(envValue),
      source: "env",
      canonicalRegistryDir,
      legacyRegistryDir,
      usedCompatibilityFallback: false
    };
  }

  if (exists(canonicalRegistryDir)) {
    return {
      registryDir: canonicalRegistryDir,
      source: "canonical",
      canonicalRegistryDir,
      legacyRegistryDir,
      usedCompatibilityFallback: false
    };
  }

  if (exists(legacyRegistryDir)) {
    return {
      registryDir: legacyRegistryDir,
      source: "legacy_fallback",
      canonicalRegistryDir,
      legacyRegistryDir,
      usedCompatibilityFallback: true
    };
  }

  return {
    registryDir: canonicalRegistryDir,
    source: "canonical_default",
    canonicalRegistryDir,
    legacyRegistryDir,
    usedCompatibilityFallback: false
  };
}

export function buildRegistryRootReport(options = {}) {
  const resolution = resolveRegistryRoot(options);
  return {
    registry_dir: resolution.registryDir,
    source: resolution.source,
    canonical_registry_dir: resolution.canonicalRegistryDir,
    legacy_openclaw_registry_dir: resolution.legacyRegistryDir,
    used_compatibility_fallback: resolution.usedCompatibilityFallback
  };
}

export async function inspectRegistryTopology(options = {}) {
  const resolution = resolveRegistryRoot(options);
  const [canonical, legacy] = await Promise.all([
    inspectRegistryDirectory(resolution.canonicalRegistryDir),
    inspectRegistryDirectory(resolution.legacyRegistryDir)
  ]);
  const comparison = compareRegistryRoots(canonical, legacy);

  return {
    resolution: buildRegistryRootReport(options),
    summary: buildTopologySummary({ resolution, canonical, legacy, comparison }),
    canonical_root: canonical,
    legacy_root: legacy,
    findings: buildTopologyFindings({ resolution, canonical, legacy, comparison })
  };
}

export function renderRegistryTopologyReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Registry Topology");
  lines.push(`- activeRoot: \`${report.summary.active_root}\``);
  lines.push(`- activeSource: \`${report.summary.active_source}\``);
  lines.push(`- migrationNeeded: \`${report.summary.migration_needed}\``);
  lines.push(`- cutoverReady: \`${report.summary.cutover_ready}\``);
  lines.push("");
  lines.push("## Roots");
  lines.push(`- canonical: \`${report.canonical_root.registry_dir}\` (exists=\`${report.canonical_root.root_exists}\`, lines=\`${report.canonical_root.total_lines}\`)`);
  lines.push(`- legacy: \`${report.legacy_root.registry_dir}\` (exists=\`${report.legacy_root.root_exists}\`, lines=\`${report.legacy_root.total_lines}\`)`);
  lines.push("");
  lines.push("## Findings");
  if (!Array.isArray(report.findings) || report.findings.length === 0) {
    lines.push("- none");
  } else {
    for (const finding of report.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

function dedupeLines(sourceLines, targetLines) {
  const existing = new Set(targetLines);
  return sourceLines.filter((line) => !existing.has(line));
}

function resolveMigrationPaths(topology, options = {}) {
  const explicitSourceDir = normalizeString(options.sourceDir);
  const explicitTargetDir = normalizeString(options.targetDir);
  const targetDir = path.resolve(explicitTargetDir || topology.resolution.canonical_registry_dir);
  let sourceDir = normalizeString(explicitSourceDir);

  if (!sourceDir) {
    if (topology.legacy_root.root_exists && targetDir !== topology.legacy_root.registry_dir) {
      sourceDir = topology.legacy_root.registry_dir;
    } else {
      sourceDir = topology.resolution.registry_dir;
    }
  }

  return {
    sourceDir: path.resolve(sourceDir),
    targetDir
  };
}

export async function migrateRegistryRoot(options = {}) {
  const topology = await inspectRegistryTopology(options);
  const { sourceDir, targetDir } = resolveMigrationPaths(topology, options);
  const apply = options.apply === true;
  const sourceLines = {
    records: await readJsonLines(path.join(sourceDir, "records.jsonl")),
    decision_trails: await readJsonLines(path.join(sourceDir, "decision-trails.jsonl"))
  };
  const targetLines = {
    records: await readJsonLines(path.join(targetDir, "records.jsonl")),
    decision_trails: await readJsonLines(path.join(targetDir, "decision-trails.jsonl"))
  };
  const additions = {
    records: dedupeLines(sourceLines.records, targetLines.records),
    decision_trails: dedupeLines(sourceLines.decision_trails, targetLines.decision_trails)
  };
  const isNoop = sourceDir === targetDir || (!additions.records.length && !additions.decision_trails.length);

  if (apply && !isNoop) {
    await fsp.mkdir(targetDir, { recursive: true });
    if (additions.records.length > 0) {
      await fsp.appendFile(path.join(targetDir, "records.jsonl"), `${additions.records.join("\n")}\n`, "utf8");
    }
    if (additions.decision_trails.length > 0) {
      await fsp.appendFile(
        path.join(targetDir, "decision-trails.jsonl"),
        `${additions.decision_trails.join("\n")}\n`,
        "utf8"
      );
    }
  }

  return {
    source_dir: sourceDir,
    target_dir: targetDir,
    apply,
    noop: isNoop,
    added_records: additions.records.length,
    added_decision_trails: additions.decision_trails.length,
    recommendation:
      sourceDir === targetDir
        ? "source_matches_target"
        : targetDir === topology.resolution.canonical_registry_dir
          ? "adopt_canonical_root"
          : "manual_review",
    topology
  };
}

export function renderRegistryMigrationReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core Registry Migration");
  lines.push(`- sourceDir: \`${report.source_dir}\``);
  lines.push(`- targetDir: \`${report.target_dir}\``);
  lines.push(`- apply: \`${report.apply}\``);
  lines.push(`- noop: \`${report.noop}\``);
  lines.push(`- addedRecords: \`${report.added_records}\``);
  lines.push(`- addedDecisionTrails: \`${report.added_decision_trails}\``);
  lines.push(`- recommendation: \`${report.recommendation}\``);
  lines.push("");
  lines.push("## Topology Findings");
  if (!Array.isArray(report.topology.findings) || report.topology.findings.length === 0) {
    lines.push("- none");
  } else {
    for (const finding of report.topology.findings) {
      lines.push(`- [${finding.severity}] ${finding.code}: ${finding.message}`);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}
