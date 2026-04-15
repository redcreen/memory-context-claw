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

test("rewriteRetrievalQueries expands guess-policy wording", () => {
  const queries = rewriteRetrievalQueries("guessing policy", {
    maxQueries: 4
  });

  assert.ok(queries.some((item) => item.includes("guesses facts do not guess")));
});

test("rewriteRetrievalQueries strips benchmark-style agent wrapper instructions", () => {
  const queries = rewriteRetrievalQueries(
    "Based only on your memory for this agent, what coffee order should you assume for the user? If memory is missing, reply exactly: I don't know based on current memory.",
    { maxQueries: 4 }
  );

  assert.equal(queries[0], "what coffee order should you assume for the user");
});

test("rewriteRetrievalQueries strips Chinese benchmark-style agent wrapper instructions", () => {
  const queries = rewriteRetrievalQueries(
    "仅根据你当前这个 agent 的记忆，用户现在默认部署区域是什么？如果记忆里没有，请直接回答：我不知道当前记忆里有没有这条信息。",
    { maxQueries: 4 }
  );

  assert.equal(queries[0], "用户现在默认部署区域是什么");
});

test("rewriteRetrievalQueries expands natural Chinese preferred-name wording", () => {
  const queries = rewriteRetrievalQueries("平时我希望你怎么称呼我", {
    maxQueries: 5
  });

  assert.ok(queries.some((item) => item.includes("preferred name")));
});

test("rewriteRetrievalQueries expands natural Chinese deploy-region wording", () => {
  const queries = rewriteRetrievalQueries("现在默认部署区域到底用哪个", {
    maxQueries: 5
  });

  assert.ok(queries.some((item) => item.includes("current deploy region")));
});

test("rewriteRetrievalQueries expands natural Chinese no-guess wording", () => {
  const queries = rewriteRetrievalQueries("如果记忆不完整你应该怎么处理", {
    maxQueries: 5
  });

  assert.ok(queries.some((item) => item.includes("do not guess")));
});

test("rewriteRetrievalQueries expands natural Chinese notebook wording", () => {
  const queries = rewriteRetrievalQueries("开会现在用的是哪本本子", {
    maxQueries: 5
  });

  assert.ok(queries.some((item) => item.includes("current notebook for meetings")));
});
