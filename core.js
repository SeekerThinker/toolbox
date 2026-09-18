(() => {
  "use strict";

  const STORAGE_KEY = "toolbox:data:v1";
  const DATA_VERSION = 1;
  const CATEGORY_ORDER = ["思维", "专注"];
  const tools = new Map();

  const safeParse = (value, fallback) => {
    try { return value == null ? fallback : JSON.parse(value); }
    catch { return fallback; }
  };
  const defaultData = () => ({
    version: DATA_VERSION,
    preferences: { theme: null },
    favorites: [],
    recent: [],
    tasks: { items: [], activities: [] },
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
    parts.slice(0,-1).forEach(part => {
      if (!cur[part] || typeof cur[part] !== "object" || Array.isArray(cur[part])) cur[part] = {};
      cur = cur[part];
    });
    cur[parts.at(-1)] = value;
  };
  const deletePath = (obj, path) => {
    const parts = String(path).split(".").filter(Boolean);
    let cur = obj;
    for (const part of parts.slice(0,-1)) {
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
      setPath(data, targetPath, transform(safeParse(raw, raw)));
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
  data = {
    ...defaultData(), ...data,
    preferences:{...defaultData().preferences,...(data.preferences||{})},
    tasks:{...defaultData().tasks,...(data.tasks||{})},
    tools:data.tools||{}
  };
  data.version = DATA_VERSION;
  if (!Array.isArray(data.tasks.items)) data.tasks.items = [];
  if (!Array.isArray(data.tasks.activities)) data.tasks.activities = [];
  if (migrateLegacy(data) || !localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
  const storage = {
    get(path, fallback=null) {
      const value = getPath(data,path,fallback);
      return value === undefined ? fallback : value;
    },
    set(path,value) {
      setPath(data,path,value);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      return value;
    },
    remove(path) {
      deletePath(data,path);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    },
    snapshot() { return JSON.parse(JSON.stringify(data)); },
    exportData() { return JSON.stringify(data,null,2); },
    importData(text) {
      const incoming = typeof text === "string" ? JSON.parse(text) : text;
      if (!isRecord(incoming) || incoming.version !== DATA_VERSION ||
          !isRecord(incoming.tasks) || !Array.isArray(incoming.tasks.items) ||
          !Array.isArray(incoming.tasks.activities) || !isRecord(incoming.tools) ||
          !isRecord(incoming.preferences) || !Array.isArray(incoming.favorites) ||
          !Array.isArray(incoming.recent)) {
        throw new Error("不是有效的 Toolbox v1 备份，当前数据未更改");
      }
      const nextData = {
        ...defaultData(), ...incoming,
        version:DATA_VERSION,
        preferences:{...defaultData().preferences,...incoming.preferences},
        favorites:incoming.favorites,
        recent:incoming.recent,
        tasks:{items:incoming.tasks.items,activities:incoming.tasks.activities},
        tools:incoming.tools
      };
      localStorage.setItem(STORAGE_KEY,JSON.stringify(nextData));
      data = nextData;
      return storage.snapshot();
    }
  };

  const $ = (selector,root=document) => root.querySelector(selector);
  const escapeHtml = (value="") => String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  let toastTimer;
  const toast = text => {
    let el=$(".toast");
    if(!el){el=document.createElement("div");el.className="toast";document.body.appendChild(el);}
    el.textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),1600);
  };
  const copyText = async text => {
    const value=String(text??"");
    try{
      if(!navigator.clipboard?.writeText)throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
    }catch{
      const area=document.createElement("textarea");area.value=value;area.setAttribute("readonly","");area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();const ok=document.execCommand?.("copy");area.remove();if(!ok){toast("复制失败，请手动复制");return false;}
    }
    toast("已复制");return true;
  };
  const download = (blob,filename) => {
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
  };
  const registerTool = (meta,renderer) => {
    if(!meta?.id||typeof renderer!=="function")throw new Error("工具注册信息不完整");
    if(tools.has(meta.id))throw new Error(`工具 ID 重复：${meta.id}`);
    tools.set(meta.id,{local:true,...meta,renderer});
  };

  let activeCleanup=null,state,ui;
  const orderedTools = () => {
    const order=new Map(CATEGORY_ORDER.map((x,i)=>[x,i]));
    return [...tools.values()].sort((a,b)=>(order.get(a.category)??99)-(order.get(b.category)??99));
  };
  const categories = () => {
    const present=new Set([...tools.values()].map(t=>t.category));
    return ["全部",...CATEGORY_ORDER.filter(x=>present.has(x))];
  };
  const filteredTools = () => {
    const query=state.query.trim().toLowerCase();let source=orderedTools();
    if(state.category==="最近")source=state.recent.map(id=>tools.get(id)).filter(Boolean);
    return source.filter(tool=>{
      const categoryOk=state.category==="全部"||state.category==="最近"||tool.category===state.category;
      const haystack=`${tool.name} ${tool.desc} ${tool.keywords||""} ${tool.category}`.toLowerCase();
      return categoryOk&&(!query||haystack.includes(query));
    });
  };
  const renderTabs = () => { ui.tabs.innerHTML=categories().map(category=>`<button class="chip ${state.category===category?"active":""}" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`).join(""); };
  const render = () => {
    renderTabs();const list=filteredTools();
    ui.sectionTitle.textContent=state.category==="全部"?"方法工具":state.category==="最近"?"最近使用":state.category;
    ui.resultCount.textContent=`${list.length} 个`;ui.empty.hidden=list.length>0;
    ui.grid.innerHTML=list.map(tool=>`<article class="tool-card"><button class="tool-main" data-id="${escapeHtml(tool.id)}" type="button"><span class="tool-icon">${escapeHtml(tool.icon)}</span><h3>${escapeHtml(tool.name)}</h3><p>${escapeHtml(tool.desc)}</p><span class="tag">${escapeHtml(tool.category)}</span></button></article>`).join("");
  };
  const cleanupActiveTool = () => {try{activeCleanup?.();}catch(error){console.warn("tool cleanup failed",error);}activeCleanup=null;document.title="Toolbox";};
  const prepareDialog = ({icon,title,desc,local=true}) => {cleanupActiveTool();ui.dialogIcon.textContent=icon;ui.dialogTitle.textContent=title;ui.dialogDesc.textContent=desc;ui.localBadge.hidden=!local;ui.mount.innerHTML="";};
  const openPanel = (meta,renderer) => {
    prepareDialog(meta);const cleanup=renderer?.(ui.mount);activeCleanup=typeof cleanup==="function"?cleanup:null;if(!ui.dialog.open)ui.dialog.showModal();
  };
  const findTask = id => {
    const items=storage.get("tasks.items",[]);return Array.isArray(items)?items.find(x=>x?.id===id&&!x.deletedAt)||null:null;
  };
  const addTaskActivity = (taskId,tool,content) => {
    const activities=storage.get("tasks.activities",[]);const next=Array.isArray(activities)?activities:[];
    next.unshift({id:crypto.randomUUID?.()||`a-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,taskId,type:"analysis",toolId:tool.id,toolName:tool.name,content,createdAt:Date.now()});
    storage.set("tasks.activities",next.slice(0,1000));
  };
  const prefillFromTask = (id,task) => {
    if(!task)return;
    const selectors={taskbreak:"#tbGoal",fivewhys:"#whyProblem",premortem:"#pmPlan",feynman:"#fyTopic",focuslog:"#fTask"};
    const input=$(selectors[id],ui.mount);if(input&&!input.value.trim())input.value=task.title;
  };
  const attachTaskContext = (tool,context) => {
    if(!context?.taskId)return;
    const task=findTask(context.taskId)||context.task;if(!task)return;
    prefillFromTask(tool.id,task);
    const bar=document.createElement("div");bar.className="task-context";
    bar.innerHTML=`<div><span>当前待办</span><strong>${escapeHtml(task.title)}</strong></div><div class="toolbar"><button class="secondary-btn" data-save-result type="button">保存结果到待办</button><button class="secondary-btn" data-back-task type="button">返回待办</button></div>`;
    ui.mount.prepend(bar);
    $("[data-save-result]",bar).onclick=()=>{
      const outputs=[...ui.mount.querySelectorAll(".output-panel")].map(x=>x.textContent.trim()).filter(x=>x&&x.length>8);
      const content=outputs.at(-1)||"";
      if(!content){toast("先整理出结果");return;}
      addTaskActivity(task.id,tool,content);toast("已保存到待办");
    };
    $("[data-back-task]",bar).onclick=()=>window.Toolbox.openTask?.(task.id);
  };
  const openTool = (id,context={}) => {
    const tool=tools.get(id);if(!tool)return;
    state.recent=[id,...state.recent.filter(x=>x!==id)].slice(0,8);storage.set("recent",state.recent);
    prepareDialog({icon:tool.icon,title:tool.name,desc:tool.desc,local:tool.local});
    const cleanup=tool.renderer(ui.mount,context);activeCleanup=typeof cleanup==="function"?cleanup:null;attachTaskContext(tool,context);if(!ui.dialog.open)ui.dialog.showModal();
  };
  const openDataPanel = () => {
    openPanel({icon:"↥",title:"数据备份",desc:"导出或恢复待办、分析、专注历史和偏好。"},root=>{
      root.innerHTML=`<div class="editor-stack"><div class="output-panel">数据默认保存在当前浏览器。导出 JSON 可备份或迁移到另一个浏览器。</div><div class="toolbar"><button id="exportDataBtn" class="primary-btn" type="button">导出全部数据</button></div><hr class="divider"><div class="field"><label>恢复备份</label><input id="importDataFile" class="file-drop" type="file" accept="application/json,.json"></div><button id="importDataBtn" class="secondary-btn" type="button">导入并覆盖当前数据</button><div id="dataBackupStatus" class="output-panel">导入前会再次确认；成功后页面会重新载入。</div></div>`;
      $("#exportDataBtn",root).onclick=()=>{const date=new Date().toISOString().slice(0,10);download(new Blob([storage.exportData()],{type:"application/json;charset=utf-8"}),`toolbox-backup-${date}.json`);toast("备份已导出");};
      $("#importDataBtn",root).onclick=async()=>{const file=$("#importDataFile",root).files[0],status=$("#dataBackupStatus",root);if(!file){status.textContent="请先选择备份 JSON。";return;}if(!confirm("导入备份会覆盖当前浏览器里的全部 Toolbox 数据。继续吗？")){status.textContent="已取消导入，当前数据没有变化。";return;}try{storage.importData(await file.text());status.textContent="✓ 已恢复备份，正在重新载入。";setTimeout(()=>location.reload(),350);}catch(error){status.textContent=`导入失败：${error.message}`;}};
    });
  };
  const closeDialog = () => {if(ui.dialog.open)ui.dialog.close();};

  const start = () => {
    ui={grid:$("#toolGrid"),tabs:$("#categoryTabs"),search:$("#searchInput"),dialog:$("#toolDialog"),mount:$("#toolMount"),empty:$("#emptyState"),sectionTitle:$("#sectionTitle"),resultCount:$("#resultCount"),dialogIcon:$("#dialogIcon"),dialogTitle:$("#dialogTitle"),dialogDesc:$("#dialogDesc"),localBadge:$("#dialogLocalBadge")};
    const savedRecent=storage.get("recent",[]),validRecent=Array.isArray(savedRecent)?savedRecent.filter(id=>tools.has(id)).slice(0,8):[];
    if(JSON.stringify(validRecent)!==JSON.stringify(savedRecent))storage.set("recent",validRecent);
    state={category:"全部",query:"",recent:validRecent};
    const savedTheme=storage.get("preferences.theme",null);if(savedTheme==="dark"||savedTheme==="light")document.documentElement.dataset.theme=savedTheme;
    ui.tabs?.addEventListener("click",event=>{const btn=event.target.closest("[data-category]");if(!btn)return;state.category=btn.dataset.category;render();});
    ui.grid?.addEventListener("click",event=>{const opener=event.target.closest("[data-id]");if(opener)openTool(opener.dataset.id);});
    ui.search?.addEventListener("input",()=>{state.query=ui.search.value;render();});
    document.addEventListener("keydown",event=>{const tag=document.activeElement?.tagName;if(event.key==="/"&&!["INPUT","TEXTAREA","SELECT"].includes(tag)){event.preventDefault();ui.search?.focus();}if(event.key==="Escape"&&ui.dialog.open)closeDialog();});
    $("#recentBtn")?.addEventListener("click",()=>{state.category="最近";render();});
    $("#dataBtn")?.addEventListener("click",event=>{event.preventDefault();openDataPanel();});
    $("#themeBtn")?.addEventListener("click",()=>{const next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;storage.set("preferences.theme",next);});
    $("#closeDialogBtn")?.addEventListener("click",closeDialog);ui.dialog.addEventListener("click",event=>{if(event.target===ui.dialog)closeDialog();});ui.dialog.addEventListener("close",cleanupActiveTool);
    render();
  };

  window.Toolbox={registerTool,storage,$,escapeHtml,copyText,toast,download,openTool,openPanel,closeDialog};
  document.addEventListener("DOMContentLoaded",start,{once:true});
})();
