#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { mergeInstallConfig } from "../src/install-config.js";
import { extractJsonPayload } from "../src/runtime-config.js";

const execFileAsync = promisify(execFile);
const repoRoot = process.cwd();

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
    profile: `umc-itest-${randomUUID().slice(0, 8)}`,
    profileExplicit: false,
    keepProfile: false,
    format: "markdown",
    agentId: "main",
    pluginPath: repoRoot,
    preset: "safe-local",
    workspacePath: path.join(os.tmpdir(), `umc-openclaw-itest-${randomUUID().slice(0, 8)}`),
    workspaceExplicit: false,
    query: "concise progress",
    expectedText: "concise progress reports",
    agentProbe: false,
    agentMessage: "Give me a concise progress update and keep supporting context compact."
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--openclaw-bin") options.openclawBin = argv[++index];
    else if (arg === "--profile") {
      options.profile = argv[++index];
      options.profileExplicit = true;
    }
    else if (arg === "--keep-profile") options.keepProfile = true;
    else if (arg === "--format") options.format = argv[++index];
    else if (arg === "--agent") options.agentId = argv[++index];
    else if (arg === "--plugin-path") options.pluginPath = path.resolve(argv[++index]);
    else if (arg === "--preset") options.preset = argv[++index];
    else if (arg === "--workspace") {
      options.workspacePath = path.resolve(argv[++index]);
      options.workspaceExplicit = true;
    }
    else if (arg === "--query") options.query = argv[++index];
    else if (arg === "--expected-text") options.expectedText = argv[++index];
    else if (arg === "--agent-probe") options.agentProbe = true;
    else if (arg === "--agent-message") options.agentMessage = argv[++index];
    else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage: node scripts/run-openclaw-cli-integration.js [options]",
          "",
          "Options:",
          "  --openclaw-bin <path>   OpenClaw binary or command (default: openclaw)",
          "  --profile <id>          Isolated OpenClaw profile id",
          "  --keep-profile          Keep generated profile and workspace for debugging",
          "  --format <mode>         markdown|json (default: markdown)",
          "  --agent <id>            Agent id for memory status and optional agent probe",
          "  --plugin-path <path>    unified-memory-core repo path (default: current repo)",
          "  --preset <name>         Plugin preset passed to mergeInstallConfig",
          "  --workspace <path>      Extra workspace path added to memorySearch.extraPaths",
          "  --query <text>          Memory search query (default: concise progress)",
          "  --expected-text <text>  Expected snippet fragment in memory search results",
          "  --agent-probe           Also run openclaw agent --local as an optional live host probe",
          "  --agent-message <text>  Prompt used for --agent-probe",
          "  --help                  Show this message"
        ].join("\n")
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  options.profile = normalizeString(options.profile, `umc-itest-${randomUUID().slice(0, 8)}`);
  options.format = normalizeString(options.format, "markdown");
  options.agentId = normalizeString(options.agentId, "main");
  options.preset = normalizeString(options.preset, "safe-local");
  options.workspacePath = path.resolve(options.workspacePath);
  options.pluginPath = path.resolve(options.pluginPath);
  options.query = normalizeString(options.query, "concise progress");
  options.expectedText = normalizeString(options.expectedText, "concise progress reports");
  options.agentMessage = normalizeString(
    options.agentMessage,
    "Give me a concise progress update and keep supporting context compact."
  );

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

function buildOptionalCheck({
  code,
  status,
  expected,
  actual,
  message,
  severity = "warning"
}) {
  return {
    code,
    severity,
    status,
    expected,
    actual,
    message
  };
}

function buildSummary(checks) {
  const passed = checks.filter((check) => check.status === "pass").length;
  const failed = checks.filter((check) => check.status === "fail").length;
  const skipped = checks.filter((check) => check.status === "skip").length;
  const warned = checks.filter((check) => check.status === "warn").length;

  return {
    status: failed === 0 ? "pass" : "fail",
    total_checks: checks.length,
    passed_checks: passed,
    failed_checks: failed,
    skipped_checks: skipped,
    warned_checks: warned
  };
}

function renderReport(report, { format = "markdown" } = {}) {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }

  const lines = [];
  lines.push("# Unified Memory Core OpenClaw CLI Integration");
  lines.push(`- reportId: \`${report.report_id}\``);
  lines.push(`- profile: \`${report.profile}\``);
  lines.push(`- configPath: \`${report.config_path}\``);
  lines.push(`- workspacePath: \`${report.workspace_path}\``);
  lines.push(`- status: \`${report.summary.status}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push(`- passedChecks: \`${report.summary.passed_checks}\``);
  lines.push(`- failedChecks: \`${report.summary.failed_checks}\``);
  lines.push(`- skippedChecks: \`${report.summary.skipped_checks}\``);
  lines.push(`- warnedChecks: \`${report.summary.warned_checks}\``);
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
  lines.push(`- workspaceDir: \`${report.host.workspace_dir}\``);
  lines.push(`- indexedFiles: \`${report.host.memory_files}\``);
  lines.push(`- memoryResults: \`${report.host.memory_results}\``);
  lines.push(`- agentProbe: \`${report.host.agent_probe_status}\``);
  lines.push("");
  lines.push("## Notes");
  lines.push("- This smoke test validates OpenClaw host loading, config binding, and memory CLI paths in an isolated profile.");
  lines.push("- It does not require `openclaw plugins install -l .`; local dev repos may be blocked by OpenClaw safe-install policy.");
  lines.push("- Use `--agent-probe` only when the isolated profile already has usable auth/provider setup.");
  lines.push("");

  return `${lines.join("\n").trimEnd()}\n`;
}

async function runCommand(cmd, args, { cwd = repoRoot } = {}) {
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

async function loadJsonFile(configPath) {
  const raw = await fs.readFile(configPath, "utf8");
  return JSON.parse(raw);
}

async function writeJsonFile(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function removePath(targetPath) {
  if (!targetPath) {
    return;
  }
  await fs.rm(targetPath, { recursive: true, force: true }).catch(() => {});
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const configPathResult = await runCommand(options.openclawBin, [
    "--no-color",
    "--profile",
    options.profile,
    "config",
    "file"
  ]);
  if (!configPathResult.ok) {
    throw new Error(`Unable to resolve OpenClaw config path: ${configPathResult.error || configPathResult.stderr}`);
  }

  const configPath = expandHome(configPathResult.stdout);
  const profileDir = path.dirname(configPath);
  const reportId = `openclaw_cli_integration_${randomUUID()}`;

  let workspaceDir = "";
  let cleanupWorkspaceDir = "";
  let checks = [];
  let pluginInspect = null;
  let pluginList = null;
  let memoryStatus = null;
  let memorySearch = null;
  let agentProbeResult = null;

  try {
    await ensureMinimalConfig(configPath);
    const currentConfig = await loadJsonFile(configPath);
    const nextConfig = mergeInstallConfig(currentConfig, {
      agentId: options.agentId,
      modelPath: path.join(
        os.homedir(),
        ".openclaw",
        "models",
        "embeddinggemma-300m-qat-Q8_0.gguf"
      ),
      workspacePath: options.workspacePath,
      pluginPath: options.pluginPath,
      preset: options.preset
    });
    await writeJsonFile(configPath, nextConfig);
    await fs.mkdir(options.workspacePath, { recursive: true });

    const validate = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "config",
      "validate"
    ]);
    checks.push(
      buildCheck({
        code: "config_valid",
        passed: validate.ok,
        expected: "OpenClaw config validates",
        actual: validate.ok ? "valid" : validate.error || validate.stderr || validate.stdout,
        message: "isolated profile config stays valid after binding unified-memory-core"
      })
    );

    const contextEngine = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "config",
      "get",
      "plugins.slots.contextEngine"
    ]);
    const contextEngineValue = normalizeString(contextEngine.stdout);
    checks.push(
      buildCheck({
        code: "context_engine_bound",
        passed: contextEngine.ok && contextEngineValue === "unified-memory-core",
        expected: "unified-memory-core",
        actual: contextEngineValue || contextEngine.error || contextEngine.stderr || "missing",
        message: "OpenClaw contextEngine slot points at unified-memory-core"
      })
    );

    const inspect = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "plugins",
      "inspect",
      "unified-memory-core",
      "--json"
    ]);
    pluginInspect = inspect.ok ? extractJsonPayload(inspect.stdout) : null;
    workspaceDir = normalizeString(pluginInspect?.plugin?.workspaceDir || pluginInspect?.workspaceDir);
    cleanupWorkspaceDir = workspaceDir;
    checks.push(
      buildCheck({
        code: "plugin_loaded",
        passed: inspect.ok && pluginInspect?.plugin?.status === "loaded",
        expected: "plugin status loaded",
        actual: pluginInspect?.plugin?.status || inspect.error || inspect.stderr || "missing",
        message: "OpenClaw host can load unified-memory-core from the isolated profile"
      })
    );

    const list = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "plugins",
      "list",
      "--enabled",
      "--json"
    ]);
    pluginList = list.ok ? extractJsonPayload(list.stdout) : null;
    const listedPlugin = Array.isArray(pluginList?.plugins)
      ? pluginList.plugins.find((item) => item?.id === "unified-memory-core")
      : null;
    checks.push(
      buildCheck({
        code: "plugin_listed",
        passed: list.ok && listedPlugin?.status === "loaded",
        expected: "enabled plugin list contains loaded unified-memory-core",
        actual: listedPlugin?.status || list.error || list.stderr || "missing",
        message: "OpenClaw enabled plugin list includes unified-memory-core"
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
      path.join(options.workspacePath, "WORKSPACE_NOTE.md"),
      "Use concise progress style during host integration smoke checks.\n",
      "utf8"
    );

    const index = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "memory",
      "index",
      "--force"
    ]);
    checks.push(
      buildCheck({
        code: "memory_indexed",
        passed: index.ok,
        expected: "memory index command exits successfully",
        actual: index.ok ? "indexed" : index.error || index.stderr || index.stdout,
        message: "OpenClaw memory index can ingest the isolated profile workspace"
      })
    );

    const status = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "memory",
      "status",
      "--json"
    ]);
    memoryStatus = status.ok ? extractJsonPayload(status.stdout) : null;
    const mainStatus = Array.isArray(memoryStatus)
      ? memoryStatus.find((item) => item?.agentId === options.agentId) || memoryStatus[0]
      : null;
    checks.push(
      buildCheck({
        code: "memory_status_indexed",
        passed: status.ok && Number(mainStatus?.status?.files || 0) >= 1,
        expected: ">= 1 indexed memory file",
        actual: Number(mainStatus?.status?.files || 0),
        message: "OpenClaw memory status sees indexed files in the isolated profile"
      })
    );

    const search = await runCommand(options.openclawBin, [
      "--no-color",
      "--profile",
      options.profile,
      "memory",
      "search",
      "--json",
      "--query",
      options.query
    ]);
    memorySearch = search.ok ? extractJsonPayload(search.stdout) : null;
    const searchResults = Array.isArray(memorySearch?.results) ? memorySearch.results : [];
    const matchingResult = searchResults.find((item) =>
      normalizeString(item?.snippet).toLowerCase().includes(options.expectedText.toLowerCase())
    );
    checks.push(
      buildCheck({
        code: "memory_search_hits",
        passed: search.ok && Boolean(matchingResult),
        expected: `search results contain "${options.expectedText}"`,
        actual: matchingResult?.path || search.error || search.stderr || `${searchResults.length} result(s)`,
        message: "OpenClaw memory search returns the expected indexed smoke content"
      })
    );

    if (options.agentProbe) {
      const agentProbe = await runCommand(options.openclawBin, [
        "--no-color",
        "--profile",
        options.profile,
        "agent",
        "--local",
        "--agent",
        options.agentId,
        "--json",
        "--message",
        options.agentMessage
      ]);
      agentProbeResult = agentProbe;
      if (agentProbe.ok) {
        checks.push(
          buildOptionalCheck({
            code: "agent_probe",
            status: "pass",
            expected: "local agent probe succeeds",
            actual: "success",
            message: "OpenClaw local agent probe completed successfully"
          })
        );
      } else {
        checks.push(
          buildOptionalCheck({
            code: "agent_probe",
            status: "fail",
            expected: "local agent probe succeeds",
            actual: agentProbe.error || agentProbe.stderr || agentProbe.stdout || "failed",
            message: "OpenClaw local agent probe failed"
          })
        );
      }
    } else {
      checks.push(
        buildOptionalCheck({
          code: "agent_probe",
          status: "skip",
          expected: "run only when isolated profile has auth/provider setup",
          actual: "not requested",
          message: "Skipped local agent probe because it depends on host auth/provider configuration"
        })
      );
    }

    const report = {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      profile: options.profile,
      config_path: configPath,
      workspace_path: options.workspacePath,
      summary: buildSummary(checks),
      checks,
      host: {
        context_engine: contextEngineValue,
        plugin_status: normalizeString(pluginInspect?.plugin?.status, "unknown"),
        plugin_origin: normalizeString(pluginInspect?.plugin?.origin, "unknown"),
        workspace_dir: workspaceDir,
        memory_files: Number(
          (
            Array.isArray(memoryStatus)
              ? memoryStatus.find((item) => item?.agentId === options.agentId) || memoryStatus[0]
              : null
          )?.status?.files || 0
        ),
        memory_results: Array.isArray(memorySearch?.results) ? memorySearch.results.length : 0,
        agent_probe_status: checks.find((check) => check.code === "agent_probe")?.status || "skip"
      }
    };

    console.log(renderReport(report, { format: options.format }));
    if (report.summary.status !== "pass") {
      process.exitCode = 1;
    }
  } finally {
    if (!options.keepProfile && !options.profileExplicit) {
      await removePath(profileDir);
      await removePath(cleanupWorkspaceDir);
    }
    if (!options.keepProfile && !options.workspaceExplicit) {
      await removePath(options.workspacePath);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
