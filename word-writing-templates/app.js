(() => {
  "use strict";

  const PROJECT = "https://github.com/SeekerThinker/word-writing-templates";
  const PREVIEW = "https://raw.githubusercontent.com/SeekerThinker/word-writing-templates/main/docs/assets/previews";
  const RAW = "https://raw.githubusercontent.com/SeekerThinker/word-writing-templates/main/templates";
  const PACKAGE = {
    windows: `${PROJECT}/releases/latest/download/Word-Writing-Templates-Windows.zip`,
    macos: `${PROJECT}/releases/latest/download/Word-Writing-Templates-macOS.zip`
  };

  const DATA = {
    book: {
      label: "书籍",
      options: [
        { id: "book-cn-traditional", name: "中文传统", file: "书籍-中文传统.dotx", folder: "books", preview: "book-cn-traditional.png", example: "第一章 → 第一节 → 一、 → （一）", desc: "适合中文专著、教材和传统长篇作品。", recommended: true },
        { id: "book-chapter-decimal", name: "章节数字", file: "书籍-章节数字.dotx", folder: "books", preview: "book-chapter-decimal.png", example: "第1章 → 1.1 → 1.1.1 → 1.1.1.1", desc: "适合技术书、教程和研究专著。" },
        { id: "book-pure-decimal", name: "纯数字", file: "书籍-纯数字.dotx", folder: "books", preview: "book-pure-decimal.png", example: "1 → 1.1 → 1.1.1 → 1.1.1.1", desc: "适合现代简洁型长文和电子书。" }
      ]
    },
    article: {
      label: "文章",
      options: [
        { id: "article-cn-academic", name: "中文论文", file: "文章-中文论文.dotx", folder: "articles", preview: "article-cn-academic.png", example: "一、 → （一） → 1. → （1）", desc: "适合中文论文、报告和正式文章。", recommended: true },
        { id: "article-decimal", name: "数字层级", file: "文章-数字层级.dotx", folder: "articles", preview: "article-decimal.png", example: "1 → 1.1 → 1.1.1 → 1.1.1.1", desc: "适合学术、研究和技术文章。" },
        { id: "article-cn-compact", name: "中文简洁", file: "文章-中文简洁.dotx", folder: "articles", preview: "article-cn-compact.png", example: "一、 → 1. → （1） → ①", desc: "适合长文章、随笔和内容写作。" }
      ]
    }
  };

  const state = { type: null, scheme: null, os: null };
  const el = {
    typeChoices: document.querySelector("#typeChoices"),
    schemeChoices: document.querySelector("#schemeChoices"),
    osChoices: document.querySelector("#osChoices"),
    stepScheme: document.querySelector("#stepScheme"),
    stepOs: document.querySelector("#stepOs"),
    osHint: document.querySelector("#osHint"),
    result: document.querySelector("#result"),
    resultTitle: document.querySelector("#resultTitle"),
    resultExample: document.querySelector("#resultExample"),
    resultDesc: document.querySelector("#resultDesc"),
    resultImage: document.querySelector("#resultImage"),
    templateDownload: document.querySelector("#templateDownload"),
    packageDownload: document.querySelector("#packageDownload"),
    resetBtn: document.querySelector("#resetBtn"),
    quickPackage: document.querySelector("#quickPackage")
  };

  const allOptions = () => Object.values(DATA).flatMap((group) => group.options);
  const optionById = (id) => allOptions().find((item) => item.id === id);
  const typeForScheme = (id) => Object.entries(DATA).find(([, group]) => group.options.some((item) => item.id === id))?.[0] || null;

  function detectedOs() {
    const source = `${navigator.platform || ""} ${navigator.userAgent || ""}`;
    if (/Mac|iPhone|iPad/i.test(source)) return "macos";
    if (/Win/i.test(source)) return "windows";
    return null;
  }

  function setPressed(container, attr, value) {
    container.querySelectorAll(`[${attr}]`).forEach((button) => {
      const selected = button.getAttribute(attr) === value;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function lock(step, locked) {
    step.classList.toggle("locked", locked);
    step.setAttribute("aria-disabled", locked ? "true" : "false");
  }

  function renderSchemes() {
    const group = DATA[state.type];
    if (!group) return;
    el.schemeChoices.innerHTML = group.options.map((item) => `
      <button class="scheme" type="button" data-scheme="${item.id}" aria-pressed="false">
        ${item.recommended ? '<span class="recommend">推荐</span>' : ""}
        <img src="${PREVIEW}/${item.preview}" alt="${group.label} ${item.name}编号预览" loading="lazy" />
        <span class="scheme-copy"><strong>${item.name}</strong><code>${item.example}</code><small>${item.desc}</small></span>
      </button>`).join("");
    lock(el.stepScheme, false);
    setPressed(el.schemeChoices, "data-scheme", state.scheme);
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    ["type", "scheme", "os"].forEach((key) => state[key] ? url.searchParams.set(key, state[key]) : url.searchParams.delete(key));
    url.searchParams.delete("variant");
    url.searchParams.delete("starter");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function renderResult() {
    if (!state.type || !state.scheme || !state.os) {
      el.result.hidden = true;
      updateUrl();
      return;
    }
    const item = optionById(state.scheme);
    const group = DATA[state.type];
    const platform = state.os === "windows" ? "Windows" : "macOS";
    const direct = `${RAW}/${state.os}/${item.folder}/${encodeURIComponent(item.file)}`;

    el.resultTitle.textContent = `${group.label}｜${item.name}｜${platform}`;
    el.resultExample.textContent = item.example;
    el.resultDesc.textContent = item.desc;
    el.resultImage.src = `${PREVIEW}/${item.preview}`;
    el.templateDownload.href = direct;
    el.templateDownload.setAttribute("download", item.file);
    el.packageDownload.href = PACKAGE[state.os];
    el.packageDownload.textContent = `下载 ${platform} 整包`;
    el.result.hidden = false;
    updateUrl();
  }

  function reset() {
    state.type = null;
    state.scheme = null;
    state.os = null;
    el.schemeChoices.innerHTML = '<div class="placeholder">先选“写书”或“写文章”。</div>';
    lock(el.stepScheme, true);
    lock(el.stepOs, true);
    setPressed(el.typeChoices, "data-type", null);
    setPressed(el.osChoices, "data-os", null);
    el.result.hidden = true;
    updateUrl();
    document.querySelector("#chooser").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  el.typeChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    state.type = button.dataset.type;
    state.scheme = null;
    state.os = null;
    setPressed(el.typeChoices, "data-type", state.type);
    setPressed(el.osChoices, "data-os", null);
    lock(el.stepOs, true);
    el.result.hidden = true;
    renderSchemes();
    updateUrl();
  });

  el.schemeChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scheme]");
    if (!button) return;
    state.scheme = button.dataset.scheme;
    setPressed(el.schemeChoices, "data-scheme", state.scheme);
    lock(el.stepOs, false);
    renderResult();
  });

  el.osChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-os]");
    if (!button || el.stepOs.classList.contains("locked")) return;
    state.os = button.dataset.os;
    setPressed(el.osChoices, "data-os", state.os);
    renderResult();
    el.result.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  el.resetBtn.addEventListener("click", reset);

  const detected = detectedOs();
  if (detected) {
    const platform = detected === "macos" ? "macOS" : "Windows";
    el.osHint.textContent = `看起来你正在使用 ${platform}；如果 Word 在另一台电脑上，请按实际电脑选择。`;
    el.quickPackage.href = PACKAGE[detected];
    el.quickPackage.textContent = `下载 ${platform} 整包`;
  }

  const params = new URLSearchParams(window.location.search);
  const scheme = params.get("scheme");
  const inferredType = scheme ? typeForScheme(scheme) : null;
  const type = params.get("type") || inferredType;
  const os = params.get("os");

  if (type && DATA[type]) state.type = type;
  if (state.type && scheme && DATA[state.type].options.some((item) => item.id === scheme)) state.scheme = scheme;
  if (os === "windows" || os === "macos") state.os = os;

  if (state.type) {
    setPressed(el.typeChoices, "data-type", state.type);
    renderSchemes();
  }
  if (state.scheme) {
    setPressed(el.schemeChoices, "data-scheme", state.scheme);
    lock(el.stepOs, false);
  }
  if (state.os) setPressed(el.osChoices, "data-os", state.os);
  renderResult();
})();
