(() => {
  "use strict";

  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".navigation");
  const menuBackdrop = document.querySelector(".menu-backdrop");
  document.documentElement.classList.add("has-js");

  const deferredSections = document.querySelectorAll("[data-lazy-script]");
  function loadDeferredScript(section, observer) {
    if (section.dataset.scriptLoading === "true" || section.dataset.scriptLoaded === "true") return;
    section.dataset.scriptLoading = "true";
    const script = document.createElement("script");
    script.src = section.dataset.lazyScript;
    script.onload = () => {
      section.dataset.scriptLoaded = "true";
      delete section.dataset.scriptLoading;
      observer?.unobserve(section);
    };
    script.onerror = () => {
      console.error(`Could not load ${script.src}.`);
      delete section.dataset.scriptLoading;
      observer?.unobserve(section);
    };
    document.head.append(script);
  }

  if ("IntersectionObserver" in window) {
    const scriptObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) loadDeferredScript(entry.target, observer);
      });
    }, { rootMargin: "300px 0px" });
    deferredSections.forEach((section) => scriptObserver.observe(section));
  } else {
    deferredSections.forEach((section) => loadDeferredScript(section));
  }

  if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
    const particleScript = document.createElement("script");
    particleScript.src = "scripts/particles.js";
    particleScript.onerror = () => {
      console.error("Could not load particle animation.");
    };
    document.head.append(particleScript);
  }

  function closeMenu() {
    if (!menuToggle || !navigation || !menuBackdrop) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "گشودن منو");
    navigation.classList.remove("is-open");
    menuBackdrop.classList.remove("is-visible");
    document.body.classList.remove("menu-open");
  }

  if (!menuToggle || !navigation || !menuBackdrop) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "گشودن منو" : "بستن منو");
    navigation.classList.toggle("is-open", !isOpen);
    menuBackdrop.classList.toggle("is-visible", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  menuBackdrop.addEventListener("click", closeMenu);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
})();
