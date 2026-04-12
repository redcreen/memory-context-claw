#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

const RELEASE_BUNDLE_ENTRIES = [
  { source: "index.js", required: true },
  { source: "openclaw.plugin.json", required: true },
  { source: "README.md", required: true },
  { source: "src", required: true },
  { source: path.join("docs", "reference", "configuration.md"), required: true },
  { source: path.join("docs", "reference", "formal-memory-policy.md"), required: true },
  { source: path.join("docs", "workstreams", "project", "roadmap.md"), required: true },
  { source: path.join("workspace", "notes"), required: false },
  { source: path.join("reports", "conversation-memory-cards.json"), required: false }
];

const DANGEROUS_PATTERNS = [
  {
    code: "child_process",
    pattern: /node:child_process|from\s+["']child_process["']|require\(\s*["']child_process["']\s*\)/u
  },
  {
    code: "unsafe_install_flag",
    pattern: /dangerously-force-unsafe-install/u
  }
];

function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
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
  return flags;
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function sanitizeReleasePackageJson(packageJson) {
  return {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    type: packageJson.type,
    main: packageJson.main,
    license: packageJson.license,
    keywords: Array.isArray(packageJson.keywords) ? packageJson.keywords : [],
    peerDependencies: packageJson.peerDependencies || {},
    openclaw: packageJson.openclaw || {}
  };
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyEntry(repoRoot, bundleDir, entry) {
  const sourcePath = path.join(repoRoot, entry.source);
  const targetPath = path.join(bundleDir, entry.source);
  const exists = await pathExists(sourcePath);
  if (!exists) {
    if (entry.required) {
      throw new Error(`Missing required bundle entry: ${entry.source}`);
    }
    return false;
  }

  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
  return true;
}

async function collectRelativeFiles(rootDir, currentDir = rootDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectRelativeFiles(rootDir, fullPath));
    } else if (entry.isFile()) {
      files.push(path.relative(rootDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return files;
}

async function scanBundleSafety(bundleDir) {
  const files = await collectRelativeFiles(bundleDir);
  const flagged = [];

  for (const relativePath of files) {
    if (!/\.(?:js|json)$/u.test(relativePath)) {
      continue;
    }
    const raw = await fs.readFile(path.join(bundleDir, relativePath), "utf8");
    for (const rule of DANGEROUS_PATTERNS) {
      if (rule.pattern.test(raw)) {
        flagged.push({
          code: rule.code,
          path: relativePath
        });
      }
    }
  }

  return {
    status: flagged.length === 0 ? "pass" : "fail",
    flagged_files: flagged.length,
    flagged
  };
}

export async function buildOpenClawReleaseBundle({
  repoRoot = process.cwd(),
  outputDir = path.join(repoRoot, "dist", "openclaw-release")
} = {}) {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(repoRoot, "package.json"), "utf8")
  );
  const version = normalizeString(packageJson.version, "0.0.0");
  const tagVersion = version.startsWith("v") ? version : `v${version}`;
  const bundleName = `unified-memory-core-${tagVersion}`;
  const bundleDir = path.join(outputDir, bundleName);
  const archivePath = path.join(outputDir, `${bundleName}.tgz`);

  await fs.rm(bundleDir, { recursive: true, force: true });
  await fs.mkdir(bundleDir, { recursive: true });

  const includedEntries = [];
  for (const entry of RELEASE_BUNDLE_ENTRIES) {
    const copied = await copyEntry(repoRoot, bundleDir, entry);
    if (copied) {
      includedEntries.push(entry.source);
    }
  }

  const sanitizedPackageJson = sanitizeReleasePackageJson(packageJson);
  await fs.writeFile(
    path.join(bundleDir, "package.json"),
    `${JSON.stringify(sanitizedPackageJson, null, 2)}\n`,
    "utf8"
  );

  const safetyScan = await scanBundleSafety(bundleDir);
  const files = await collectRelativeFiles(bundleDir);
  const manifest = {
    generated_at: new Date().toISOString(),
    package_version: version,
    release_tag: tagVersion,
    bundle_name: bundleName,
    included_entries: includedEntries,
    file_count: files.length,
    safety_scan: safetyScan
  };
  await fs.writeFile(
    path.join(bundleDir, "bundle-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  execFileSync(
    "tar",
    ["-czf", archivePath, "-C", outputDir, bundleName],
    { stdio: "pipe" }
  );

  return {
    report_id: `openclaw_release_bundle_${Date.now()}`,
    generated_at: manifest.generated_at,
    package_version: version,
    release_tag: tagVersion,
    bundle_name: bundleName,
    bundle_dir: bundleDir,
    archive_path: archivePath,
    included_entries: includedEntries,
    file_count: files.length,
    safety_scan: safetyScan
  };
}

export function renderOpenClawReleaseBundleReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core OpenClaw Release Bundle");
  lines.push(`- releaseTag: \`${report.release_tag}\``);
  lines.push(`- packageVersion: \`${report.package_version}\``);
  lines.push(`- bundleDir: \`${report.bundle_dir}\``);
  lines.push(`- archivePath: \`${report.archive_path}\``);
  lines.push(`- status: \`${report.safety_scan.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- fileCount: \`${report.file_count}\``);
  lines.push(`- includedEntries: \`${report.included_entries.length}\``);
  lines.push(`- flaggedFiles: \`${report.safety_scan.flagged_files}\``);
  lines.push("");
  lines.push("## Included Entries");
  for (const entry of report.included_entries) {
    lines.push(`- \`${entry}\``);
  }
  lines.push("");
  lines.push("## Safety Scan");
  if (report.safety_scan.flagged.length === 0) {
    lines.push("- no flagged files");
  } else {
    for (const flagged of report.safety_scan.flagged) {
      lines.push(`- \`${flagged.code}\`: \`${flagged.path}\``);
    }
  }
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const report = await buildOpenClawReleaseBundle({
    repoRoot: normalizeString(flags["repo-root"], process.cwd()),
    outputDir: normalizeString(flags["output-dir"], path.join(process.cwd(), "dist", "openclaw-release"))
  });

  console.log(
    renderOpenClawReleaseBundleReport(report, {
      format: normalizeString(flags.format, "markdown")
    })
  );

  if (report.safety_scan.status !== "pass") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
}
