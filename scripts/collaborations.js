(() => {
  "use strict";

  const collabGrid = document.querySelector("#collab-grid");
  const collabGridMore = document.querySelector("#collab-grid-more");
  const collabStatus = document.querySelector("#collab-status");
  const collabToggle = document.querySelector("#collab-toggle");
  const collabContent = document.querySelector("#collab-content");
  const numberFormatter = new Intl.NumberFormat("fa-IR", {
    minimumIntegerDigits: 2
  });
  const countFormatter = new Intl.NumberFormat("fa-IR");

  function appendText(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function setCollaborationListExpanded(expanded) {
    const remainingCount = collabGridMore.querySelectorAll(".collab-card").length;
    collabToggle.setAttribute("aria-expanded", String(expanded));
    collabToggle.setAttribute(
      "aria-label",
      expanded
        ? "بستن همکاری‌های بیشتر"
        : `نمایش ${countFormatter.format(remainingCount)} همکاری دیگر`
    );
    collabContent.setAttribute("aria-hidden", String(!expanded));
    collabContent.classList.toggle("is-open", expanded);
    collabContent.inert = !expanded;
  }

  collabToggle?.addEventListener("click", () => {
    const expanded = collabToggle.getAttribute("aria-expanded") !== "true";
    setCollaborationListExpanded(expanded);
  });

  function safeUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    const url = value.trim();
    if (url.startsWith("/") && !url.startsWith("//")) return url;
    if (url.startsWith("#")) return url;

    try {
      const parsedUrl = new URL(url, window.location.href);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? url : "";
    } catch {
      return "";
    }
  }

  function renderCollaboration(collaboration, index, targetGrid) {
    const card = document.createElement("article");
    card.className = "collab-card";

    const top = document.createElement("div");
    top.className = "collab-card-top";
    appendText(
      top,
      "span",
      "collab-card-index",
      `همکاری / ${numberFormatter.format(index + 1)}`
    );
    card.append(top);

    const photoUrl = safeUrl(collaboration.photo);
    if (photoUrl) {
      const photo = document.createElement("img");
      photo.className = "collab-photo";
      photo.alt = collaboration.name;
      photo.loading = "lazy";
      photo.addEventListener("error", () => photo.remove(), { once: true });
      photo.src = photoUrl;
      card.append(photo);
    }

    const nameHeading = appendText(card, "h3", "collab-name", "");
    const linkUrl = safeUrl(collaboration.link);
    if (linkUrl) {
      const link = appendText(nameHeading, "a", "", collaboration.name);
      link.href = linkUrl;
      if (/^https?:\/\//i.test(linkUrl)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    } else {
      nameHeading.textContent = collaboration.name;
    }

    if (typeof collaboration.description === "string" && collaboration.description.trim()) {
      appendText(card, "p", "collab-description", collaboration.description.trim());
    }

    targetGrid.append(card);
  }

  async function loadCollaborations() {
    if (!collabGrid || !collabGridMore || !collabStatus || !collabToggle || !collabContent) return;

    let messages;
    try {
      const settings = await window.siteSettingsReady;
      messages = settings.content.collaborations;
      if (
        typeof messages.emptyMessage !== "string" ||
        typeof messages.loadErrorMessage !== "string"
      ) {
        throw new Error("Site settings must contain collaboration status messages.");
      }
      const response = await fetch("./collaborations.json");
      if (!response.ok) {
        throw new Error(`Collaboration data request failed with ${response.status}`);
      }

      const data = await response.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Collaboration data must be a JSON object.");
      }

      const collaborations = Object.values(data).filter((item) =>
        item &&
        typeof item === "object" &&
        item.enabled !== false &&
        typeof item.name === "string" &&
        item.name.trim()
      );

      if (collaborations.length === 0) {
        collabGrid.replaceChildren();
        collabGridMore.replaceChildren();
        collabToggle.hidden = true;
        setCollaborationListExpanded(false);
        collabStatus.classList.add("is-empty");
        collabStatus.textContent = messages.emptyMessage;
        return;
      }

      collabStatus.classList.remove("is-empty");
      collabGrid.replaceChildren();
      collabGridMore.replaceChildren();
      collaborations.forEach((collaboration, index) => {
        renderCollaboration(collaboration, index, index < 6 ? collabGrid : collabGridMore);
      });
      const remainingCount = Math.max(0, collaborations.length - 6);
      collabToggle.hidden = remainingCount === 0;
      setCollaborationListExpanded(false);
      collabStatus.textContent = `${countFormatter.format(collaborations.length)} همکاری`;
    } catch (error) {
      collabStatus.classList.remove("is-empty");
      collabStatus.textContent =
        messages?.loadErrorMessage || "اطلاعات همکاری‌ها بارگذاری نشد.";
      console.error("Could not load collaboration data:", error);
    }
  }

  loadCollaborations();
})();
