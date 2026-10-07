(() => {
  "use strict";

  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".navigation");
  const menuBackdrop = document.querySelector(".menu-backdrop");

  function closeMenu() {
    if (!menuToggle || !navigation || !menuBackdrop) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "باز کردن منو");
    navigation.classList.remove("is-open");
    menuBackdrop.classList.remove("is-visible");
    document.body.classList.remove("menu-open");
  }

  if (!menuToggle || !navigation || !menuBackdrop) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "باز کردن منو" : "بستن منو");
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
