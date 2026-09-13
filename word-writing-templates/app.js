(() => {
  "use strict";

  const PROJECT = "https://github.com/SeekerThinker/word-writing-templates";
  const PREVIEW = "https://raw.githubusercontent.com/SeekerThinker/word-writing-templates/main/docs/assets/previews";
  const RAW = "https://github.com/SeekerThinker/word-writing-templates/raw/refs/heads/main/templates";
  const PACKAGE = {
    windows: `${PROJECT}/releases/latest/download/Word-Writing-Templates-Windows.zip`,
    macos: `${PROJECT}/releases/latest/download/Word-Writing-Templates-macOS.zip`
  };

  const DATA = {
    book: {
      label: "书籍",
      intro: "多章长文、教材、专著、教程、电子书",
      options: [
        { id:"book-cn-traditional", name:"中文传统", file:"书籍-中文传统.dotx", folder:"books", example:"第一章 → 第一节 → 一、 → （一）", desc:"适合中文专著、教材和传统长篇作品。", recommended:true },
        { id:"book-chapter-decimal", name:"章节数字", file:"书籍-章节数字.dotx", folder:"books", example:"第1章 → 1.1 → 1.1.1 → 1.1.1.1", desc:"适合技术书、教程和研究专著。" },
        { id:"book-pure-decimal", name:"纯数字", file:"书籍-纯数字.dotx", folder:"books", example:"1 → 1.1 → 1.1.1 → 1.1.1.1", desc:"适合现代简洁型长文和电子书。" }
      ]
    },
    article: {
      label: "文章",
      intro: "论文、报告、长文章、研究与正式文稿",
      options: [
        { id:"article-cn-academic", name:"中文论文", file:"文章-中文论文.dotx", folder:"articles", example:"一、 → （一） → 1. → （1）", desc:"适合中文论文、报告和正式文章。", recommended:true },
        { id:"article-decimal", name:"数字层级", file:"文章-数字层级.dotx", folder:"articles", example:"1 → 1.1 → 1.1.1 → 1.1.1.1", desc:"适合学术、研究和技术文章。" },
        { id:"article-cn-compact", name:"中文简洁", file:"文章-中文简洁.dotx", folder:"articles", example:"一、 → 1. → （1） → ①", desc:"适合长文章、随笔和内容写作。" }
      ]
    }
  };

  const root = document.querySelector("#app");
  const state = { type:null, scheme:null, os:null };

  root.innerHTML = `
    <div class="shell">
      <header class="topbar">
        <a class="brand" href="../"><span class="brand-mark">W</span><span><strong>Word 写作模板</strong><small>选择向导</small></span></a>
        <nav class="top-links"><a href="${PROJECT}" target="_blank" rel="noreferrer">开源项目 ↗</a><a href="../">返回 Toolbox</a></nav>
      </header>

      <section class="hero">
        <p class="eyebrow">不用懂 Word 排版，也不用懂 GitHub</p>
        <h1>回答 3 个问题，直接拿到适合你的模板</h1>
        <p class="hero-copy">选择写作类型、章节编号和电脑系统。默认先给你最简单的“直接开始版”；想要更接近成稿的页码、页眉、作者信息、目录或参考文献时，再选“带常用结构版”。</p>
        <div class="hero-badges"><span>✓ Windows / macOS</span><span>✓ 双击即用</span><span>✓ 自动编号</span><span>✓ 无需宏</span></div>
      </section>

      <section class="wizard" aria-label="模板选择向导">
        <div class="step" id="stepType">
          <div class="step-head"><span class="step-no">1</span><div><h2>你准备写什么？</h2><p>只需要选最接近你的用途。</p></div></div>
          <div class="choice-grid two" id="typeChoices">
            <button class="choice-card" type="button" data-type="book" aria-pressed="false"><span class="choice-icon">📚</span><strong>写书</strong><span>${DATA.book.intro}</span></button>
            <button class="choice-card" type="button" data-type="article" aria-pressed="false"><span class="choice-icon">📄</span><strong>写文章</strong><span>${DATA.article.intro}</span></button>
          </div>
        </div>

        <div class="step is-locked" id="stepScheme" aria-disabled="true">
          <div class="step-head"><span class="step-no">2</span><div><h2>你喜欢哪种章节编号？</h2><p>直接看效果选，不需要知道“多级列表”是什么。</p></div></div>
          <div class="scheme-grid" id="schemeChoices"><div class="placeholder">先完成第 1 步，这里会显示 3 种常用方案。</div></div>
        </div>

        <div class="step is-locked" id="stepOs" aria-disabled="true">
          <div class="step-head"><span class="step-no">3</span><div><h2>你在哪台电脑上使用 Word？</h2><p id="osHint">我们会给你匹配字体和快捷键。</p></div></div>
          <div class="choice-grid two" id="osChoices">
            <button class="choice-card" type="button" data-os="windows" aria-pressed="false"><span class="choice-icon">⊞</span><strong>Windows</strong><span>快捷键使用 Ctrl + Alt</span></button>
            <button class="choice-card" type="button" data-os="macos" aria-pressed="false"><span class="choice-icon">⌘</span><strong>MacBook / macOS</strong><span>快捷键使用 Command + Option</span></button>
          </div>
        </div>

        <section class="result" id="result" hidden aria-live="polite">
          <div class="result-copy">
            <p class="eyebrow">已经选好了</p><h2 id="resultTitle"></h2><p id="resultExample" class="number-example"></p><p id="resultDesc"></p>
            <div class="result-actions"><a id="singleDownload" class="btn primary" href="#">下载直接开始版</a><a id="structuredDownload" class="btn secondary" href="#">下载带常用结构版</a><a id="packageDownload" class="btn secondary" href="#">下载本系统全部模板</a></div>
            <p class="help-text">不确定就选第一个“直接开始版”：打开后只有标题、一级标题和正文。结构版是在同一编号体系上额外预置可删除的成稿骨架。</p>
            <button id="restartBtn" class="text-btn" type="button">重新选择</button>
          </div>
          <div class="result-preview"><img id="resultImage" alt="所选 Word 模板的排版预览"></div>
        </section>
      </section>

      <section class="faq"><h2>第一次用 Word 模板？</h2>
        <details><summary>下载后怎么开始？</summary><p>双击下载的 <code>.dotx</code> 文件。Word 会自动创建一份新的文档，你只需要把占位文字换成自己的内容。</p></details>
        <details><summary>“直接开始版”和“带常用结构版”有什么区别？</summary><p>直接开始版只有标题、一级标题和正文，最适合马上开写。书籍结构版会预置独立书名页、前言、自动目录、罗马数字前置页码、从 1 重新开始的正文页码、自动书名页眉、附录和参考文献；文章结构版会预置作者、单位、日期、摘要、关键词、页码和参考文献。不需要的区块都可以直接删除。</p></details>
        <details><summary>我不会快捷键，可以用吗？</summary><p>可以。快捷键只是加速功能；你也可以直接使用 Word 顶部“样式”区域选择一级标题、二级标题和正文。</p></details>
        <details><summary>Windows 写到一半，可以拿到 MacBook 继续吗？</summary><p>可以。文档里的标题结构、编号和正文样式会保留。两个平台分别提供模板，主要是为了让初次创建文档时的字体和快捷键更自然。</p></details>
      </section>

      <footer class="footer"><span>Word 结构化写作模板集 · MIT License</span><a href="${PROJECT}/releases/latest" target="_blank" rel="noreferrer">全部下载 ↗</a></footer>
    </div>`;

  const $ = s => root.querySelector(s);
  const $$ = s => [...root.querySelectorAll(s)];
  const detected = (() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("windows")) return "windows";
    if (ua.includes("macintosh") || ua.includes("mac os x")) return "macos";
    return null;
  })();

  if (detected) {
    const label = detected === "windows" ? "Windows" : "MacBook / macOS";
    $("#osHint").textContent = `看起来你正在使用 ${label}。第 3 步已帮你标出推荐项，你仍然可以选另一台电脑。`;
    const btn = $(`[data-os="${detected}"]`);
    if (btn) btn.querySelector("strong").insertAdjacentHTML("afterend", '<span class="recommend" style="position:static;display:inline-block;margin:3px 0 6px">本机推荐</span>');
  }

  function optionById(id) {
    return Object.values(DATA).flatMap(x => x.options).find(x => x.id === id) || null;
  }

  function renderSchemes() {
    const step = $("#stepScheme");
    if (!state.type) return;
    step.classList.remove("is-locked");
    step.setAttribute("aria-disabled","false");
    $("#schemeChoices").innerHTML = DATA[state.type].options.map(o => `
      <button class="scheme-card${state.scheme === o.id ? " selected" : ""}" type="button" data-scheme="${o.id}" aria-pressed="${state.scheme === o.id}">
        ${o.recommended ? '<span class="recommend">常用推荐</span>' : ""}
        <img src="${PREVIEW}/${o.id}.png" alt="${DATA[state.type].label}${o.name}编号预览" loading="lazy">
        <span class="scheme-copy"><strong>${o.name}</strong><code>${o.example}</code><p>${o.desc}</p></span>
      </button>`).join("");
    $$('[data-scheme]').forEach(btn => btn.addEventListener("click", () => chooseScheme(btn.dataset.scheme)));
  }

  function updateSelection(selector, key, value) {
    $$(selector).forEach(btn => {
      const selected = btn.dataset[key] === value;
      btn.classList.toggle("selected", selected);
      btn.setAttribute("aria-pressed", String(selected));
    });
  }

  function chooseType(type, scroll=true) {
    if (!DATA[type]) return;
    state.type = type; state.scheme = null; state.os = null;
    updateSelection("[data-type]", "type", type);
    updateSelection("[data-os]", "os", null);
    $("#stepOs").classList.add("is-locked");
    $("#stepOs").setAttribute("aria-disabled","true");
    $("#result").hidden = true;
    renderSchemes();
    syncUrl();
    if (scroll) $("#stepScheme").scrollIntoView({behavior:"smooth",block:"center"});
  }

  function chooseScheme(id, scroll=true) {
    const opt = optionById(id);
    if (!opt || !state.type || !DATA[state.type].options.some(x => x.id === id)) return;
    state.scheme = id; state.os = null;
    updateSelection("[data-scheme]", "scheme", id);
    updateSelection("[data-os]", "os", null);
    const step = $("#stepOs");
    step.classList.remove("is-locked");
    step.setAttribute("aria-disabled","false");
    $("#result").hidden = true;
    syncUrl();
    if (scroll) step.scrollIntoView({behavior:"smooth",block:"center"});
  }

  function chooseOs(os, scroll=true) {
    if (!state.scheme || !["windows","macos"].includes(os)) return;
    state.os = os;
    updateSelection("[data-os]", "os", os);
    renderResult();
    syncUrl();
    if (scroll) $("#result").scrollIntoView({behavior:"smooth",block:"center"});
  }

  function renderResult() {
    const opt = optionById(state.scheme);
    if (!opt || !state.os) return;
    const osLabel = state.os === "windows" ? "Windows" : "macOS";
    const typeLabel = state.type === "book" ? "书籍" : "文章";
    const structuredFile = opt.file.replace(/\.dotx$/, "-常用结构.dotx");
    $("#resultTitle").textContent = `${typeLabel}｜${opt.name}｜${osLabel}`;
    $("#resultExample").textContent = opt.example;
    $("#resultDesc").textContent = opt.desc;
    $("#resultImage").src = `${PREVIEW}/${opt.id}.png`;
    $("#singleDownload").href = `${RAW}/${state.os}/${opt.folder}/${encodeURIComponent(opt.file)}`;
    $("#singleDownload").textContent = `下载 ${osLabel} 直接开始版`;
    $("#structuredDownload").href = `${RAW}/${state.os}/structured/${opt.folder}/${encodeURIComponent(structuredFile)}`;
    $("#structuredDownload").textContent = `下载 ${osLabel} 带常用结构版`;
    $("#packageDownload").href = PACKAGE[state.os];
    $("#packageDownload").textContent = `下载 ${osLabel} 全部模板`;
    $("#result").hidden = false;
  }

  function syncUrl() {
    const params = new URLSearchParams();
    if (state.type) params.set("type", state.type);
    if (state.scheme) params.set("scheme", state.scheme);
    if (state.os) params.set("os", state.os);
    const q = params.toString();
    history.replaceState(null,"",`${location.pathname}${q ? `?${q}` : ""}`);
  }

  function restart() {
    state.type = state.scheme = state.os = null;
    updateSelection("[data-type]","type",null);
    updateSelection("[data-os]","os",null);
    $("#schemeChoices").innerHTML = '<div class="placeholder">先完成第 1 步，这里会显示 3 种常用方案。</div>';
    $("#stepScheme").classList.add("is-locked");
    $("#stepOs").classList.add("is-locked");
    $("#result").hidden = true;
    syncUrl();
    $("#stepType").scrollIntoView({behavior:"smooth",block:"center"});
  }

  $$('[data-type]').forEach(btn => btn.addEventListener("click", () => chooseType(btn.dataset.type)));
  $$('[data-os]').forEach(btn => btn.addEventListener("click", () => chooseOs(btn.dataset.os)));
  $("#restartBtn").addEventListener("click", restart);

  const params = new URLSearchParams(location.search);
  const initialType = params.get("type");
  const initialScheme = params.get("scheme");
  const initialOs = params.get("os");
  if (DATA[initialType]) {
    chooseType(initialType, false);
    if (DATA[initialType].options.some(x => x.id === initialScheme)) {
      chooseScheme(initialScheme, false);
      if (["windows","macos"].includes(initialOs)) chooseOs(initialOs, false);
    }
  }
})();
