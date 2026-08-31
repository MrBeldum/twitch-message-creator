"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { safeFilename } = require("../filename.js");

describe("safeFilename", () => {
  test("uses placeholders when username and message are empty", () => {
    assert.equal(safeFilename("", ""), "message_username_message.png");
  });

  test("uses placeholders when arguments are omitted", () => {
    assert.equal(safeFilename(), "message_username_message.png");
  });

  test("includes username and message in the stem", () => {
    assert.equal(safeFilename("alice", "hello"), "message_alice_hello.png");
  });

  test("always ends with .png", () => {
    assert.match(safeFilename("bob", "hi"), /\.png$/);
  });

  test("replaces Windows-illegal filename characters with underscores", () => {
    assert.equal(
      safeFilename("a<b>c:d\"e/f\\g|h?i*j", "ok"),
      "message_a_b_c_d_e_f_g_h_i_j_ok.png",
    );
  });

  test("replaces ASCII control characters with underscores", () => {
    assert.equal(safeFilename("a\u0000b\u001fc", "d\ne"), "message_a_b_c_d_e.png");
  });

  test("collapses consecutive whitespace to a single space", () => {
    assert.equal(
      safeFilename("ann  a", "hello   world"),
      "message_ann a_hello world.png",
    );
  });

  test("trims trailing whitespace on the stem", () => {
    assert.equal(safeFilename("x", "y "), "message_x_y.png");
  });

  test("strips path separators so the download name cannot escape a directory", () => {
    assert.equal(safeFilename("../etc", "passwd"), "message_.._etc_passwd.png");
    assert.equal(
      safeFilename("..\\..\\windows", "x"),
      "message_.._.._windows_x.png",
    );
  });

  test("truncates the stem to 120 characters before adding the extension", () => {
    const name = safeFilename("user", "m".repeat(200));
    assert.equal(name.length, 124);
    assert.equal(name.slice(-4), ".png");
    assert.equal(name.startsWith("message_user_"), true);
  });
});
