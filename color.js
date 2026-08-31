(() => {
  "use strict";

  function parseHexColor(value) {
    const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(value).trim());
    if (!match) return null;
    let hex = match[1].toLowerCase();
    if (hex.length === 3) {
      hex = hex.split("").map((ch) => ch + ch).join("");
    }
    return `#${hex}`;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { parseHexColor };
  } else {
    globalThis.parseHexColor = parseHexColor;
  }
})();
