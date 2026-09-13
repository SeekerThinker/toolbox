(() => {
  "use strict";

  const clean = value => String(value || "").replace(/\s+/g, " ").trim();
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("capture");
  if (!mode) return;

  const input = document.querySelector("#taskInput");
  if (!input) return;

  if (mode === "share") {
    const values = [params.get("title"), params.get("text"), params.get("url")]
      .map(clean)
      .filter(Boolean);
    const unique = values.filter((value, index) =>
      !values.some((other, otherIndex) => otherIndex < index && (other.includes(value) || value.includes(other)))
    );
    const shared = unique.join(" — ").slice(0, 3000);
    if (shared) {
      input.value = shared;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (window.Toolbox && typeof Toolbox.toast === "function") Toolbox.toast("已带入分享内容，确认后添加");
    }
  }

  input.focus({ preventScroll: true });
  input.scrollIntoView({ behavior: "smooth", block: "center" });

  const current = new URL(window.location.href);
  for (const key of ["capture", "title", "text", "url"]) current.searchParams.delete(key);
  window.history.replaceState(null, "", current.pathname + current.search + current.hash);
})();
