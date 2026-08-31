(() => {
  "use strict";

  function safeFilename(username, message) {
    const stem = `message_${username || "username"}_${message || "message"}`
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120);
    return `${stem || "message"}.png`;
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { safeFilename };
  } else {
    globalThis.safeFilename = safeFilename;
  }
})();
