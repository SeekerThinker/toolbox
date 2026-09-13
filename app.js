const tools = [
  { id:"counter", icon:"文", name:"字数统计", category:"写作", desc:"统计字符、汉字、词数、段落和预计阅读时长。", keywords:"字数 字符 词数 阅读 写作"},
  { id:"cleaner", icon:"✦", name:"文本清理", category:"文本", desc:"去除多余空格、空行和行首尾空白。", keywords:"空格 空行 清理 排版 文本"},
  { id:"case", icon:"Aa", name:"英文大小写", category:"文本", desc:"UPPER、lower、Title Case 与句首大写快速互转。", keywords:"英文 大小写 case title"},
  { id:"lines", icon:"≡", name:"行处理器", category:"办公", desc:"逐行去重、排序、反转，处理名单和表格粘贴文本。", keywords:"行 去重 排序 名单 Excel"},
  { id:"markdown", icon:"M↓", name:"Markdown 预览", category:"写作", desc:"边写边预览常用 Markdown 格式，适合 README 和笔记。", keywords:"markdown md readme 预览"},
  { id:"json", icon:"{}", name:"JSON 格式化", category:"开发", desc:"美化、压缩或校验 JSON，错误会直接提示。", keywords:"json 格式化 校验 开发"},
  { id:"url", icon:"↗", name:"URL 编解码", category:"开发", desc:"编码或解码 URL 参数与文本。", keywords:"url encode decode 编码 解码"},
  { id:"timestamp", icon:"◷", name:"时间戳转换", category:"开发", desc:"Unix 时间戳与本地日期时间双向转换。", keywords:"时间戳 unix date 时间"},
  { id:"agenda", icon:"✓", name:"会议议程生成器", category:"办公", desc:"用主题、目标和要点快速生成一份可复制的会议议程。", keywords:"会议 议程 agenda meeting 模板"},
];

const categories = ["全部","写作","办公","文本","开发","收藏"];
const state = {
  category: "全部",
  query: "",
  favorites: new Set(JSON.parse(localStorage.getItem("deskkit:favorites") || "[]"))
};

const $ = (s, root=document) => root.querySelector(s);
const grid = $("#toolGrid");
const tabs = $("#categoryTabs");
const searchInput = $("#searchInput");
const dialog = $("#toolDialog");
const mount = $("#toolMount");

function escapeHtml(s="") {
  return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast("已复制"));
}
let toastTimer;
function toast(text) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    Object.assign(el.style, {
      position:"fixed", left:"50%", bottom:"28px", transform:"translateX(-50%)",
      background:"var(--text)", color:"var(--panel-solid)", padding:"10px 14px",
      borderRadius:"11px", zIndex:"999", fontSize:"13px", boxShadow:"var(--shadow)"
    });
    document.body.appendChild(el);
  }
  el.textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 1400);
}

function renderTabs() {
  tabs.innerHTML = categories.map(c =>
    `<button class="chip ${state.category===c?"active":""}" data-category="${c}" type="button">${c}</button>`
  ).join("");
}
function filteredTools() {
  const q = state.query.trim().toLowerCase();
  return tools.filter(t => {
    const catOk = state.category === "全部" ||
      (state.category === "收藏" ? state.favorites.has(t.id) : t.category === state.category);
    const hay = `${t.name} ${t.desc} ${t.keywords} ${t.category}`.toLowerCase();
    return catOk && (!q || hay.includes(q));
  });
}
function render() {
  renderTabs();
  const list = filteredTools();
  $("#sectionTitle").textContent = state.category === "全部" ? "全部工具" : state.category === "收藏" ? "我的收藏" : `${state.category}工具`;
  $("#resultCount").textContent = `${list.length} 个工具`;
  $("#emptyState").hidden = list.length > 0;
  grid.innerHTML = list.map(t => `
    <article class="tool-card" data-id="${t.id}" tabindex="0" role="button">
      <div class="card-top">
        <span class="tool-icon">${t.icon}</span>
        <button class="favorite ${state.favorites.has(t.id)?"on":""}" data-fav="${t.id}" type="button" aria-label="收藏 ${t.name}">★</button>
      </div>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
      <div class="card-meta"><span class="tag">${t.category}</span><span class="open-hint">打开 →</span></div>
    </article>`).join("");
}
function setFavorite(id) {
  state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
  localStorage.setItem("deskkit:favorites", JSON.stringify([...state.favorites]));
  render();
}

tabs.addEventListener("click", e => {
  const btn = e.target.closest("[data-category]");
  if (!btn) return;
  state.category = btn.dataset.category;
  render();
});
grid.addEventListener("click", e => {
  const fav = e.target.closest("[data-fav]");
  if (fav) { e.stopPropagation(); setFavorite(fav.dataset.fav); return; }
  const card = e.target.closest("[data-id]");
  if (card) openTool(card.dataset.id);
});
grid.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const card = e.target.closest("[data-id]");
    if (card) openTool(card.dataset.id);
  }
});
searchInput.addEventListener("input", () => { state.query = searchInput.value; render(); });
document.addEventListener("keydown", e => {
  if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    e.preventDefault(); searchInput.focus();
  }
  if (e.key === "Escape" && dialog.open) dialog.close();
});
$("#favoritesBtn").addEventListener("click", () => { state.category="收藏"; render(); document.querySelector(".workspace").scrollIntoView(); });
$("#closeDialogBtn").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

const savedTheme = localStorage.getItem("deskkit:theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("deskkit:theme", next);
});

function openTool(id) {
  const t = tools.find(x => x.id === id);
  $("#dialogIcon").textContent = t.icon;
  $("#dialogTitle").textContent = t.name;
  $("#dialogDesc").textContent = t.desc;
  mount.innerHTML = "";
  renderers[id](mount);
  dialog.showModal();
}

function baseEditor(root, placeholder="粘贴或输入文本…") {
  root.innerHTML = `
    <div class="editor-stack">
      <textarea class="input-area" placeholder="${placeholder}" spellcheck="false"></textarea>
      <div class="toolbar"></div>
      <div class="output-panel"></div>
    </div>`;
  return { input:$(".input-area",root), toolbar:$(".toolbar",root), output:$(".output-panel",root) };
}
function button(label, action, cls="secondary-btn") {
  const b = document.createElement("button"); b.type="button"; b.className=cls; b.textContent=label; b.addEventListener("click",action); return b;
}

const renderers = {
  counter(root) {
    root.innerHTML = `<textarea class="input-area" placeholder="开始输入或粘贴文章…" spellcheck="true"></textarea><div class="metrics" style="margin-top:12px"></div><p class="stat-note">阅读时长按中文约 300 字/分钟、英文约 200 词/分钟粗略估算。</p>`;
    const input = $(".input-area",root), metrics=$(".metrics",root);
    const update = () => {
      const s=input.value;
      const noSpace=s.replace(/\s/g,"");
      const chinese=(s.match(/[\u4e00-\u9fff]/g)||[]).length;
      const words=(s.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)||[]).length;
      const paragraphs=s.trim()?s.trim().split(/\n\s*\n/).length:0;
      const mins=Math.max(0, Math.ceil(chinese/300 + words/200));
      const rows=[["字符",s.length],["不含空格",noSpace.length],["汉字",chinese],["英文词",words],["段落",paragraphs],["预计阅读", mins?`${mins} 分钟`:"0 分钟"]];
      metrics.innerHTML=rows.map(([k,v])=>`<div class="metric"><strong>${v}</strong><span>${k}</span></div>`).join("");
    };
    input.addEventListener("input",update); update();
  },
  cleaner(root) {
    const {input,toolbar,output}=baseEditor(root);
    const clean = mode => {
      let s=input.value;
      if(mode==="spaces") s=s.split("\n").map(x=>x.replace(/[ \t]+/g," ").trim()).join("\n");
      if(mode==="blank") s=s.replace(/\n{3,}/g,"\n\n").trim();
      if(mode==="all") s=s.split("\n").map(x=>x.replace(/[ \t]+/g," ").trim()).join("\n").replace(/\n{3,}/g,"\n\n").trim();
      output.textContent=s;
    };
    toolbar.append(button("清理多余空格",()=>clean("spaces")),button("压缩空行",()=>clean("blank")),button("全部清理",()=>clean("all"),"primary-btn"),button("复制结果",()=>copyText(output.textContent)));
    output.textContent="处理结果会显示在这里。";
  },
  case(root) {
    const {input,toolbar,output}=baseEditor(root,"输入英文文本…");
    const title = s => s.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase());
    const sentence = s => s.toLowerCase().replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g,c=>c.toUpperCase());
    const act = fn => output.textContent=fn(input.value);
    toolbar.append(button("UPPER",()=>act(s=>s.toUpperCase())),button("lower",()=>act(s=>s.toLowerCase())),button("Title Case",()=>act(title)),button("Sentence case",()=>act(sentence)),button("复制",()=>copyText(output.textContent),"primary-btn"));
    output.textContent="转换结果会显示在这里。";
  },
  lines(root) {
    const {input,toolbar,output}=baseEditor(root,"每行一条内容，例如姓名、邮箱、关键词…");
    const lines = () => input.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    toolbar.append(
      button("去重",()=>output.textContent=[...new Set(lines())].join("\n")),
      button("A → Z",()=>output.textContent=lines().sort((a,b)=>a.localeCompare(b,"zh-CN")).join("\n")),
      button("Z → A",()=>output.textContent=lines().sort((a,b)=>b.localeCompare(a,"zh-CN")).join("\n")),
      button("反转",()=>output.textContent=lines().reverse().join("\n")),
      button("复制",()=>copyText(output.textContent),"primary-btn")
    );
    output.textContent="处理结果会显示在这里。";
  },
  markdown(root) {
    root.innerHTML = `<div class="two-col"><textarea class="input-area" placeholder="# 标题\n\n**加粗**、*斜体*、\`代码\`、列表…" spellcheck="true"></textarea><div class="preview"></div></div>`;
    const input=$(".input-area",root), preview=$(".preview",root);
    const md = s => {
      let x=escapeHtml(s);
      x=x.replace(/^### (.+)$/gm,"<h3>$1</h3>").replace(/^## (.+)$/gm,"<h2>$1</h2>").replace(/^# (.+)$/gm,"<h1>$1</h1>");
      x=x.replace(/^> (.+)$/gm,"<blockquote>$1</blockquote>");
      x=x.replace(/^\- (.+)$/gm,"<li>$1</li>");
      x=x.replace(/(<li>.*<\/li>\n?)+/g,m=>`<ul>${m}</ul>`);
      x=x.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/`([^`]+)`/g,"<code>$1</code>");
      x=x.split(/\n{2,}/).map(p=>/^\s*<(h\d|ul|blockquote)/.test(p)?p:`<p>${p.replace(/\n/g,"<br>")}</p>`).join("");
      return x;
    };
    const update=()=>preview.innerHTML=md(input.value||"# Markdown 预览\n\n在左侧输入内容。");
    input.addEventListener("input",update); update();
  },
  json(root) {
    const {input,toolbar,output}=baseEditor(root,'粘贴 JSON，例如 {"name":"DeskKit"}');
    const parse = () => JSON.parse(input.value);
    toolbar.append(
      button("格式化",()=>{try{output.textContent=JSON.stringify(parse(),null,2)}catch(e){output.textContent="错误："+e.message}},"primary-btn"),
      button("压缩",()=>{try{output.textContent=JSON.stringify(parse())}catch(e){output.textContent="错误："+e.message}}),
      button("校验",()=>{try{parse();output.textContent="✓ JSON 有效"}catch(e){output.textContent="✕ "+e.message}}),
      button("复制",()=>copyText(output.textContent))
    );
    output.textContent="结果会显示在这里。";
  },
  url(root) {
    const {input,toolbar,output}=baseEditor(root,"输入 URL 或需要编码的文本…");
    toolbar.append(
      button("编码",()=>{try{output.textContent=encodeURIComponent(input.value)}catch(e){output.textContent=e.message}},"primary-btn"),
      button("解码",()=>{try{output.textContent=decodeURIComponent(input.value)}catch(e){output.textContent="解码失败："+e.message}}),
      button("复制",()=>copyText(output.textContent))
    );
    output.textContent="结果会显示在这里。";
  },
  timestamp(root) {
    root.innerHTML = `
      <div class="two-col">
        <div class="field"><label>Unix 时间戳（秒或毫秒）</label><input id="tsInput" class="text-input" placeholder="例如 1767225600"></div>
        <div class="field"><label>本地日期时间</label><input id="dateInput" class="text-input" type="datetime-local"></div>
      </div>
      <div class="toolbar" style="margin-top:12px">
        <button id="tsToDate" class="primary-btn" type="button">时间戳 → 日期</button>
        <button id="dateToTs" class="secondary-btn" type="button">日期 → 时间戳</button>
        <button id="nowTs" class="secondary-btn" type="button">使用当前时间</button>
      </div>
      <div class="output-panel" style="margin-top:12px">转换结果会显示在这里。</div>`;
    const ts=$("#tsInput",root), date=$("#dateInput",root), out=$(".output-panel",root);
    $("#tsToDate",root).onclick=()=>{
      let n=Number(ts.value.trim()); if(!Number.isFinite(n)){out.textContent="请输入有效数字";return}
      if(Math.abs(n)<1e12) n*=1000;
      const d=new Date(n); out.textContent=Number.isNaN(d.getTime())?"无效时间戳":`${d.toLocaleString()}\nISO: ${d.toISOString()}`;
    };
    $("#dateToTs",root).onclick=()=>{
      const d=new Date(date.value); if(Number.isNaN(d.getTime())){out.textContent="请选择有效日期时间";return}
      out.textContent=`秒：${Math.floor(d.getTime()/1000)}\n毫秒：${d.getTime()}`;
    };
    $("#nowTs",root).onclick=()=>{ const d=new Date(); ts.value=Math.floor(d.getTime()/1000); out.textContent=`${d.toLocaleString()}\n秒：${Math.floor(d.getTime()/1000)}`; };
  },
  agenda(root) {
    root.innerHTML = `
      <div class="editor-stack">
        <div class="field"><label>会议主题</label><input id="aTitle" class="text-input" placeholder="例如：Q4 内容计划评审"></div>
        <div class="two-col">
          <div class="field"><label>目标</label><input id="aGoal" class="text-input" placeholder="这次会议要达成什么？"></div>
          <div class="field"><label>时长（分钟）</label><input id="aTime" class="text-input" type="number" min="10" value="30"></div>
        </div>
        <div class="field"><label>讨论要点（每行一条）</label><textarea id="aPoints" class="input-area" style="min-height:150px" placeholder="现状回顾\n方案选择\n下一步分工"></textarea></div>
        <div class="toolbar"><button id="aGen" class="primary-btn" type="button">生成议程</button><button id="aCopy" class="secondary-btn" type="button">复制</button></div>
        <div class="output-panel"></div>
      </div>`;
    const out=$(".output-panel",root);
    $("#aGen",root).onclick=()=>{
      const title=$("#aTitle",root).value.trim()||"未命名会议";
      const goal=$("#aGoal",root).value.trim()||"明确结论与下一步行动";
      const mins=Math.max(10,Number($("#aTime",root).value)||30);
      const pts=$("#aPoints",root).value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
      const body=pts.length?pts.map((p,i)=>`${i+1}. ${p}`).join("\n"):"1. 背景与现状\n2. 核心讨论\n3. 决策与下一步";
      out.textContent=`# ${title}\n\n目标：${goal}\n时长：${mins} 分钟\n\n## 议程\n${body}\n\n## 会后确认\n- [ ] 结论\n- [ ] Owner\n- [ ] 截止时间`;
    };
    $("#aCopy",root).onclick=()=>copyText(out.textContent);
    out.textContent="填写信息后生成一份可直接复制的会议议程。";
  }
};

render();
