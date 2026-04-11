#!/usr/bin/env node

import {
  createIndependentExecutionReview,
  renderIndependentExecutionReview
} from "../src/unified-memory-core/index.js";

function readFlag(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const format = readFlag("--format", "json");
const review = await createIndependentExecutionReview({
  repoRoot: readFlag("--repo-root", process.cwd())
});

if (format === "markdown") {
  console.log(renderIndependentExecutionReview(review));
} else {
  console.log(JSON.stringify(review, null, 2));
}
