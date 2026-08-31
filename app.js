(() => {
  "use strict";

  const safeFilename = globalThis.safeFilename;

  const COLORS = [
    "#ff0000",
    "#0000ff",
    "#008000",
    "#b22222",
    "#ff7f50",
    "#9acd32",
    "#ff4500",
    "#2e8b57",
    "#daa520",
    "#d2691e",
    "#5f9ea0",
    "#1e90ff",
    "#ff69b4",
    "#8a2be2",
    "#00ff7f",
  ];

  const BADGES = [
    { id: "staff", label: "Staff", src: "assets/staff.png" },
    { id: "turbo", label: "Turbo", src: "assets/turbo.png" },
    { id: "broadcaster", label: "Broadcaster", src: "assets/broadcaster.png" },
    { id: "moderator", label: "Moderator", src: "assets/moderator.png" },
    { id: "verified", label: "Verified", src: "assets/verified.png" },
    { id: "vip", label: "VIP", src: "assets/vip.png" },
    { id: "artist", label: "Artist", src: "assets/artist.png" },
    { id: "dj", label: "DJ", src: "assets/dj.png" },
    { id: "subscriber", label: "Subscriber", src: "assets/subscriber.png" },
  ];

  const DEFAULT_COLOR = "#8a2be2";

  function parseHexColor(value) {
    const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(value).trim());
    if (!match) return null;
    let hex = match[1].toLowerCase();
    if (hex.length === 3) {
      hex = hex.split("").map((ch) => ch + ch).join("");
    }
    return `#${hex}`;
  }

  const state = {
    username: "",
    message: "",
    color: DEFAULT_COLOR,
    selectedBadgeIds: [],
    customBadges: [],
  };

  const elements = {
    usernameInput: document.querySelector("#usernameInput"),
    messageInput: document.querySelector("#messageInput"),
    colorPalette: document.querySelector("#colorPalette"),
    colorHexInput: document.querySelector("#colorHexInput"),
    badgePalette: document.querySelector("#badgePalette"),
    customBadgeInput: document.querySelector("#customBadgeInput"),
    messagePreview: document.querySelector("#messagePreview"),
    selectedBadges: document.querySelector("#selectedBadges"),
    usernamePreview: document.querySelector("#usernamePreview"),
    messagePreviewText: document.querySelector("#messagePreviewText"),
    downloadButton: document.querySelector("#downloadButton"),
    resetButton: document.querySelector("#resetButton"),
    statusText: document.querySelector("#statusText"),
  };

  function allBadges() {
    return [...BADGES, ...state.customBadges];
  }

  function selectedBadges() {
    const badgesById = new Map(allBadges().map((badge) => [badge.id, badge]));
    return state.selectedBadgeIds
      .map((id) => badgesById.get(id))
      .filter(Boolean);
  }

  function renderColors() {
    elements.colorPalette.replaceChildren(
      ...COLORS.map((color) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `color-button${state.color === color ? " selected" : ""}`;
        button.style.setProperty("--swatch", color);
        button.setAttribute("aria-label", `Use username color ${color}`);
        button.setAttribute("aria-pressed", String(state.color === color));
        button.addEventListener("click", () => {
          state.color = color;
          elements.colorHexInput.value = color;
          elements.colorHexInput.setAttribute("aria-invalid", "false");
          renderColors();
          renderPreview();
        });
        return button;
      }),
    );
  }

  function renderBadges() {
    elements.badgePalette.replaceChildren(
      ...allBadges().map((badge) => {
        const isSelected = state.selectedBadgeIds.includes(badge.id);
        const button = document.createElement("button");
        const image = document.createElement("img");

        button.type = "button";
        button.className = `badge-button${isSelected ? " selected" : ""}`;
        button.title = badge.label;
        button.setAttribute("aria-label", `${isSelected ? "Remove" : "Add"} ${badge.label} badge`);
        button.setAttribute("aria-pressed", String(isSelected));
        image.src = badge.src;
        image.alt = "";
        button.append(image);
        button.addEventListener("click", () => toggleBadge(badge.id));
        return button;
      }),
    );
  }

  function toggleBadge(id) {
    const index = state.selectedBadgeIds.indexOf(id);
    if (index === -1) {
      state.selectedBadgeIds.push(id);
    } else {
      state.selectedBadgeIds.splice(index, 1);
    }
    renderBadges();
    renderPreview();
  }

  function renderPreview() {
    const username = state.username.trim() || "username";
    const message = state.message || "message";
    const colon = document.createElement("span");
    colon.textContent = ":";

    elements.usernamePreview.replaceChildren(username, colon);
    elements.usernamePreview.style.color = state.color;
    elements.messagePreviewText.textContent = message;
    elements.selectedBadges.replaceChildren(
      ...selectedBadges().map((badge) => {
        const image = document.createElement("img");
        image.src = badge.src;
        image.alt = badge.label;
        return image;
      }),
    );
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result)));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image), { once: true });
      image.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), {
        once: true,
      });
      image.src = src;
    });
  }

  async function downloadMessage() {
    elements.downloadButton.disabled = true;
    elements.statusText.textContent = "Rendering PNG...";

    try {
      if (!window.htmlToImage) throw new Error("The PNG renderer did not load.");
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      const width = elements.messagePreview.clientWidth * 2;
      const height = elements.messagePreview.clientHeight * 2;
      const url = await window.htmlToImage.toPng(elements.messagePreview, {
        pixelRatio: 2,
        style: {
          margin: "0",
          transform: "none",
        },
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = safeFilename(state.username, state.message);
      document.body.append(link);
      link.click();
      link.remove();
      elements.statusText.textContent = `${width} x ${height} PNG downloaded.`;
    } catch (error) {
      console.error(error);
      elements.statusText.textContent = "Export failed. Open this page through start-local.sh and retry.";
    } finally {
      elements.downloadButton.disabled = false;
    }
  }

  function reset() {
    state.username = "";
    state.message = "";
    state.color = DEFAULT_COLOR;
    state.selectedBadgeIds = [];
    state.customBadges = [];
    elements.usernameInput.value = "";
    elements.messageInput.value = "";
    elements.customBadgeInput.value = "";
    elements.colorHexInput.value = DEFAULT_COLOR;
    elements.colorHexInput.setAttribute("aria-invalid", "false");
    elements.statusText.textContent = "Ready to export at 2x resolution.";
    renderColors();
    renderBadges();
    renderPreview();
  }

  elements.colorHexInput.addEventListener("input", (event) => {
    const parsed = parseHexColor(event.currentTarget.value);
    if (!parsed) {
      event.currentTarget.setAttribute(
        "aria-invalid",
        event.currentTarget.value.trim() ? "true" : "false",
      );
      return;
    }
    state.color = parsed;
    event.currentTarget.setAttribute("aria-invalid", "false");
    renderColors();
    renderPreview();
  });

  elements.usernameInput.addEventListener("input", (event) => {
    state.username = event.currentTarget.value;
    renderPreview();
  });

  elements.messageInput.addEventListener("input", (event) => {
    state.message = event.currentTarget.value;
    renderPreview();
  });

  elements.customBadgeInput.addEventListener("change", async (event) => {
    const [file] = event.currentTarget.files;
    if (!file) return;

    try {
      const src = await readFileAsDataUrl(file);
      await loadImage(src);
      const id = `custom-${Date.now()}`;
      state.customBadges.push({ id, label: file.name, src });
      state.selectedBadgeIds.push(id);
      renderBadges();
      renderPreview();
      elements.statusText.textContent = `Added custom badge: ${file.name}`;
    } catch (error) {
      console.error(error);
      elements.statusText.textContent = "That badge image could not be loaded.";
    } finally {
      event.currentTarget.value = "";
    }
  });

  elements.downloadButton.addEventListener("click", downloadMessage);
  elements.resetButton.addEventListener("click", reset);

  renderColors();
  renderBadges();
  renderPreview();
})();
