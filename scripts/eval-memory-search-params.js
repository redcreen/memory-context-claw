#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CONFIG_PATH = "/Users/redcreen/.openclaw/openclaw.json";
const REPORT_PATH = "/Users/redcreen/Project/长记忆/context-assembly-claw/reports/memory-search-param-eval.md";
const AGENT_ID = "main";
const QUERY = "用户爱吃什么 饮食 喜欢吃 刘超 超哥";

const COMBOS = [
  {
    name: "baseline-default",
    config: null,
    cli: { maxResults: 20, minScore: 0.2 }
  },
  {
    name: "temporal-7d",
    config: {
      query: {
        maxResults: 20,
        minScore: 0.2,
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          temporalDecay: { enabled: true, halfLifeDays: 7 }
        }
      }
    },
    cli: { maxResults: 20, minScore: 0.2 }
  },
  {
    name: "temporal-1d",
    config: {
      query: {
        maxResults: 20,
        minScore: 0.2,
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          temporalDecay: { enabled: true, halfLifeDays: 1 }
        }
      }
    },
    cli: { maxResults: 20, minScore: 0.2 }
  },
  {
    name: "text-heavy",
    config: {
      query: {
        maxResults: 20,
        minScore: 0.2,
        hybrid: {
          enabled: true,
          vectorWeight: 0.35,
          textWeight: 0.65,
          candidateMultiplier: 8,
          temporalDecay: { enabled: true, halfLifeDays: 7 }
        }
      }
    },
    cli: { maxResults: 20, minScore: 0.2 }
  },
  {
    name: "text-dominant",
    config: {
      query: {
        maxResults: 30,
        minScore: 0.15,
        hybrid: {
          enabled: true,
          vectorWeight: 0.2,
          textWeight: 0.8,
          candidateMultiplier: 12,
          temporalDecay: { enabled: true, halfLifeDays: 7 }
        }
      }
    },
    cli: { maxResults: 30, minScore: 0.15 }
  },
  {
    name: "wide-candidate-pool",
    config: {
      query: {
        maxResults: 30,
        minScore: 0.1,
        hybrid: {
          enabled: true,
          vectorWeight: 0.55,
          textWeight: 0.45,
          candidateMultiplier: 12,
          temporalDecay: { enabled: true, halfLifeDays: 3 }
        }
      }
    },
    cli: { maxResults: 30, minScore: 0.1 }
  },
  {
    name: "mmr-diversity",
    config: {
      query: {
        maxResults: 30,
        minScore: 0.15,
        hybrid: {
          enabled: true,
          vectorWeight: 0.55,
          textWeight: 0.45,
          candidateMultiplier: 12,
          mmr: { enabled: true, lambda: 0.45 },
          temporalDecay: { enabled: true, halfLifeDays: 7 }
        }
      }
    },
    cli: { maxResults: 30, minScore: 0.15 }
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function merge(target, patch) {
  if (patch == null || typeof patch !== "object" || Array.isArray(patch)) {
    return patch;
  }
  const output = Array.isArray(target) ? [...target] : { ...(target || {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = merge(output[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

async function loadConfig() {
  return JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
}

async function saveConfig(config) {
  await fs.writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function setMainMemorySearchQuery(config, queryPatch) {
  const next = clone(config);
  const agents = next.agents || (next.agents = {});
  const list = Array.isArray(agents.list) ? agents.list : [];
  const main = list.find((item) => item.id === AGENT_ID);
  if (!main) {
    throw new Error("main agent not found in config");
  }
  main.memorySearch = merge(main.memorySearch || {}, queryPatch ? { query: queryPatch.query } : {});
  if (!queryPatch) {
    delete main.memorySearch.query;
  }
  return next;
}

function parseJsonFromStdout(stdout) {
  const idx = stdout.indexOf("{");
  if (idx < 0) {
    throw new Error(`No JSON payload found in stdout:\n${stdout}`);
  }
  return JSON.parse(stdout.slice(idx));
}

async function runSearch({ maxResults, minScore }) {
  const { stdout } = await execFileAsync("openclaw", [
    "memory",
    "search",
    "--agent",
    AGENT_ID,
    "--json",
    "--max-results",
    String(maxResults),
    "--min-score",
    String(minScore),
    "--query",
    QUERY
  ], {
    cwd: "/Users/redcreen/Project/长记忆",
    maxBuffer: 1024 * 1024 * 8,
    timeout: 30000
  });
  return parseJsonFromStdout(stdout);
}

function summarize(results) {
  const rows = results.results || [];
  const steakIndex = rows.findIndex((row) =>
    String(row.path || "").includes("food-preference")
    || String(row.snippet || "").includes("牛排")
  );
  const memoryIndex = rows.findIndex((row) => String(row.path || "").startsWith("memory/"));
  const topSources = rows.slice(0, 10).reduce((acc, row) => {
    const key = row.source || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return {
    total: rows.length,
    steakRank: steakIndex >= 0 ? steakIndex + 1 : null,
    firstMemoryRank: memoryIndex >= 0 ? memoryIndex + 1 : null,
    memoryHits: rows.filter((row) => String(row.path || "").startsWith("memory/")).length,
    topSources,
    firstFive: rows.slice(0, 5).map((row) => ({
      path: row.path,
      score: row.score,
      snippet: String(row.snippet || "").slice(0, 80)
    }))
  };
}

function renderReport(entries) {
  const lines = [];
  lines.push("# Memory Search 参数实验");
  lines.push("");
  lines.push(`- 时间: \`${new Date().toISOString()}\``);
  lines.push(`- Agent: \`${AGENT_ID}\``);
  lines.push(`- 查询: \`${QUERY}\``);
  lines.push("");
  lines.push("## 结论摘要");
  lines.push("");
  for (const entry of entries) {
    lines.push(`- \`${entry.name}\`: total=\`${entry.summary.total}\` · steakRank=\`${entry.summary.steakRank ?? "not-found"}\` · firstMemoryRank=\`${entry.summary.firstMemoryRank ?? "not-found"}\` · memoryHits=\`${entry.summary.memoryHits}\``);
  }
  lines.push("");
  lines.push("## 逐组结果");
  lines.push("");
  for (const entry of entries) {
    lines.push(`### ${entry.name}`);
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(entry.config ?? { query: "default" }, null, 2));
    lines.push("```");
    lines.push("");
    lines.push(`- steakRank: \`${entry.summary.steakRank ?? "not-found"}\``);
    lines.push(`- firstMemoryRank: \`${entry.summary.firstMemoryRank ?? "not-found"}\``);
    lines.push(`- memoryHits: \`${entry.summary.memoryHits}\``);
    lines.push(`- topSources: \`${JSON.stringify(entry.summary.topSources)}\``);
    lines.push("");
    lines.push("Top 5:");
    for (const row of entry.summary.firstFive) {
      lines.push(`- \`${row.path}\` · score=\`${row.score}\` · ${row.snippet}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

async function main() {
  const original = await loadConfig();
  const results = [];
  try {
    for (const combo of COMBOS) {
      const nextConfig = setMainMemorySearchQuery(original, combo.config);
      await saveConfig(nextConfig);
      const searchResults = await runSearch(combo.cli);
      results.push({
        name: combo.name,
        config: combo.config,
        cli: combo.cli,
        summary: summarize(searchResults)
      });
    }
  } finally {
    await saveConfig(original);
  }

  await fs.writeFile(REPORT_PATH, renderReport(results), "utf8");
  console.log(`Wrote report to ${REPORT_PATH}`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
