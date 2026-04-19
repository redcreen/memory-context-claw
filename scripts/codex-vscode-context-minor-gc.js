#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

import {
  buildCodexVscodeContextMinorGc,
  renderCodexVscodeContextMinorGcFooter,
  renderCodexVscodeContextMinorGcHistory,
  renderCodexVscodeContextMinorGcMarkdown,
  renderCodexVscodeContextMinorGcPanel,
  renderCodexVscodeContextMinorGcPrompt,
  renderCodexVscodeContextMinorGcSizeLine
} from "../src/codex-vscode-context-minor-gc.js";

function buildDefaultOutputDir(cwd = process.cwd()) {
  return path.resolve(cwd, "reports/generated/codex-vscode-context-minor-gc");
}

function printUsage() {
  console.log(
    [
      "Usage: node scripts/codex-vscode-context-minor-gc.js [options]",
      "",
      "Options:",
      "  --prompt <text>                Override the current user prompt",
      "  --cwd <path>                   Workspace path to match in ~/.codex/sessions",
      "  --sessions-root <path>         Override Codex sessions root",
      "  --session-id <id>              Bind to an exact Codex VS Code thread/session id",
      "  --format <json|markdown|prompt|header|footer|size|panel|history>",
      "  --include-commentary           Include commentary agent messages",
      "  --max-messages <n>             Limit extracted messages before GC (default: 12)",
      "  --transport <name>             Context Minor GC decision transport (default: codex_exec)",
      "  --model <name>                 Decision model (default: gpt-5.4)",
      "  --reasoning-effort <level>     Decision reasoning effort (default: low)",
      "  --timeout-ms <n>               Decision timeout in milliseconds",
      "  --host-context-window-cap <n>  Clamp host context window for compat testing (default: 0 = disabled)",
      "  --history-limit <n>            Number of recent token_count samples to show (default: 8)",
      "  --watch                        Continuously refresh stdout and a stable output file",
      "  --interval-ms <n>              Refresh interval for watch mode (default: 2000)",
      "  --write-file <path>            Stable file path to rewrite on each watch refresh",
      "  --output-dir <path>            Telemetry/export output directory",
      "  --verbose                      Include session paths, telemetry paths, and full working-set text",
      "  --shadow-only                  Disable guarded prompt application",
      "  --help                         Show this message"
    ].join("\n")
  );
}

function readFlag(argv, name, fallback = "") {
  const index = argv.indexOf(name);
  if (index === -1 || index + 1 >= argv.length) {
    return fallback;
  }
  return argv[index + 1];
}

function hasFlag(argv, name) {
  return argv.includes(name);
}

async function writeOutputFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function writeStableArtifacts({
  result,
  cwd,
  outputDir
} = {}) {
  const stableDir = outputDir || buildDefaultOutputDir(cwd);
  await writeOutputFile(
    path.join(stableDir, "current-size.txt"),
    `${renderCodexVscodeContextMinorGcSizeLine(result)}\n`
  );
  await writeOutputFile(
    path.join(stableDir, "live-history.md"),
    renderCodexVscodeContextMinorGcHistory(result)
  );
  await writeOutputFile(
    path.join(stableDir, "live-context-size.json"),
    `${JSON.stringify(result, null, 2)}\n`
  );
  await fs.rm(path.join(stableDir, "live-panel.md"), { force: true }).catch(() => {});
}

function renderOutputByFormat(result, format, { verbose = false } = {}) {
  if (format === "json") {
    return `${JSON.stringify(result, null, 2)}\n`;
  }
  if (format === "prompt") {
    return renderCodexVscodeContextMinorGcPrompt(result);
  }
  if (format === "size") {
    return `${renderCodexVscodeContextMinorGcSizeLine(result)}\n`;
  }
  if (format === "panel") {
    return renderCodexVscodeContextMinorGcPanel(result);
  }
  if (format === "history") {
    return renderCodexVscodeContextMinorGcHistory(result);
  }
  return renderCodexVscodeContextMinorGcMarkdown(result, { verbose });
}

async function buildResult(argv) {
  const sessionsRoot = readFlag(argv, "--sessions-root", "");
  const cwd = readFlag(argv, "--cwd", process.cwd());
  const outputDir = readFlag(argv, "--output-dir", "");
  const format = readFlag(argv, "--format", "markdown");
  const hostOnlyFormats = new Set(["json", "size", "panel", "history", "header", "footer"]);
  return buildCodexVscodeContextMinorGc({
    cwd,
    prompt: readFlag(argv, "--prompt", ""),
    ...(sessionsRoot ? { sessionsRoot } : {}),
    sessionId: readFlag(argv, "--session-id", process.env.CODEX_THREAD_ID || ""),
    includeCommentary: hasFlag(argv, "--include-commentary"),
    maxMessages: Number(readFlag(argv, "--max-messages", "12")),
    contextMinorGc: {
      enabled: !hostOnlyFormats.has(format),
      transport: readFlag(argv, "--transport", "codex_exec"),
      model: readFlag(argv, "--model", "gpt-5.4"),
      reasoningEffort: readFlag(argv, "--reasoning-effort", "low"),
      timeoutMs: Number(readFlag(argv, "--timeout-ms", "120000")),
      hostContextWindowCap: Number(readFlag(argv, "--host-context-window-cap", "0")),
      historyLimit: Number(readFlag(argv, "--history-limit", "8")),
      outputDir,
      guarded: {
        enabled: hasFlag(argv, "--shadow-only") ? false : true
      }
    }
  });
}

async function runWatchLoop(argv, format) {
  const intervalMs = Math.max(500, Number(readFlag(argv, "--interval-ms", "2000")));
  const cwd = readFlag(argv, "--cwd", process.cwd());
  const outputDir = readFlag(argv, "--output-dir", "") || buildDefaultOutputDir(cwd);
  const explicitFile = readFlag(argv, "--write-file", "");
  const defaultFileName = format === "history"
    ? "live-history.md"
    : format === "size"
      ? "live-size.txt"
      : "live-panel.md";
  const writeFilePath = explicitFile || path.join(outputDir, defaultFileName);
  const verbose = hasFlag(argv, "--verbose");

  let active = true;
  const stop = () => {
    active = false;
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  while (active) {
    const result = await buildResult(argv);
    const content = renderOutputByFormat(result, format, { verbose });
    await writeOutputFile(writeFilePath, content);

    if (process.stdout.isTTY) {
      process.stdout.write("\x1bc");
    }
    process.stdout.write(content);

    if (!active) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

async function main() {
  const argv = process.argv.slice(2);
  if (hasFlag(argv, "--help")) {
    printUsage();
    process.exit(0);
  }

  const format = readFlag(argv, "--format", "markdown");
  if (hasFlag(argv, "--watch")) {
    await runWatchLoop(argv, format === "markdown" ? "panel" : format);
    return;
  }

  const cwd = readFlag(argv, "--cwd", process.cwd());
  const outputDir = readFlag(argv, "--output-dir", "");
  const result = await buildResult(argv);
  await writeStableArtifacts({
    result,
    cwd,
    outputDir: outputDir || buildDefaultOutputDir(cwd)
  });

  if (format === "json") {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (format === "prompt") {
    process.stdout.write(renderCodexVscodeContextMinorGcPrompt(result));
    return;
  }

  if (format === "size") {
    process.stdout.write(renderOutputByFormat(result, format));
    return;
  }

  if (format === "panel") {
    process.stdout.write(renderOutputByFormat(result, format));
    return;
  }

  if (format === "history") {
    process.stdout.write(renderOutputByFormat(result, format));
    return;
  }

  if (format === "header" || format === "footer") {
    const line = format === "header"
      ? ""
      : renderCodexVscodeContextMinorGcFooter(result);
    process.stdout.write(line ? `${line}\n` : "");
    return;
  }

  process.stdout.write(renderOutputByFormat(result, format, {
    verbose: hasFlag(argv, "--verbose")
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
