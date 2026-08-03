// ==UserScript==
// @name         Twitch Message Creator - block download ads
// @namespace    local.twitch-message-creator
// @version      1.0.0
// @description  Blocks the site's post-download popup and injected ad scripts.
// @match        https://www.twitchmessagecreator.site/*
// @match        https://twitchmessagecreator.site/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const blockedScriptHosts = new Set([
    "relieved-understanding.com",
    "www.pristine-station.com",
    "pristine-station.com",
  ]);
  const blockedPopupHosts = new Set([
    "affectionatestorage.com",
    ...blockedScriptHosts,
  ]);

  function hostnameFor(value) {
    try {
      return new URL(String(value || ""), location.href).hostname;
    } catch {
      return "";
    }
  }

  function isBlockedScript(node) {
    return node instanceof HTMLScriptElement && blockedScriptHosts.has(hostnameFor(node.src));
  }

  const nativeOpen = window.open;
  window.open = new Proxy(nativeOpen, {
    apply(target, thisArg, argumentsList) {
      if (blockedPopupHosts.has(hostnameFor(argumentsList[0]))) return null;
      return Reflect.apply(target, thisArg, argumentsList);
    },
  });

  const nativeAppendChild = Node.prototype.appendChild;
  Node.prototype.appendChild = function appendChild(node) {
    if (isBlockedScript(node)) return node;
    return nativeAppendChild.call(this, node);
  };

  const nativeInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function insertBefore(node, referenceNode) {
    if (isBlockedScript(node)) return node;
    return nativeInsertBefore.call(this, node, referenceNode);
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (isBlockedScript(node)) node.remove();
        if (!(node instanceof Element)) continue;
        for (const script of node.querySelectorAll("script[src]")) {
          if (isBlockedScript(script)) script.remove();
        }
      }
    }
  });

  observer.observe(document, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
      .ad-leaderboard-wrap,
      .ad-sidebar,
      .ad-rectangle-wrap,
      .ad-native-wrap,
      .ad-prefooter-wrap,
      .ad-mobile-sticky { display: none !important; }
    `;
    document.head.append(style);
  }, { once: true });
})();
