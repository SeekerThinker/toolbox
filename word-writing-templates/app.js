(() => {
  "use strict";

  const PROJECT = "https://github.com/SeekerThinker/word-writing-templates";
  const PREVIEW = "https://raw.githubusercontent.com/SeekerThinker/word-writing-templates/main/docs/assets/previews";
  const RAW = `${PROJECT}/raw/refs/heads/main/templates`;
  const PACKAGE = {
    windows: `${PROJECT}/releases/latest/download/Word-Writing-Templates-Windows.zip`,
    macos: `${PROJECT}/releases/latest/download/Word-Writing-Templates-macOS.zip`
  };

  const DATA = {
    book: {
      label: "书籍",
      intro: "专著、教材、教程、长篇作品",
      options: [
        { id: "book-cn-traditional", name: "中文传统", file: "书籍-中文传统.dotx", folder: "books", preview: "book-cn-traditional.png", example: "第一章 → 第一节 → 一、 → （一）", desc: "适合中文专著、教材和传统长篇作品。", recommended: true },
        { id: "book-chapter-decimal", name: "章节数字", file: "书籍-章节数字.dotx", folder: "books", preview: "book-chapter-decimal.png", example: "第1章 → 1.1 → 1.1.1 → 1.1.1.1", desc: "适合技术书、教程和研究专著。" },
        { id: "book-pure-decimal", name: "纯数字", file: "书籍-纯数字.dotx", folder: "books", preview: "book-pure-decimal.png", example: "1 → 1.1 → 1.1.1 → 1.1.1.1", desc: "适合现代简洁型长文和电子书。" }
      ]
    },
    article: {
      label: "文章",
      intro: "论文、报告、研究与正式文章",
      options: [
        { id: "article-cn-academic", name: "中文论文", file: "文章-中文论文.dotx", folder: "articles", preview: "article-cn-academic.png", example: "一、 → （一） → 1. → （1）", desc: "适合中文论文、报告和正式文章。", recommended: true },
        { id: "article-decimal", name: "数字层级", file: "文章-数字层级.dotx", folder: "articles", preview: "article-decimal.png", example: "1 → 1.1 → 1.1.1 → 1.1.1.1", desc: "适合学术、研究和技术文章。" },
        { id: "article-cn-compact", name: "中文简洁", file: "文章-中文简洁.dotx", folder: "articles", preview: "article-cn-compact.png", example: "一、 → 1. → （1） → ①", desc: "适合长文章、随笔和内容写作。" }
      ]
    }
  };

  const root = document.querySelector("#app");
  const state = { type: null, scheme: null, os: null };

  root.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="../" aria-label="返回 Toolbox"><span class="brand-mark">W</span><span><strong>Word 结构化写作</strong><small>模板选择向导</small></span></a>
        <nav class="top-links"><a href="${PROJECT}" target="_blank" rel="noreferrer">独立项目 ↗</a><a href="../">返回 Toolbox</a></nav>
      </header>

      <section class="hero">
        <p class="eyebrow">思考 → 结构 → 写作 → 排版</p>
        <h1>让思路有层级，让结构可调整，让想法直接长成文章</h1>
        <p class="hero-copy">标题层级把思考结构显出来；Word 导航窗格让你随时检查、重组全文。模板同时准备好作者、摘要、目录、页码、参考文献等成稿结构，但你开始时完全可以先不管它们。</p>
        <p class="hero-note"><strong>v4 只有一套模板。</strong> 不再区分“直接开始版 / 带常用结构版”。暂时不用的区块可以保留，需要时填写，不需要时删除。</p>
        <div class="hero-badges"><span>✓ Windows / macOS</span><span>✓ 双击即用</span><span>✓ 导航窗格思考树</span><span>✓ 无宏</span></div>
      </section>

      <section class="wizard" aria-label="模板选择向导">
        <div class="step" id="stepType">
          <div class="step-head"><span class="step-no">1</span><div><h2>你准备写什么？</h2><p>只选最接近的用途。</p></div></div>
          <div class="choice-grid two" id="typeChoices">
            <button class="choice-card" type="button" data-type="book" aria-pressed="false"><span class="choice-icon">📚</span><strong>写书</strong><span>${DATA.book.intro}</span></button>
            <button class="choice-card" type="button" data-type="article" aria-pressed="false"><span class="choice-icon">📄</span><strong>写文章</strong><span>${DATA.article.intro}</span></button>
          </div>
        </div>

        <div class="step is-locked" id="stepScheme" aria-disabled="true">
          <div class="step-head"><span class="step-no">2</span><div><h2>你喜欢哪种章节编号？</h2><p>直接看效果选，不需要理解 Word 多级列表。</p></div></div>
          <div class="scheme-grid" id="schemeChoices"><div class="placeholder">先完成第 1 步，这里会显示 3 种常用方案。</div></div>
        </div>

        <div class="step is-locked" id="stepOs" aria-disabled="true">
          <div class="step-head"><span class="step-no">3</span><div><h2>你在哪台电脑上使用 Word？</h2><p id="osHint">我们会给你匹配字体和快捷键。</p></div></div>
          <div class="choice-grid two" id="osChoices">
            <button class="choice-card" type="button" data-os="windows" aria-pressed="false"><span class="choice-icon">🪟</span><strong>Windows</strong><span>宋体 / 黑体等常见 Windows 中文字体</span></button>
            <button class="choice-card" type="button" data-os="macos" aria-pressed="false"><span class="choice-icon">⌘</span><strong>macOS / MacBook</strong><span>Songti SC / PingFang SC 等系统字体</span></button>
          </div>
        </div>

        <section class="result" id="result" hidden aria-live="polite">
          <div class="result-copy">
            <p class="eyebrow">你的模板</p>
            <h2 id="resultTitle"></h2>
            <p class="number-example" id="resultExample"></p>
            <p id="resultDesc"></p>
            <p><strong>先写正文即可：</strong>需要拆分时用“标题 2 / 3 / 4”；写一会儿后打开导航窗格，只看标题检查并列、缺口、重复和顺序。</p>
            <p><strong>成稿结构已经在同一份文件里：</strong>暂时不用的作者、前言、摘要、目录、附录或参考文献可以先留着，也可以删除。</p>
            <div class="result-actions">
              <a class="btn primary" id="templateDownload" href="#">下载这个 .dotx 模板</a>
              <a class="btn secondary" id="packageDownload" href="#">下载整包</a>
              <a class="btn secondary" href="${PROJECT}/releases/latest" target="_blank" rel="noreferrer">查看最新版 ↗</a>
            </div>
            <p class="help-text">下载后双击 `.dotx`，Word 会基于模板创建新文档，不会修改原模板。没有宏，也不需要安装插件。</p>
            <button class="text-btn" id="resetBtn" type="button">重新选择</button>
          </div>
          <div class="result-preview"><img id="resultImage" alt="所选编号方案预览" /></div>
        </section>
      </section>

      <section class="faq">
        <h2>为什么这套模板能辅助思考？</h2>
        <details open><summary>标题层级不只是排版</summary><p>把内容变成标题 1、标题 2、标题 3，本质上是在不断给想法分组、命名、排序，并判断它们之间的从属和并列关系。结构不清楚时，问题会更容易暴露出来。</p></details>
        <details><summary>导航窗格有什么用？</summary><p>当文档变长后，导航窗格会把标题层级持续显示成一棵结构树。你可以只看标题检查整体逻辑；在支持拖动重排的 Word 桌面版本中，还可以直接调整文档部分的位置。</p></details>
        <details><summary>为什么保留前言、摘要、目录这些区块？</summary><p>因为思考结构和最终文稿最好留在同一份文件里。它们暂时不用并不会妨碍写正文，而且这些辅助区块使用非大纲样式，不会把导航窗格里的核心标题树弄乱。</p></details>
        <details><summary>我需要先学会页码、目录和参考文献吗？</summary><p>不需要。最开始只认识“标题 1 / 标题 2”和正文就够了。页码、题注、脚注、参考文献等功能是为了以后减少排版摩擦，不是开始思考和写作的前置条件。</p></details>
      </section>

      <section class="feedback-panel">
        <div class="feedback-copy"><h2>在真实 Word 里用过？</h2><p>真实使用反馈能帮助项目确认不同 Word 版本的体验。完全可选，不需要上传你的写作内容。</p></div>
        <div class="feedback-actions">
          <a class="btn secondary" href="${PROJECT}/issues/new?template=word_quick_success.yml" target="_blank" rel="noreferrer">几十秒：使用正常 ↗</a>
          <a class="btn secondary" href="${PROJECT}/issues/new?template=word_compatibility_report.yml" target="_blank" rel="noreferrer">3～5 分钟：完整验证 ↗</a>
          <a class="feedback-record" href="${PROJECT}/blob/main/docs/兼容性验证记录.md" target="_blank" rel="noreferrer">查看公开兼容性记录 ↗</a>
        </div>
      </section>

      <footer class="footer"><span>Toolbox 只负责选择与索引；模板源码、Release 和反馈留在独立项目。</span><span><a href="${PROJECT}" target="_blank" rel="noreferrer">GitHub 项目 ↗</a></span></footer>
    </div>`;

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
    resetBtn: document.querySelector("#resetBtn")
  };

  const optionById = (id) => Object.values(DATA).flatMap((group) => group.options).find((item) => item.id === id);
  const groupForScheme = (id) => Object.entries(DATA).find(([, group]) => group.options.some((item) => item.id === id))?.[0] || null;

  function setPressed(container, attr, value) {
    container.querySelectorAll(`[${attr}]`).forEach((button) => {
      const selected = button.getAttribute(attr) === value;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function unlock(step) {
    step.classList.remove("is-locked");
    step.setAttribute("aria-disabled", "false");
  }

  function renderSchemes() {
    const group = DATA[state.type];
    if (!group) return;
    el.schemeChoices.innerHTML = group.options.map((item) => `
      <button class="scheme-card" type="button" data-scheme="${item.id}" aria-pressed="false">
        ${item.recommended ? '<span class="recommend">推荐</span>' : ""}
        <img src="${PREVIEW}/${item.preview}" alt="${group.label} ${item.name}编号预览" loading="lazy" />
        <span class="scheme-copy"><strong>${item.name}</strong><code>${item.example}</code><p>${item.desc}</p></span>
      </button>`).join("");
    unlock(el.stepScheme);
    setPressed(el.schemeChoices, "data-scheme", state.scheme);
  }

  function renderResult() {
    if (!state.type || !state.scheme || !state.os) {
      el.result.hidden = true;
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
    el.packageDownload.href = PACKAGE[state.os];
    el.packageDownload.textContent = `下载 ${platform} 整包`;
    el.result.hidden = false;
    updateUrl();
  }

  function updateUrl() {
    const url = new URL(window.location.href);
    ["type", "scheme", "os"].forEach((key) => state[key] ? url.searchParams.set(key, state[key]) : url.searchParams.delete(key));
    url.searchParams.delete("variant");
    url.searchParams.delete("starter");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function applyState() {
    setPressed(el.typeChoices, "data-type", state.type);
    if (state.type) renderSchemes();
    if (state.scheme) {
      setPressed(el.schemeChoices, "data-scheme", state.scheme);
      unlock(el.stepOs);
    }
    setPressed(el.osChoices, "data-os", state.os);
    renderResult();
  }

  el.typeChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;
    state.type = button.dataset.type;
    state.scheme = null;
    state.os = null;
    el.result.hidden = true;
    el.stepOs.classList.add("is-locked");
    el.stepOs.setAttribute("aria-disabled", "true");
    setPressed(el.osChoices, "data-os", null);
    renderSchemes();
    setPressed(el.typeChoices, "data-type", state.type);
    updateUrl();
  });

  el.schemeChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-scheme]");
    if (!button) return;
    state.scheme = button.dataset.scheme;
    setPressed(el.schemeChoices, "data-scheme", state.scheme);
    unlock(el.stepOs);
    updateUrl();
    renderResult();
  });

  el.osChoices.addEventListener("click", (event) => {
    const button = event.target.closest("[data-os]");
    if (!button || el.stepOs.classList.contains("is-locked")) return;
    state.os = button.dataset.os;
    setPressed(el.osChoices, "data-os", state.os);
    renderResult();
    el.result.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  el.resetBtn.addEventListener("click", () => {
    state.type = null;
    state.scheme = null;
    state.os = null;
    el.schemeChoices.innerHTML = '<div class="placeholder">先完成第 1 步，这里会显示 3 种常用方案。</div>';
    el.stepScheme.classList.add("is-locked");
    el.stepScheme.setAttribute("aria-disabled", "true");
    el.stepOs.classList.add("is-locked");
    el.stepOs.setAttribute("aria-disabled", "true");
    setPressed(el.typeChoices, "data-type", null);
    setPressed(el.osChoices, "data-os", null);
    el.result.hidden = true;
    updateUrl();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const detected = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent) ? "macos" : /Win/i.test(navigator.platform || navigator.userAgent) ? "windows" : null;
  if (detected) el.osHint.textContent = `看起来你正在使用 ${detected === "macos" ? "macOS" : "Windows"}；如果 Word 装在另一台电脑上，请按实际电脑选择。`;

  const params = new URLSearchParams(window.location.search);
  const scheme = params.get("scheme");
  const inferredType = scheme ? groupForScheme(scheme) : null;
  const type = params.get("type") || inferredType;
  const os = params.get("os");
  if (type && DATA[type]) state.type = type;
  if (state.type && scheme && DATA[state.type].options.some((item) => item.id === scheme)) state.scheme = scheme;
  if (os === "windows" || os === "macos") state.os = os;
  applyState();
})();
