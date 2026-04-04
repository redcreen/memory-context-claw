import test from "node:test";
import assert from "node:assert/strict";
import { rewriteRetrievalQueries } from "../src/query-rewrite.js";

test("rewriteRetrievalQueries keeps original query and adds intent rewrite", () => {
  const queries = rewriteRetrievalQueries("Lossless 插件 和 长期记忆 的区别", {
    maxQueries: 4
  });

  assert.equal(queries[0], "Lossless 插件 和 长期记忆 的区别");
  assert.ok(queries.some((item) => item.includes("为什么容易混淆")));
});

test("rewriteRetrievalQueries limits rewrite count", () => {
  const queries = rewriteRetrievalQueries("MEMORY.md 的使用原则", {
    maxQueries: 2
  });

  assert.equal(queries.length, 2);
});
