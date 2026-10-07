(() => {
  "use strict";

  const repoGrid = document.querySelector("#repo-grid");
  const repoGridMore = document.querySelector("#repo-grid-more");
  const repoStatus = document.querySelector("#repo-status");
  const repoSorter = document.querySelector("#repo-sorter");
  const repoSortButtons = [...document.querySelectorAll("[data-repo-sort]")];
  const repoRefresh = document.querySelector("#repo-refresh");
  const repoToggle = document.querySelector("#repo-toggle");
  const repoContent = document.querySelector("#repo-content");
  const dateFormatter = new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" });
  const numberFormatter = new Intl.NumberFormat("fa-IR");
  const repositoryIndexFormatter = new Intl.NumberFormat("fa-IR", {
    minimumIntegerDigits: 2
  });
  let repositoryMessages;
  let allRepositories = [];
  let sortMode = "stars";
  let isLoading = false;
  repoSorter.dataset.sort = sortMode;

  function appendText(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function setRepositoryListExpanded(expanded) {
    const remainingCount = repoGridMore.querySelectorAll(".repo-card").length;
    repoToggle.setAttribute("aria-expanded", String(expanded));
    repoToggle.setAttribute(
      "aria-label",
      expanded
        ? "بستن مخزن‌های بیشتر"
        : `نمایش ${numberFormatter.format(remainingCount)} مخزن دیگر`
    );
    repoContent.setAttribute("aria-hidden", String(!expanded));
    repoContent.classList.toggle("is-open", expanded);
    repoContent.inert = !expanded;
  }

  repoToggle?.addEventListener("click", () => {
    const expanded = repoToggle.getAttribute("aria-expanded") !== "true";
    setRepositoryListExpanded(expanded);
  });

  function renderRepository(repository, index, targetGrid) {
    const card = document.createElement("article");
    card.className = "repo-card";

    const top = document.createElement("div");
    top.className = "repo-card-top";
    appendText(
      top,
      "span",
      "repo-card-index",
      `مخزن / ${repositoryIndexFormatter.format(index + 1)}`
    );
    appendText(top, "span", "repo-visibility", "عمومی");
    card.append(top);

    const nameHeading = appendText(card, "h3", "repo-name", "");
    const nameLink = appendText(nameHeading, "a", "", repository.name);
    nameLink.href = repository.html_url;
    nameLink.target = "_blank";
    nameLink.rel = "noopener noreferrer";
    appendText(
      card,
      "p",
      "repo-description",
      repository.description || repositoryMessages.repositoryDescriptionFallback
    );

    const meta = document.createElement("div");
    meta.className = "repo-meta";
    if (repository.language) {
      const language = document.createElement("span");
      language.className = "repo-language";
      appendText(language, "span", "language-dot", "");
      appendText(language, "span", "", repository.language);
      meta.append(language);
    }

    appendText(meta, "span", "", `★ ${numberFormatter.format(repository.stargazers_count)}`);
    appendText(meta, "span", "", `⑂ ${numberFormatter.format(repository.forks_count)}`);
    appendText(meta, "span", "repo-updated", `به‌روزرسانی ${dateFormatter.format(new Date(repository.updated_at))}`);
    card.append(meta);
    targetGrid.append(card);
  }

  function compareByRecentlyUpdated(first, second) {
    return (Date.parse(second.updated_at) || 0) - (Date.parse(first.updated_at) || 0);
  }

  function renderRepositories() {
    const sortedRepositories = [...allRepositories]
      .sort((first, second) => {
        if (sortMode === "recent") {
          return compareByRecentlyUpdated(first, second);
        }

        const starDifference =
          (Number(second.stargazers_count) || 0) -
          (Number(first.stargazers_count) || 0);
        return starDifference || compareByRecentlyUpdated(first, second);
      })
      .slice(0, 9);

    repoGrid.replaceChildren();
    repoGridMore.replaceChildren();
    sortedRepositories.forEach((repository, index) => {
      renderRepository(repository, index, index < 3 ? repoGrid : repoGridMore);
    });
    const remainingCount = Math.max(0, sortedRepositories.length - 3);
    repoToggle.hidden = remainingCount === 0;
    setRepositoryListExpanded(false);
    repoStatus.textContent = `${numberFormatter.format(sortedRepositories.length)} مخزن عمومی`;
  }

  function setSortMode(mode) {
    sortMode = mode;
    repoSorter.dataset.sort = mode;
    repoSortButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.repoSort === mode));
    });
    renderRepositories();
  }

  repoSortButtons.forEach((button) => {
    button.addEventListener("click", () => setSortMode(button.dataset.repoSort));
  });

  async function loadRepositories() {
    if (!repoGrid || !repoGridMore || !repoStatus || !repoToggle || !repoContent || !repoRefresh || isLoading) return;
    isLoading = true;
    repoStatus.classList.remove("is-empty");
    repoRefresh.disabled = true;
    repoRefresh.setAttribute("aria-busy", "true");

    try {
      const settings = await window.siteSettingsReady;
      repositoryMessages = settings.content.github;
      if (
        typeof repositoryMessages.loadingMessage !== "string" ||
        typeof repositoryMessages.emptyMessage !== "string" ||
        typeof repositoryMessages.loadErrorMessage !== "string" ||
        typeof repositoryMessages.repositoryDescriptionFallback !== "string"
      ) {
        throw new Error("Site settings must contain repository status messages.");
      }
      repoStatus.textContent = repositoryMessages.loadingMessage;
      const requestUrl = new URL(settings.github.repositoriesApiUrl);
      const query = new URLSearchParams(requestUrl.search);
      new URLSearchParams({
        type: "owner",
        sort: "updated",
        per_page: "100",
        _: String(Date.now())
      }).forEach((value, key) => query.set(key, value));
      requestUrl.search = query.toString();
      const response = await fetch(
        requestUrl,
        {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store"
        }
      );
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
      }

      const repositories = await response.json();
      if (!Array.isArray(repositories)) {
        throw new Error("GitHub API returned an unexpected response.");
      }

      allRepositories = repositories.filter((repository) => !repository.fork);

      if (allRepositories.length === 0) {
        repoGrid.replaceChildren();
        repoGridMore.replaceChildren();
        repoSorter.hidden = true;
        repoToggle.hidden = true;
        setRepositoryListExpanded(false);
        repoStatus.classList.add("is-empty");
        repoStatus.textContent = repositoryMessages.emptyMessage;
        return;
      }

      repoStatus.classList.remove("is-empty");
      repoSorter.hidden = false;
      renderRepositories();
    } catch (error) {
      repoStatus.classList.remove("is-empty");
      repoStatus.textContent =
        repositoryMessages?.loadErrorMessage ||
        "دریافت مخزن‌ها انجام نشد؛ می‌توانی صفحه گیت‌هاب را باز کنی.";
      console.error("Could not load GitHub repositories:", error);
    } finally {
      isLoading = false;
      repoRefresh.disabled = false;
      repoRefresh.removeAttribute("aria-busy");
    }
  }

  repoRefresh?.addEventListener("click", loadRepositories);
  loadRepositories();
})();
