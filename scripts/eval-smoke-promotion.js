#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSmokePromotionSuggestions } from "../src/smoke-promotion.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const governancePath = path.join(repoRoot, "reports", "memory-search-governance-latest.json");
const smokeCasesPath = path.join(repoRoot, "evals", "smoke-cases.json");

const governance = JSON.parse(await fs.readFile(governancePath, "utf8"));
const smokeCases = JSON.parse(await fs.readFile(smokeCasesPath, "utf8"));

const result = buildSmokePromotionSuggestions(governance.results || [], smokeCases);

console.log(JSON.stringify(result, null, 2));
