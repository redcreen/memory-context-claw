import allCases from "./openclaw-memory-improvement-ab-cases.js";

const targetIds = new Set([
  "ab100-zh-history-editor-2",
  "ab100-zh-history-editor-4"
]);

const cases = allCases.filter((item) => targetIds.has(item.id));

export default cases;
