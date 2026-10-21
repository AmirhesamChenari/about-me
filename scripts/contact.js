(() => {
  "use strict";

  const copyButton = document.querySelector("[data-copy-email]");
  const copyFeedback = document.querySelector(".copy-feedback");
  const copyLabel = copyButton?.querySelector("[data-copy-label]");

  if (!copyButton || !copyFeedback || !copyLabel) return;

  let feedbackTimeout;

  function setCopyFeedback(message, copied) {
    copyFeedback.textContent = message;
    copyButton.classList.toggle("is-copied", copied);
    copyLabel.textContent = copied ? "نشانی کپی شد" : "کپی نشانی ایمیل";
    window.clearTimeout(feedbackTimeout);
    if (copied) {
      feedbackTimeout = window.setTimeout(() => {
        copyFeedback.textContent = "";
        copyButton.classList.remove("is-copied");
        copyLabel.textContent = "کپی نشانی ایمیل";
      }, 2500);
    }
  }

  async function copyWithFallback(email) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(email);
        return;
      } catch (error) {
        console.warn("Clipboard API failed; trying the selection fallback:", error);
      }
    }

    const input = document.createElement("textarea");
    input.value = email;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) {
      throw new Error("The browser did not allow copying to the clipboard.");
    }
  }

  copyButton.addEventListener("click", async () => {
    const email = copyButton.getAttribute("data-copy-email");
    if (!email) {
      setCopyFeedback("نشانی ایمیل در تنظیمات ثبت نشده است.", false);
      return;
    }

    try {
      await copyWithFallback(email);
      setCopyFeedback("نشانی ایمیل کپی شد.", true);
    } catch (error) {
      setCopyFeedback("کپی نشانی ایمیل انجام نشد.", false);
      console.error("Could not copy email address:", error);
    }
  });
})();
