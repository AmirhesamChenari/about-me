(() => {
  "use strict";

  async function loadSiteSettings() {
    try {
      const response = await fetch("./site-settings.json");
      if (!response.ok) {
        throw new Error(`Site settings request failed with ${response.status}`);
      }

      const settings = await response.json();
      const siteTitle = settings?.site?.title;
      const email = settings?.contact?.email;
      const emailProvider = settings?.contact?.emailProvider;
      const github = settings?.github;
      const username = github?.username;
      const social = settings?.social;
      if (typeof siteTitle !== "string" || !siteTitle.trim()) {
        throw new Error("Site settings must contain a site title.");
      }
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Site settings must contain a valid contact email.");
      }
      if (typeof username !== "string" || !username.trim()) {
        throw new Error("Site settings must contain a GitHub username.");
      }

      let composeUrl;
      if (emailProvider === "gmail") {
        const url = new URL("https://mail.google.com/mail/");
        url.searchParams.set("view", "cm");
        url.searchParams.set("fs", "1");
        url.searchParams.set("to", email);
        composeUrl = url.href;
      } else {
        throw new Error(`Unsupported contact email provider: ${emailProvider}`);
      }

      const profileUrl = new URL(github.profileUrl);
      const repositoriesApiUrl = new URL(github.repositoriesApiUrl);
      if (
        profileUrl.protocol !== "https:" ||
        profileUrl.hostname !== "github.com" ||
        repositoriesApiUrl.protocol !== "https:" ||
        repositoriesApiUrl.hostname !== "api.github.com" ||
        !/^\/(users|orgs)\/[^/]+\/repos$/.test(repositoriesApiUrl.pathname)
      ) {
        throw new Error("Site settings must contain valid GitHub profile and repositories URLs.");
      }

      document.title = siteTitle.trim();

      document.querySelectorAll("[data-contact-email]").forEach((link) => {
        link.href = composeUrl;
      });
      document.querySelectorAll("[data-contact-email-text]").forEach((label) => {
        label.textContent = email;
      });

      const copyButton = document.querySelector("[data-copy-email]");
      copyButton?.setAttribute("data-copy-email", email);
      document.querySelectorAll("[data-github-profile]").forEach((link) => {
        link.href = profileUrl.href;
      });
      document.querySelectorAll("[data-github-username]").forEach((label) => {
        label.textContent = username;
      });
      ["telegram", "instagram", "whatsapp"].forEach((network) => {
        const details = social?.[network];
        if (
          !details ||
          typeof details.username !== "string" ||
          !details.username.trim()
        ) {
          throw new Error(`Site settings must contain a ${network} username and URL.`);
        }

        const socialUrl = new URL(details.url);
        if (socialUrl.protocol !== "https:") {
          throw new Error(`The ${network} URL must use HTTPS.`);
        }

        document.querySelectorAll(`[data-social-url="${network}"]`).forEach((link) => {
          link.href = socialUrl.href;
        });
        document.querySelectorAll(`[data-social-username="${network}"]`).forEach((label) => {
          label.textContent = details.username;
        });
      });
      document.querySelectorAll("[data-site-setting]").forEach((element) => {
        const value = element.dataset.siteSetting
          .split(".")
          .reduce((current, key) => current?.[key], settings);
        if (typeof value !== "string") {
          throw new Error(`Missing text setting: ${element.dataset.siteSetting}`);
        }
        element.textContent = value;
      });
      settings.github.repositoriesApiUrl = repositoriesApiUrl.href;
      document.documentElement.classList.remove("site-settings-loading");
      return settings;
    } catch (error) {
      document.documentElement.classList.remove("site-settings-loading");
      console.error("Could not load website settings:", error);
      throw error;
    }
  }

  window.siteSettingsReady = loadSiteSettings();
})();
