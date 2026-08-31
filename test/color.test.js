"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { parseHexColor } = require("../color.js");

describe("parseHexColor", () => {
  test("accepts lowercase six-digit hex", () => {
    assert.equal(parseHexColor("#8a2be2"), "#8a2be2");
  });

  test("normalizes uppercase six-digit hex to lowercase", () => {
    assert.equal(parseHexColor("#FF69B4"), "#ff69b4");
  });

  test("expands three-digit hex to six digits", () => {
    assert.equal(parseHexColor("#f0c"), "#ff00cc");
  });

  test("expands mixed-case three-digit hex", () => {
    assert.equal(parseHexColor("#AbC"), "#aabbcc");
  });

  test("trims surrounding whitespace", () => {
    assert.equal(parseHexColor("  #00ff7f  "), "#00ff7f");
  });

  test("rejects empty and whitespace-only values", () => {
    assert.equal(parseHexColor(""), null);
    assert.equal(parseHexColor("   "), null);
  });

  test("rejects missing hash and bare hex digits", () => {
    assert.equal(parseHexColor("8a2be2"), null);
    assert.equal(parseHexColor("fff"), null);
  });

  test("rejects wrong lengths", () => {
    assert.equal(parseHexColor("#ff"), null);
    assert.equal(parseHexColor("#ffff"), null);
    assert.equal(parseHexColor("#fffffff"), null);
  });

  test("rejects non-hex characters", () => {
    assert.equal(parseHexColor("#gg0000"), null);
    assert.equal(parseHexColor("#12zz34"), null);
  });

  test("rejects values that are not strings without coercing objects oddly", () => {
    assert.equal(parseHexColor(null), null);
    assert.equal(parseHexColor(undefined), null);
  });
});
