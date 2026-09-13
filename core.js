(() => {
  "use strict";

  const STORAGE_KEY = "toolbox:data:v1";
  const DATA_VERSION = 1;
  const CATEGORY_ORDER = ["文件", "图片", "文本", "计算", "日期时间", "数据", "写作", "开发", "隐私", "思维", "专注"];
  const tools = new Map();
  const scriptCache = new Map();

  const safeParse = (value, fallback) => {
    try { return value == null ? fallback : JSON.parse(value); }
    catch { return fallback; }
  };

  const defaultData = () => ({
    version: DATA_VERSION,
    preferences: { theme: null },
    favorites: [],
    recent: [],
    tools: {}
  });

  const getPath = (obj, path, fallback) => {
    const parts = String(path).split(".").filter(Boolean);
    let cur = obj;
    for (const part of parts) {
      if (cur == null || !Object.prototype.hasOwnProperty.call(cur, part)) return fallback;
      cur = cur[part];
    }
    return cur;
  };

  const setPath = (obj, path, value) => {
    const parts = String(path).split(".").filter(Boolean);
    let cur = obj;
    parts.slice(0, -1).forEach(part => {
      if (!cur[part] || typeof cur[part] !== "object" || Array.isArray(cur[part])) cur[part] = {};
      cur = cur[part];
    });
    cur[parts.at(-1)] = value;
  };

  const deletePath = (obj, path) => {
    const parts = String(path).split(".").filter(Boolean);
    let cur = obj;
    for (const part of parts.slice(0, -1)) {
      if (!cur?.[part] || typeof cur[part] !== "object") return;
      cur = cur[part];
    }
    if (cur) delete cur[parts.at(-1)];
  };

  const migrateLegacy = data => {
    let changed = false;
    const migrate = (legacyKey, targetPath, transform = v => v) => {
      const raw = localStorage.getItem(legacyKey);
      if (raw == null) return;
      const current = getPath(data, targetPath, undefined);
      const empty = current == null || (Array.isArray(current) && current.length === 0);
      if (!empty) return;
      const parsed = safeParse(raw, raw);
      setPath(data, targetPath, transform(parsed));
      changed = true;
    };

    migrate("deskkit:favorites", "favorites", v => Array.isArray(v) ? v : []);
    migrate("deskkit:recent", "recent", v => Array.isArray(v) ? v : []);
    migrate("deskkit:theme", "preferences.theme", v => typeof v === "string" ? v : null);
    migrate("deskkit:pomodoro:v1", "tools.pomodoro", v => v && typeof v === "object" ? v : {});
    migrate("deskkit:focuslog:v1", "tools.focuslog.sessions", v => Array.isArray(v) ? v : []);
    migrate("deskkit:eisenhower:v1", "tools.eisenhower", v => v && typeof v === "object" ? v : {});
    return changed;
  };

  let data = safeParse(localStorage.getItem(STORAGE_KEY), defaultData());
  if (!data || typeof data !== "object" || Array.isArray(data)) data = defaultData();
  data = { ...defaultData(), ...data, preferences: { ...defaultData().preferences, ...(data.preferences || {}) }, tools: data.tools || {} };
  data.version = DATA_VERSION;
  if (migrateLegacy(data) || !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const storage = {
    get(path, fallback = null) {
      const value = getPath(data, path, fallback);
      return value === undefined ? fallback : value;
    },
    set(path, value) {
      setPath(data, path, value);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return value;
    },
    remove(path) {
      deletePath(data, path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    snapshot() {
      return JSON.parse(JSON.stringify(data));
    },
    exportData() {
      return JSON.stringify(data, null, 2);
    },
    importData(text) {
      const incoming = typeof text === "string" ? JSON.parse(text) : text;
      if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) throw new Error("数据格式无效");
      const next = {
        ...defaultData(),
        ...incoming,
        version: DATA_VERSION,
        preferences: { ...defaultData().preferences, ...(incoming.preferences || {}) },
        tools: incoming.tools || {}
      };
      data = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return storage.snapshot();
    }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));

  let toastTimer;
  const toast = text => {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.remove(), 1500);
  };

  const copyText = async text => {
    const value = String(text ?? "");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
    } catch {
      const area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand?.("copy");
      area.remove();
      if (!ok) { toast("复制失败，请手动复制"); return false; }
    }
    toast("已复制");
    return true;
  };

  const download = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  };

  const formatBytes = bytes => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let index = 0;
    while (value >= 1024 && index < units.length - 1) { value /= 1024; index++; }
    return `${value.toFixed(index ? 1 : 0)} ${units[index]}`;
  };

  const loadScript = (src, test) => {
    if (test?.()) return Promise.resolve();
    if (scriptCache.has(src)) return scriptCache.get(src);
    const promise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error("外部组件加载失败"));
      document.head.appendChild(s);
    });
    scriptCache.set(src, promise);
    return promise;
  };

  const button = (label, action, cls = "secondary-btn") => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", action);
    return b;
  };

  const baseEditor = (root, placeholder = "粘贴或输入文本…") => {
    root.innerHTML = `<div class="editor-stack"><textarea class="input-area" placeholder="${escapeHtml(placeholder)}" spellcheck="false"></textarea><div class="toolbar"></div><div class="output-panel"></div></div>`;
    return { input: $(".input-area", root), toolbar: $(".toolbar", root), output: $(".output-panel", root) };
  };

  const registerTool = (meta, renderer) => {
    if (!meta?.id || typeof renderer !== "function") throw new Error("工具注册信息不完整");
    if (tools.has(meta.id)) throw new Error(`工具 ID 重复：${meta.id}`);
    tools.set(meta.id, { local: true, ...meta, renderer });
  };

  let activeCleanup = null;
  let state;
  let ui;

  const orderedTools = () => {
    const list = [...tools.values()];
    const order = new Map(CATEGORY_ORDER.map((x, i) => [x, i]));
    return list.sort((a, b) => (order.get(a.category) ?? 99) - (order.get(b.category) ?? 99));
  };

  const categories = () => {
    const present = new Set([...tools.values()].map(t => t.category));
    return ["全部", ...CATEGORY_ORDER.filter(x => present.has(x)), "收藏"];
  };

  const filteredTools = () => {
    const query = state.query.trim().toLowerCase();
    let source = orderedTools();
    if (state.category === "最近") {
      source = state.recent.map(id => tools.get(id)).filter(Boolean);
    }
    return source.filter(tool => {
      const categoryOk = state.category === "全部" || state.category === "最近" ||
        (state.category === "收藏" ? state.favorites.has(tool.id) : tool.category === state.category);
      const haystack = `${tool.name} ${tool.desc} ${tool.keywords || ""} ${tool.category}`.toLowerCase();
      return categoryOk && (!query || haystack.includes(query));
    });
  };

  const renderTabs = () => {
    ui.tabs.innerHTML = categories().map(category =>
      `<button class="chip ${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`
    ).join("");
  };

  const render = () => {
    renderTabs();
    const list = filteredTools();
    ui.sectionTitle.textContent = state.category === "全部" ? "全部工具" : state.category === "收藏" ? "我的收藏" : state.category === "最近" ? "最近使用" : state.category;
    ui.resultCount.textContent = `${list.length} 个`;
    ui.empty.hidden = list.length > 0;
    ui.grid.innerHTML = list.map(tool => `
      <article class="tool-card">
        <button class="tool-main" data-id="${escapeHtml(tool.id)}" type="button" aria-label="打开 ${escapeHtml(tool.name)}">
          <span class="tool-icon">${escapeHtml(tool.icon)}</span>
          <h3>${escapeHtml(tool.name)}</h3>
          <p>${escapeHtml(tool.desc)}</p>
          <span class="tag">${escapeHtml(tool.category)}</span>
        </button>
        <button class="favorite ${state.favorites.has(tool.id) ? "on" : ""}" data-fav="${escapeHtml(tool.id)}" type="button" aria-label="${state.favorites.has(tool.id) ? "取消收藏" : "收藏"} ${escapeHtml(tool.name)}">★</button>
      </article>`).join("");
  };

  const setFavorite = id => {
    state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
    storage.set("favorites", [...state.favorites]);
    render();
  };

  const cleanupActiveTool = () => {
    try { activeCleanup?.(); } catch (error) { console.warn("tool cleanup failed", error); }
    activeCleanup = null;
    document.title = "Toolbox";
  };

  const openTool = id => {
    const tool = tools.get(id);
    if (!tool) return;
    cleanupActiveTool();
    state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 8);
    storage.set("recent", state.recent);
    ui.dialogIcon.textContent = tool.icon;
    ui.dialogTitle.textContent = tool.name;
    ui.dialogDesc.textContent = tool.desc;
    ui.localBadge.hidden = !tool.local;
    ui.mount.innerHTML = "";
    const cleanup = tool.renderer(ui.mount);
    activeCleanup = typeof cleanup === "function" ? cleanup : null;
    ui.dialog.showModal();
  };

  const closeDialog = () => {
    if (ui.dialog.open) ui.dialog.close();
  };

  const start = () => {
    ui = {
      grid: $("#toolGrid"), tabs: $("#categoryTabs"), search: $("#searchInput"), dialog: $("#toolDialog"),
      mount: $("#toolMount"), empty: $("#emptyState"), sectionTitle: $("#sectionTitle"), resultCount: $("#resultCount"),
      dialogIcon: $("#dialogIcon"), dialogTitle: $("#dialogTitle"), dialogDesc: $("#dialogDesc"), localBadge: $("#dialogLocalBadge")
    };
    state = {
      category: "全部",
      query: "",
      favorites: new Set(storage.get("favorites", [])),
      recent: storage.get("recent", [])
    };

    const savedTheme = storage.get("preferences.theme", null);
    if (savedTheme === "dark" || savedTheme === "light") document.documentElement.dataset.theme = savedTheme;

    ui.tabs.addEventListener("click", event => {
      const btn = event.target.closest("[data-category]");
      if (!btn) return;
      state.category = btn.dataset.category;
      render();
    });
    ui.grid.addEventListener("click", event => {
      const fav = event.target.closest("[data-fav]");
      if (fav) { setFavorite(fav.dataset.fav); return; }
      const opener = event.target.closest("[data-id]");
      if (opener) openTool(opener.dataset.id);
    });
    ui.search.addEventListener("input", () => { state.query = ui.search.value; render(); });

    document.addEventListener("keydown", event => {
      const tag = document.activeElement?.tagName;
      if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        event.preventDefault();
        ui.search.focus();
      }
      if (event.key === "Escape" && ui.dialog.open) closeDialog();
    });

    $("#recentBtn")?.addEventListener("click", () => { state.category = "最近"; render(); $(".workspace")?.scrollIntoView({block:"start"}); });
    $("#favoritesBtn")?.addEventListener("click", () => { state.category = "收藏"; render(); $(".workspace")?.scrollIntoView({block:"start"}); });
    $("#themeBtn")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      storage.set("preferences.theme", next);
    });
    $("#closeDialogBtn")?.addEventListener("click", closeDialog);
    ui.dialog.addEventListener("click", event => { if (event.target === ui.dialog) closeDialog(); });
    ui.dialog.addEventListener("close", cleanupActiveTool);

    render();
  };

  window.Toolbox = {
    registerTool,
    storage,
    $, $$,
    escapeHtml,
    copyText,
    toast,
    download,
    formatBytes,
    loadScript,
    button,
    baseEditor
  };

  document.addEventListener("DOMContentLoaded", start, { once: true });
})();