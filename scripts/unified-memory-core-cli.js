#!/usr/bin/env node

import { createStandaloneRuntime } from "../src/unified-memory-core/standalone-runtime.js";
import { renderGovernanceAuditReport } from "../src/unified-memory-core/index.js";

function parseArgs(argv) {
  const flags = {};
  const positionals = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
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

  return {
    positionals,
    flags
  };
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function parseNamespaceFromFlags(flags) {
  return {
    tenant: normalizeString(flags.tenant, "local"),
    scope: normalizeString(flags.scope, "workspace"),
    resource: normalizeString(flags.resource, "unified-memory-core"),
    key: normalizeString(flags.key, "default"),
    ...(normalizeString(flags.host, "") ? { host: normalizeString(flags.host, "") } : {})
  };
}

function parseListFlag(value, fallback) {
  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDeclaredSource(flags) {
  const sourceType = normalizeString(flags["source-type"], "manual");
  const declaredSource = {
    sourceType,
    declaredBy: normalizeString(flags["declared-by"], "standalone-cli"),
    namespace: parseNamespaceFromFlags(flags),
    visibility: normalizeString(flags.visibility, "workspace")
  };

  if (sourceType === "manual") {
    declaredSource.content = normalizeString(flags.content);
  } else if (sourceType === "conversation") {
    declaredSource.messages = [
      {
        role: normalizeString(flags.role, "user"),
        content: normalizeString(flags.content)
      }
    ];
  } else {
    declaredSource.path = normalizeString(flags.path);
  }

  return declaredSource;
}

async function run() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const [family = "help", action = ""] = positionals;
  const runtime = createStandaloneRuntime({
    config: {
      registryDir: normalizeString(flags["registry-dir"], ""),
      namespace: parseNamespaceFromFlags(flags),
      visibility: normalizeString(flags.visibility, "workspace")
    }
  });

  let result;
  if (family === "source" && action === "add") {
    result = await runtime.addSource(buildDeclaredSource(flags), {
      persist: true
    });
  } else if (family === "reflect" && action === "run") {
    result = await runtime.reflectDeclaredSource({
      declaredSource: buildDeclaredSource(flags),
      dryRun: Boolean(flags["dry-run"]),
      promoteCandidates: Boolean(flags.promote)
    });
  } else if (family === "export" && action === "build") {
    result = await runtime.buildExport({
      consumer: normalizeString(flags.consumer, "generic"),
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
  } else if (family === "govern" && action === "audit") {
    const report = await runtime.auditNamespace({
      namespace: parseNamespaceFromFlags(flags),
      allowedVisibilities: parseListFlag(flags["allowed-visibilities"], undefined),
      allowedStates: parseListFlag(flags["allowed-states"], undefined)
    });
    result = flags.format === "markdown"
      ? renderGovernanceAuditReport(report)
      : report;
  } else {
    result = {
      usage: [
        "source add --source-type manual --content 'text'",
        "reflect run --source-type manual --content 'text' [--dry-run] [--promote]",
        "export build --consumer generic",
        "govern audit [--format markdown]"
      ]
    };
  }

  if (typeof result === "string") {
    console.log(result);
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
