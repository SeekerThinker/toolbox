(() => {
  "use strict";

  const SHARE_CACHE = "toolbox-share-inbox-v1";
  const clean = value => String(value || "").replace(/\s+/g, " ").trim();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("capture");
  if (!mode) return;

  const input = document.querySelector("#taskInput");
  if (!input) return;

  const consumeSharedDraft = async () => {
    if (mode !== "shared" || !("caches" in window)) return "";
    const inbox = await caches.open(SHARE_CACHE);
    const key = new URL("./__share_payload__", window.location.href).href;
    const response = await inbox.match(key);
    if (!response) return "";
    await inbox.delete(key);
    return clean(await response.text()).slice(0, 3000);
  };

  const finish = () => {
    input.focus({ preventScroll: true });
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    const current = new URL(window.location.href);
    for (const key of ["capture", "title", "text", "url"]) current.searchParams.delete(key);
    window.history.replaceState(null, "", current.pathname + current.search + current.hash);
  };

  (async () => {
    try {
      const shared = await consumeSharedDraft();
      if (shared) {
        input.value = shared;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        if (window.Toolbox && typeof Toolbox.toast === "function") Toolbox.toast("已带入分享内容，确认后添加");
      }
    } finally {
      finish();
    }
  })();
})();
