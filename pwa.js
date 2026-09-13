(() => {
  "use strict";

  let installPrompt = null;
  const topActions = document.querySelector(".top-actions");
  let installButton = null;

  const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

  const ensureInstallButton = () => {
    if (!topActions || installButton || isStandalone()) return installButton;
    installButton = document.createElement("button");
    installButton.id = "installAppBtn";
    installButton.className = "ghost-btn";
    installButton.type = "button";
    installButton.textContent = "安装";
    installButton.hidden = true;
    topActions.prepend(installButton);
    installButton.addEventListener("click", async () => {
      if (!installPrompt) return;
      installButton.disabled = true;
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } finally {
        installPrompt = null;
        installButton.hidden = true;
        installButton.disabled = false;
      }
    });
    return installButton;
  };

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    const button = ensureInstallButton();
    if (button) button.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    if (installButton) installButton.hidden = true;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(error => {
        console.warn("Toolbox service worker registration failed", error);
      });
    });
  }

  ensureInstallButton();
})();
