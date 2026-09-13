(() => {
  "use strict";
  const { storage, $, escapeHtml, openTool, openPanel, toast } = Toolbox;

  const now = () => Date.now();
  const uid = () => crypto.randomUUID?.() || `t-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const taskData = () => {
    const raw = storage.get("tasks", {}) || {};
    return {
      items: Array.isArray(raw.items) ? raw.items : [],
      activities: Array.isArray(raw.activities) ? raw.activities : []
    };
  };
  const saveTaskData = data => storage.set("tasks", data);
  const activeItems = data => data.items.filter(x => x && !x.deletedAt);
  const taskById = (data, id) => activeItems(data).find(x => x.id === id) || null;
  const durationTextToMs = value => {
    const parts = String(value || "").split(":").map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? ((parts[0]*3600)+(parts[1]*60)+parts[2])*1000 : 0;
  };
  const compactDuration = ms => {
    const m = Math.round(Math.max(0, ms)/60000);
    if (m < 60) return `${m} 分钟`;
    const h = Math.floor(m/60), rest = m%60;
    return rest ? `${h} 小时 ${rest} 分钟` : `${h} 小时`;
  };
  const taskStats = id => {
    const pomodoro = storage.get("tools.pomodoro.history", []) || [];
    const focus = storage.get("tools.focuslog.sessions", []) || [];
    const data = taskData();
    const p = Array.isArray(pomodoro) ? pomodoro.filter(x => x?.taskId === id) : [];
    const f = Array.isArray(focus) ? focus.filter(x => x?.taskId === id) : [];
    const focusMs = f.reduce((sum,x) => sum + (Number(x.durationMs)||durationTextToMs(x.duration)), 0);
    const thoughtCount = data.activities.filter(x => x?.taskId === id && x.type === "analysis").length;
    return { pomodoros:p.length, focusMs, thoughtCount };
  };
  const formatDate = value => value ? new Date(value).toLocaleString() : "";

  let filter = "open";
  let ui;

  const render = () => {
    const data = taskData();
    const items = activeItems(data)
      .filter(x => filter === "done" ? x.status === "done" : x.status !== "done")
      .sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));
    ui.openBtn.classList.toggle("active", filter === "open");
    ui.doneBtn.classList.toggle("active", filter === "done");
    ui.count.textContent = `${items.length} 项`;
    ui.list.innerHTML = items.length ? items.map(task => {
      const stats = taskStats(task.id);
      const meta = [stats.pomodoros ? `${stats.pomodoros} 番茄` : "", stats.focusMs ? compactDuration(stats.focusMs) : "", stats.thoughtCount ? `${stats.thoughtCount} 次分析` : ""].filter(Boolean).join(" · ") || "还没有记录";
      return `<article class="task-row ${task.status === "done" ? "is-done" : ""}">
        <button class="task-check" data-task-toggle="${escapeHtml(task.id)}" type="button" aria-label="${task.status === "done" ? "重新打开" : "完成"}">${task.status === "done" ? "✓" : ""}</button>
        <button class="task-main" data-task-open="${escapeHtml(task.id)}" type="button">
          <strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(meta)}</span>
        </button>
      </article>`;
    }).join("") : `<div class="task-empty">${filter === "done" ? "还没有已完成事项。" : "把最近想做的一件事写下来。"}</div>`;
  };

  const addTask = () => {
    const title = ui.input.value.trim();
    if (!title) return;
    const data = taskData(), ts = now();
    data.items.push({ id:uid(), title, note:"", status:"open", createdAt:ts, updatedAt:ts, completedAt:null, deletedAt:null });
    saveTaskData(data);
    ui.input.value = "";
    filter = "open";
    render();
    toast("已加入待办");
  };

  const toggleTask = id => {
    const data = taskData(), task = taskById(data,id);
    if (!task) return;
    const done = task.status !== "done";
    task.status = done ? "done" : "open";
    task.completedAt = done ? now() : null;
    task.updatedAt = now();
    saveTaskData(data);
    render();
  };

  const historyRows = taskId => {
    const data = taskData();
    const rows = data.activities.filter(x => x?.taskId === taskId).map(x => ({time:x.createdAt||0,label:x.toolName||"思维分析",detail:x.content||"",kind:"analysis"}));
    const p = storage.get("tools.pomodoro.history", []) || [];
    if (Array.isArray(p)) p.filter(x=>x?.taskId===taskId).forEach(x=>rows.push({time:x.endedAt||0,label:"完成番茄钟",detail:`${x.minutes||0} 分钟`,kind:"focus"}));
    const f = storage.get("tools.focuslog.sessions", []) || [];
    if (Array.isArray(f)) f.filter(x=>x?.taskId===taskId).forEach(x=>rows.push({time:x.endedAt||Date.parse(x.date)||0,label:"深度工作",detail:`${x.duration||compactDuration(x.durationMs||0)}${x.note?` · ${x.note}`:""}`,kind:"focus"}));
    return rows.sort((a,b)=>b.time-a.time);
  };

  const openTask = id => {
    const data = taskData(), task = taskById(data,id);
    if (!task) return;
    const stats = taskStats(id);
    openPanel({ icon:"✓", title:task.title, desc:"围绕这件事继续思考、专注，并把过程留在同一条记录里。" }, root => {
      const history = historyRows(id);
      root.innerHTML = `<div class="editor-stack task-detail">
        <div class="field"><label>待办事项</label><input id="taskTitle" class="text-input" value="${escapeHtml(task.title)}"></div>
        <div class="field"><label>补充说明</label><textarea id="taskNote" class="input-area mini-area" placeholder="背景、完成标准、限制条件……">${escapeHtml(task.note||"")}</textarea></div>
        <div class="toolbar"><button id="taskSave" class="primary-btn" type="button">保存</button><button id="taskToggle" class="secondary-btn" type="button">${task.status === "done" ? "重新打开" : "标记完成"}</button><button id="taskDelete" class="danger-btn" type="button">删除</button></div>
        <div class="metrics"><div class="metric"><strong>${stats.pomodoros}</strong><span>完成番茄</span></div><div class="metric"><strong>${Math.round(stats.focusMs/60000)}</strong><span>深度工作分钟</span></div><div class="metric"><strong>${stats.thoughtCount}</strong><span>已保存分析</span></div></div>
        <div class="task-action-group"><h3>思考</h3><div class="task-action-grid">
          <button data-task-tool="taskbreak" class="secondary-btn" type="button">任务拆解</button><button data-task-tool="decision" class="secondary-btn" type="button">决策矩阵</button><button data-task-tool="fivewhys" class="secondary-btn" type="button">5 Whys</button><button data-task-tool="premortem" class="secondary-btn" type="button">事前风险推演</button><button data-task-tool="review" class="secondary-btn" type="button">复盘</button><button data-task-tool="feynman" class="secondary-btn" type="button">费曼学习卡</button>
        </div></div>
        <div class="task-action-group"><h3>专注</h3><div class="task-action-grid"><button data-task-tool="pomodoro" class="primary-btn" type="button">开始番茄钟</button><button data-task-tool="focuslog" class="secondary-btn" type="button">深度工作计时</button></div></div>
        <div class="field"><label>这件事的历史</label><div class="task-history">${history.length ? history.slice(0,30).map(x=>`<div class="task-history-item"><span><strong>${escapeHtml(x.label)}</strong><small>${escapeHtml(formatDate(x.time))}</small></span><p>${escapeHtml(String(x.detail).slice(0,260))}</p></div>`).join("") : `<span class="help-text">还没有分析或专注记录。</span>`}</div></div>
      </div>`;
      $("#taskSave",root).onclick=()=>{
        const fresh = taskData(), current = taskById(fresh,id); if(!current)return;
        current.title=$("#taskTitle",root).value.trim()||current.title; current.note=$("#taskNote",root).value.trim(); current.updatedAt=now(); saveTaskData(fresh); toast("已保存"); render();
      };
      $("#taskToggle",root).onclick=()=>{toggleTask(id); openTask(id);};
      $("#taskDelete",root).onclick=()=>{if(!confirm("删除这条待办？历史记录会保留 taskId，但待办本身将不再显示。"))return;const fresh=taskData(),current=taskById(fresh,id);if(current){current.deletedAt=now();current.updatedAt=now();saveTaskData(fresh);} Toolbox.closeDialog();render();};
      root.addEventListener("click", e=>{const btn=e.target.closest("[data-task-tool]");if(!btn)return;openTool(btn.dataset.taskTool,{taskId:id,task:{...taskById(taskData(),id)}});});
    });
  };

  const start = () => {
    ui = { input:$("#taskInput"), add:$("#addTaskBtn"), list:$("#taskList"), count:$("#taskCount"), openBtn:$("#taskFilterOpen"), doneBtn:$("#taskFilterDone") };
    if (!ui.input || !ui.list) return;
    ui.add.onclick = addTask;
    ui.input.addEventListener("keydown", e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();addTask();}});
    ui.openBtn.onclick=()=>{filter="open";render();};
    ui.doneBtn.onclick=()=>{filter="done";render();};
    ui.list.addEventListener("click",e=>{const toggle=e.target.closest("[data-task-toggle]");if(toggle){toggleTask(toggle.dataset.taskToggle);return;}const open=e.target.closest("[data-task-open]");if(open)openTask(open.dataset.taskOpen);});
    Toolbox.openTask = openTask;
    render();
  };

  document.addEventListener("DOMContentLoaded", start, { once:true });
})();
