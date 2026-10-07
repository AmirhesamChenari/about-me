(() => {
  "use strict";

  const yearLabel = document.querySelector("#year");
  if (yearLabel) {
    yearLabel.textContent = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
  }
})();
