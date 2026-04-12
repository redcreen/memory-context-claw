#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { mergePluginHostConfig } from "../src/install-config.js";
import { extractJsonPayload } from "../src/runtime-config.js";
import { buildOpenClawReleaseBundle } from "./build-openclaw-release-bundle.js";

const __filename = fileURLToPath(import.meta.url);
const execFileAsync = promisify(execFile);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function expandHome(targetPath) {
  const normalized = normalizeString(targetPath);
  if (!normalized) {
    return "";
  }
  if (normalized === "~") {
    return os.homedir();
  }
  if (normalized.startsWith("~/")) {
    return path.join(os.homedir(), normalized.slice(2));
  }
  return normalized;
}

function parseArgs(argv) {
  const options = {
    openclawBin: "openclaw",
    profile: `umc-install-${randomUUID().slice(0, 8)}`,
    profileExplicit: false,
    keepProfile: false,
    keepBundle: false,
    format: "markdown",
    agentId: "main",
    preset: "safe-local",
    workspacePath: path.join(os.tmpdir(), `umc-openclaw-install-${randomUUID().slice(0, 8)}`),
    workspaceExplicit: false,
    query: "concise progress",
    expectedText: "concise progress reports",
    repoRoot: process.cwd(),
    outputDir: "",
    archivePath: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--openclaw-bin") options.openclawBin = argv[++index];
    else if (arg === "--profile") {
      options.profile = argv[++index];
      options.profileExplicit = true;
    }
    else if (arg === "--keep-profile") options.keepProfile = true;
    else if (arg === "--keep-bundle") options.keepBundle = true;
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--agent") options.agentId = argv[++index];
    else if (arg === "--preset") options.preset = argv[++index];
    else if (arg === "--workspace") {
      options.workspacePath = path.resolve(argv[++index]);
      options.workspaceExplicit = true;
    }
    else if (arg === "--query") options.query = argv[++index];
    else if (arg === "--expected-text") options.expectedText = argv[++index];
    else if (arg === "--repo-root") options.repoRoot = path.resolve(argv[++index]);
    else if (arg === "--output-dir") options.outputDir = path.resolve(argv[++index]);
    else if (arg === "--archive") options.archivePath = path.resolve(argv[++index]);
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/run-openclaw-bundle-install.js [options]",
          "",
          "Options:",
          "  --openclaw-bin <path>   OpenClaw binary or command (default: openclaw)",
          "  --profile <id>          Isolated OpenClaw profile id",
          "  --keep-profile          Keep generated profile and workspace for debugging",
          "  --keep-bundle           Keep generated bundle output when no --archive is provided",
          "  --format <mode>         markdown|json (default: markdown)",
          "  --agent <id>            Agent id for memory status and search checks",
          "  --preset <name>         Plugin preset passed to mergePluginHostConfig",
          "  --workspace <path>      Extra workspace path added to memorySearch.extraPaths",
          "  --query <text>          Memory search query (default: concise progress)",
          "  --expected-text <text>  Expected snippet fragment in memory search results",
          "  --repo-root <path>      Repo root used when building a bundle (default: cwd)",
          "  --output-dir <path>     Output dir for generated release bundle",
          "  --archive <path>        Existing release bundle archive to install",
          "  --help                  Show this message"
        ].join("\n")
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.profile = normalizeString(options.profile, `umc-install-${randomUUID().slice(0, 8)}`);
  options.format = normalizeString(options.format, "markdown");
  options.agentId = normalizeString(options.agentId, "main");
  options.preset = normalizeString(options.preset, "safe-local");
  options.workspacePath = path.resolve(options.workspacePath);
  options.query = normalizeString(options.query, "concise progress");
  options.expectedText = normalizeString(options.expectedText, "concise progress reports");
  options.repoRoot = path.resolve(options.repoRoot);

  return options;
}

function buildCheck({
  code,
  passed,
  expected,
  actual,
  message,
  severity = "error"
}) {
  return {
    code,
    severity,
    status: passed ? "pass" : "fail",
    expected,
    actual,
    message
  };
}

function buildSummary(checks) {
  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.filter((check) => check.status === "fail").length;

  return {
    status: failed === 0 ? "pass" : "fail",
    total_checks: checks.length,
    passed_checks: passed,
    failed_checks: failed
  };
}

export function renderOpenClawBundleInstallReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core OpenClaw Bundle Install");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- releaseTag: \`${report.bundle.release_tag}\``);
  lines.push(`- archivePath: \`${report.bundle.archive_path}\``);
  lines.push(`- profile: \`${report.profile}\``);
  lines.push(`- configPath: \`${report.config_path}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- passedChecks: \`${report.summary.passed_checks}\``);
  lines.push(`- failedChecks: \`${report.summary.failed_checks}\``);
  lines.push("");
  lines.push("## Checks");
  for (const check of report.checks) {
    lines.push(
      `- [${check.status.toUpperCase()}] ${check.code}: ${check.message} (expected=${check.expected}; actual=${check.actual})`
    );
  }
  lines.push("");
  lines.push("## Host Signals");
  lines.push(`- contextEngine: \`${report.host.context_engine}\``);
  lines.push(`- pluginStatus: \`${report.host.plugin_status}\``);
  lines.push(`- pluginOrigin: \`${report.host.plugin_origin}\``);
  lines.push(`- pluginPath: \`${report.host.plugin_path}\``);
  lines.push(`- workspaceDir: \`${report.host.workspace_dir}\``);
  lines.push(`- indexedFiles: \`${report.host.memory_files}\``);
  lines.push(`- memoryResults: \`${report.host.memory_results}\``);
  lines.push("");
  lines.push("## Notes");
  lines.push("- This verification installs a generated release bundle into an isolated OpenClaw profile.");
  lines.push("- It does not rely on `plugins.load.paths`; the plugin is validated through the real install path.");
  lines.push("- A passing report means the repo has a CLI-verifiable deployment artifact, and only human acceptance remains.");
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

async function runCommand(cmd, args, { cwd = process.cwd() } = {}) {
  try {
    const result = await execFileAsync(cmd, args, {
      cwd,
      maxBuffer: 16 * 1024 * 1024
    });
    return {
      ok: true,
      stdout: String(result.stdout || ""),
      stderr: String(result.stderr || ""),
      code: 0
    };
  } catch (error) {
    return {
      ok: false,
      stdout: String(error.stdout || ""),
      stderr: String(error.stderr || ""),
      code: Number(error.code || 1),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function ensureMinimalConfig(configPath) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  try {
    await fs.access(configPath);
  } catch {
    await fs.writeFile(configPath, `${JSON.stringify({ commands: {} }, null, 2)}\n`, "utf8");
  }
}

async function loadJsonFile(targetPath) {
  const raw = await fs.readFile(targetPath, "utf8");
  return JSON.parse(raw);
}

async function writeJsonFile(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function removePath(targetPath) {
  if (!targetPath) {
    return;
  }
  await fs.rm(targetPath, { recursive: true, force: true }).catch(() => {});
}

export async function runOpenClawBundleInstallVerification(options = {}) {
  const reportId = `openclaw_bundle_install_${randomUUID()}`;
  const parsed = {
    ...parseArgs([]),
    ...Object.fromEntries(
      Object.entries(options).filter(([, value]) => value !== undefined && value !== "")
    )
  };

  let bundleReport;
  let cleanupBundleDir = "";
  let cleanupArchivePath = "";
  if (normalizeString(parsed.archivePath)) {
    bundleReport = {
      release_tag: normalizeString(parsed.releaseTag, "unknown"),
      archive_path: normalizeString(parsed.archivePath),
      bundle_dir: normalizeString(parsed.bundleDir, "")
    };
  } else {
    bundleReport = await buildOpenClawReleaseBundle({
      repoRoot: parsed.repoRoot,
      outputDir: normalizeString(
        parsed.outputDir,
        path.join(os.tmpdir(), `umc-release-bundle-${randomUUID().slice(0, 8)}`)
      )
    });
    cleanupBundleDir = bundleReport.bundle_dir;
    cleanupArchivePath = bundleReport.archive_path;
  }

  const configPathResult = await runCommand(parsed.openclawBin, [
    "--no-color",
    "--profile",
    parsed.profile,
    "config",
    "file"
  ], {
    cwd: parsed.repoRoot
  });
  if (!configPathResult.ok) {
    throw new Error(`Unable to resolve OpenClaw config path: ${configPathResult.error || configPathResult.stderr}`);
  }

  const configPath = expandHome(configPathResult.stdout);
  const profileDir = path.dirname(configPath);
  let workspaceDir = "";
  let cleanupWorkspaceDir = "";
  const checks = [];

  try {
    checks.push(
      buildCheck({
        code: "bundle_safe_scan_clean",
        passed: bundleReport.safety_scan?.status !== "fail",
        expected: "release bundle safety scan has zero flagged files",
        actual: bundleReport.safety_scan?.status || "unknown",
        message: "generated release bundle stays clear of blocked install patterns"
      })
    );

    const install = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "plugins",
      "install",
      bundleReport.archive_path
    ], {
      cwd: parsed.repoRoot
    });
    checks.push(
      buildCheck({
        code: "install_command_ok",
        passed: install.ok,
        expected: "openclaw plugins install exits successfully",
        actual: install.ok ? "installed" : install.error || install.stderr || install.stdout,
        message: "OpenClaw can install the generated release bundle into an isolated profile"
      })
    );

    await ensureMinimalConfig(configPath);
    const currentConfig = await loadJsonFile(configPath);
    const nextConfig = mergePluginHostConfig(currentConfig, {
      agentId: parsed.agentId,
      modelPath: path.join(
        os.homedir(),
        ".openclaw",
        "models",
        "embeddinggemma-300m-qat-Q8_0.gguf"
      ),
      workspacePath: parsed.workspacePath,
      preset: parsed.preset
    });
    await writeJsonFile(configPath, nextConfig);
    await fs.mkdir(parsed.workspacePath, { recursive: true });

    const validate = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "config",
      "validate"
    ], {
      cwd: parsed.repoRoot
    });
    checks.push(
      buildCheck({
        code: "config_valid",
        passed: validate.ok,
        expected: "OpenClaw config validates after install binding",
        actual: validate.ok ? "valid" : validate.error || validate.stderr || validate.stdout,
        message: "isolated profile config stays valid after binding the installed plugin"
      })
    );

    const contextEngine = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "config",
      "get",
      "plugins.slots.contextEngine"
    ], {
      cwd: parsed.repoRoot
    });
    const contextEngineValue = normalizeString(contextEngine.stdout);
    checks.push(
      buildCheck({
        code: "context_engine_bound",
        passed: contextEngine.ok && contextEngineValue === "unified-memory-core",
        expected: "unified-memory-core",
        actual: contextEngineValue || contextEngine.error || contextEngine.stderr || "missing",
        message: "OpenClaw contextEngine slot points at the installed plugin"
      })
    );

    const inspect = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "plugins",
      "inspect",
      "unified-memory-core",
      "--json"
    ], {
      cwd: parsed.repoRoot
    });
    const pluginInspect = inspect.ok ? extractJsonPayload(inspect.stdout) : null;
    workspaceDir = normalizeString(pluginInspect?.plugin?.workspaceDir || pluginInspect?.workspaceDir);
    cleanupWorkspaceDir = workspaceDir;
    checks.push(
      buildCheck({
        code: "plugin_loaded",
        passed: inspect.ok && pluginInspect?.plugin?.status === "loaded",
        expected: "plugin status loaded",
        actual: pluginInspect?.plugin?.status || inspect.error || inspect.stderr || "missing",
        message: "OpenClaw loads the installed release bundle successfully"
      })
    );

    const list = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "plugins",
      "list",
      "--enabled",
      "--json"
    ], {
      cwd: parsed.repoRoot
    });
    const pluginList = list.ok ? extractJsonPayload(list.stdout) : null;
    const listedPlugin = Array.isArray(pluginList?.plugins)
      ? pluginList.plugins.find((item) => item?.id === "unified-memory-core")
      : null;
    checks.push(
      buildCheck({
        code: "plugin_listed",
        passed: list.ok && listedPlugin?.status === "loaded",
        expected: "enabled plugin list contains loaded unified-memory-core",
        actual: listedPlugin?.status || list.error || list.stderr || "missing",
        message: "OpenClaw enabled plugin list includes the installed plugin"
      })
    );

    if (workspaceDir) {
      await fs.mkdir(path.join(workspaceDir, "memory"), { recursive: true });
      await fs.writeFile(
        path.join(workspaceDir, "memory", "MEMORY.md"),
        "# Memory\n\nThe user prefers concise progress reports.\n",
        "utf8"
      );
    }
    await fs.writeFile(
      path.join(parsed.workspacePath, "WORKSPACE_NOTE.md"),
      "Use concise progress style during release bundle install verification.\n",
      "utf8"
    );

    const index = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "memory",
      "index",
      "--force"
    ], {
      cwd: parsed.repoRoot
    });
    checks.push(
      buildCheck({
        code: "memory_indexed",
        passed: index.ok,
        expected: "memory index command exits successfully",
        actual: index.ok ? "indexed" : index.error || index.stderr || index.stdout,
        message: "OpenClaw memory index can ingest the installed plugin workspace"
      })
    );

    const status = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "memory",
      "status",
      "--json"
    ], {
      cwd: parsed.repoRoot
    });
    const memoryStatus = status.ok ? extractJsonPayload(status.stdout) : null;
    const mainStatus = Array.isArray(memoryStatus)
      ? memoryStatus.find((item) => item?.agentId === parsed.agentId) || memoryStatus[0]
      : null;
    checks.push(
      buildCheck({
        code: "memory_status_indexed",
        passed: status.ok && Number(mainStatus?.status?.files || 0) >= 1,
        expected: ">= 1 indexed memory file",
        actual: Number(mainStatus?.status?.files || 0),
        message: "memory status sees indexed files after installed bundle setup"
      })
    );

    const search = await runCommand(parsed.openclawBin, [
      "--no-color",
      "--profile",
      parsed.profile,
      "memory",
      "search",
      "--json",
      "--query",
      parsed.query
    ], {
      cwd: parsed.repoRoot
    });
    const memorySearch = search.ok ? extractJsonPayload(search.stdout) : null;
    const searchResults = Array.isArray(memorySearch?.results) ? memorySearch.results : [];
    const matchingResult = searchResults.find((item) =>
      normalizeString(item?.snippet).toLowerCase().includes(parsed.expectedText.toLowerCase())
    );
    checks.push(
      buildCheck({
        code: "memory_search_hits",
        passed: search.ok && Boolean(matchingResult),
        expected: `search results contain "${parsed.expectedText}"`,
        actual: matchingResult?.path || search.error || search.stderr || `${searchResults.length} result(s)`,
        message: "memory search returns the expected indexed smoke content after install"
      })
    );

    const report = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      profile: parsed.profile,
      config_path: configPath,
      workspace_path: parsed.workspacePath,
      summary: buildSummary(checks),
      checks,
      bundle: {
        release_tag: bundleReport.release_tag,
        bundle_dir: bundleReport.bundle_dir,
        archive_path: bundleReport.archive_path
      },
      host: {
        context_engine: contextEngineValue,
        plugin_status: normalizeString(pluginInspect?.plugin?.status, "unknown"),
        plugin_origin: normalizeString(pluginInspect?.plugin?.origin, "unknown"),
        plugin_path: normalizeString(pluginInspect?.plugin?.path, "unknown"),
        workspace_dir: workspaceDir,
        memory_files: Number(mainStatus?.status?.files || 0),
        memory_results: searchResults.length
      }
    };

    return report;
  } finally {
    if (!parsed.keepProfile && !parsed.profileExplicit) {
      await removePath(profileDir);
      await removePath(cleanupWorkspaceDir);
    }
    if (!parsed.keepProfile && !parsed.workspaceExplicit) {
      await removePath(parsed.workspacePath);
    }
    if (!parsed.keepBundle && !normalizeString(parsed.archivePath)) {
      await removePath(cleanupBundleDir ? path.dirname(cleanupBundleDir) : "");
      await removePath(cleanupArchivePath);
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const report = await runOpenClawBundleInstallVerification(options);
  console.log(renderOpenClawBundleInstallReport(report, { format: options.format }));
  if (report.summary.status !== "pass") {
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
}
