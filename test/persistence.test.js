const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");

const KEY = "tmc-state-v1";
const scripts = ["color.js", "app.js"].map((file) =>
  readFileSync(resolve(__dirname, "..", file), "utf8"),
);

// Minimal DOM surface: run the actual app and dispatch its real event handlers.
class Element {
  constructor() {
    this.value = "";
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.style = { setProperty() {} };
  }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  setAttribute(name, value) { this.attributes[name] = value; }
  replaceChildren(...children) { this.children = children; }
  append(child) { this.children.push(child); }
  fire(type) { return this.listeners[type]({ currentTarget: this }); }
}

function storageWith(value) {
  const entries = new Map(value === undefined ? [] : [[KEY, value]]);
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
    removeItem: (key) => entries.delete(key),
  };
}

function boot(storage = storageWith()) {
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, new Element());
      return elements.get(selector);
    },
    createElement: () => new Element(),
  };
  const context = vm.createContext({ document, localStorage: storage });
  for (const script of scripts) vm.runInContext(script, context);
  return (id) => document.querySelector(`#${id}`);
}

function input(app, id, value) {
  app(id).value = value;
  app(id).fire("input");
}

test("reload restores edited text, normalized color, and ordered built-in badges", () => {
  const storage = storageWith();
  const app = boot(storage);
  input(app, "usernameInput", "Moonlight");
  input(app, "messageInput", "hello\nworld");
  input(app, "colorHexInput", "#AbC");
  app("badgePalette").children[3].fire("click");
  app("badgePalette").children[0].fire("click");

  assert.deepEqual(JSON.parse(storage.getItem(KEY)), {
    username: "Moonlight", message: "hello\nworld", color: "#aabbcc",
    selectedBadgeIds: ["moderator", "staff"],
  });
  const reloaded = boot(storage);
  assert.equal(reloaded("usernameInput").value, "Moonlight");
  assert.equal(reloaded("messageInput").value, "hello\nworld");
  assert.equal(reloaded("colorHexInput").value, "#aabbcc");
  assert.equal(reloaded("usernamePreview").style.color, "#aabbcc");
  assert.equal(reloaded("messagePreviewText").textContent, "hello\nworld");
  assert.deepEqual(reloaded("selectedBadges").children.map((img) => img.alt),
    ["Moderator", "Staff"]);
  assert.equal(reloaded("badgePalette").children[3].attributes["aria-pressed"], "true");
});

test("palette changes and badge removal persist; invalid typed hex keeps last valid color", () => {
  const storage = storageWith();
  const app = boot(storage);
  app("colorPalette").children[0].fire("click");
  app("badgePalette").children[0].fire("click");
  app("badgePalette").children[0].fire("click");
  input(app, "colorHexInput", "#oops");
  input(app, "messageInput", "still editing");
  assert.equal(JSON.parse(storage.getItem(KEY)).color, "#ff0000");
  assert.deepEqual(JSON.parse(storage.getItem(KEY)).selectedBadgeIds, []);
  assert.equal(boot(storage)("colorHexInput").value, "#ff0000");
});

test("reset clears only this app's stored state and reload returns to defaults", () => {
  const storage = storageWith(JSON.stringify({ username: "saved", color: "#123" }));
  storage.setItem("unrelated-key", "keep me");
  const app = boot(storage);
  app("resetButton").fire("click");
  assert.equal(storage.getItem(KEY), null);
  assert.equal(storage.getItem("unrelated-key"), "keep me");
  for (const current of [app, boot(storage)]) {
    assert.equal(current("usernameInput").value, "");
    assert.equal(current("messageInput").value, "");
    assert.equal(current("colorHexInput").value, "#8a2be2");
    assert.equal(current("selectedBadges").children.length, 0);
  }
});

test("restore validates individual fields and drops unknown, duplicate, and custom badge IDs", () => {
  const storage = storageWith(JSON.stringify({
    username: 42, message: "valid message", color: "red",
    selectedBadgeIds: ["vip", "missing", "custom-123", "vip", null, "staff"],
    customBadges: [{ id: "custom-123", src: "data:image/png;base64,ignored" }],
  }));
  const app = boot(storage);
  assert.equal(app("usernameInput").value, "");
  assert.equal(app("messageInput").value, "valid message");
  assert.equal(app("colorHexInput").value, "#8a2be2");
  assert.deepEqual(app("selectedBadges").children.map((img) => img.alt), ["VIP", "Staff"]);
  assert.equal(app("badgePalette").children.length, 9);
  input(app, "usernameInput", "updated");
  assert.deepEqual(JSON.parse(storage.getItem(KEY)), {
    username: "updated", message: "valid message", color: "#8a2be2",
    selectedBadgeIds: ["vip", "staff"],
  });
});

test("restored text respects the editor's length limits", () => {
  const app = boot(storageWith(JSON.stringify({
    username: "u".repeat(41), message: "m".repeat(501),
  })));
  assert.equal(app("usernameInput").value.length, 40);
  assert.equal(app("messageInput").value.length, 500);
});

test("missing, corrupt, and wrong-shaped storage fall back to defaults", () => {
  for (const saved of [undefined, "{broken", "null", "[]", "12", '"text"',
    '{"message":{},"color":{},"selectedBadgeIds":"vip"}']) {
    const app = boot(storageWith(saved));
    assert.equal(app("usernameInput").value, "");
    assert.equal(app("messageInput").value, "");
    assert.equal(app("colorHexInput").value, "#8a2be2");
    assert.equal(app("selectedBadges").children.length, 0);
  }
});

test("unavailable storage and quota errors do not interrupt editing or reset", () => {
  const fail = () => { throw new Error("Storage unavailable"); };
  for (const storage of [undefined, { getItem: fail, setItem: fail, removeItem: fail },
    { getItem: () => null, setItem: fail, removeItem: fail }]) {
    // Null models an unavailable localStorage global rather than the default helper.
    const app = boot(storage ?? null);
    input(app, "usernameInput", "still usable");
    input(app, "messageInput", "hello");
    input(app, "colorHexInput", "#123");
    app("badgePalette").children[0].fire("click");
    assert.equal(app("messagePreviewText").textContent, "hello");
    assert.equal(app("usernamePreview").style.color, "#112233");
    app("resetButton").fire("click");
    assert.equal(app("usernameInput").value, "");
  }
});
