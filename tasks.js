(() => {
  "use strict";
  const { storage, $, escapeHtml, openTool, openPanel, toast } = Toolbox;

  const now = () => Date.now();
  const uid = prefix => crypto.randomUUID?.() || `${prefix || "id"}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const PRIORITIES = {
    do: { label:"重要 + 紧急", action:"现在处理" },
    schedule: { label:"重要 + 不紧急", action:"安排时间" },
    delegate: { label:"不重要 + 紧急", action:"快速处理 / 委派" },
    reconsider: { label:"不重要 + 不紧急", action:"重新考虑" }
  };

  const normalizeTask = raw => {
    const task = raw || {};
    let priority = ["do","schedule","delegate","reconsider"].includes(task.priority) ? task.priority : "";
    if (!priority) {
      if (task.important === true && task.urgent === true) priority = "do";
      else if (task.important === true) priority = "schedule";
      else if (task.urgent === true) priority = "delegate";
    }
    return {
      id: task.id || uid("t"),
      title: task.title || "未命名待办",
      note: task.note || "",
      status: task.status === "done" ? "done" : "open",
      createdAt: Number(task.createdAt) || now(),
      updatedAt: Number(task.updatedAt) || Number(task.createdAt) || now(),
      completedAt: Number(task.completedAt) || null,
      deletedAt: Number(task.deletedAt) || null,
      outcome: task.outcome || "",
      nextAction: task.nextAction || "",
      estimateMinutes: Number(task.estimateMinutes) > 0 ? Number(task.estimateMinutes) : null,
      plannedAt: Number(task.plannedAt) || null,
      obstacle: task.obstacle || "",
      ifThen: task.ifThen || "",
      priority,
      reflection: task.reflection && typeof task.reflection === "object" ? task.reflection : null
    };
  };

  const taskData = () => {
    const raw = storage.get("tasks", {}) || {};
    return {
      items: Array.isArray(raw.items) ? raw.items.map(normalizeTask) : [],
      activities: Array.isArray(raw.activities) ? raw.activities : []
    };
  };
  const saveTaskData = data => storage.set("tasks", data);
  const activeItems = data => data.items.filter(x => x && !x.deletedAt);
  const taskById = (data,id) => activeItems(data).find(x => x.id === id) || null;
  const durationTextToMs = value => {
    const parts = String(value || "").split(":").map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? ((parts[0]*3600)+(parts[1]*60)+parts[2])*1000 : 0;
  };
  const compactDuration = ms => {
    const m = Math.round(Math.max(0,ms)/60000);
    if (m < 60) return `${m} 分钟`;
    const h = Math.floor(m/60), r = m%60;
    return r ? `${h} 小时 ${r} 分钟` : `${h} 小时`;
  };
  const formatDate = value => value ? new Date(value).toLocaleString() : "";
  const formatShortDate = value => value ? new Date(value).toLocaleString([], {month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  const toLocalInput = value => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
  };

  const taskStats = id => {
    const pomodoro = storage.get("tools.pomodoro.history", []) || [];
    const focus = storage.get("tools.focuslog.sessions", []) || [];
    const data = taskData();
    const p = Array.isArray(pomodoro) ? pomodoro.filter(x=>x?.taskId===id) : [];
    const f = Array.isArray(focus) ? focus.filter(x=>x?.taskId===id) : [];
    const pomodoroMs = p.reduce((s,x)=>s+(Number(x.minutes)||0)*60000,0);
    const focusMs = f.reduce((s,x)=>s+(Number(x.durationMs)||durationTextToMs(x.duration)),0);
    const thoughtCount = data.activities.filter(x=>x?.taskId===id&&x.type==="analysis").length;
    return { pomodoros:p.length, pomodoroMs, focusMs, totalMs:pomodoroMs+focusMs, thoughtCount };
  };

  const suggestionFor = (task,stats) => {
    if (task.status === "done" && !task.reflection) return "如果这件事值得留下经验，可以补一条完成复盘。";
    if (task.estimateMinutes && stats.totalMs > task.estimateMinutes*60000*1.5) return `实际投入已到 ${compactDuration(stats.totalMs)}，高于原估计 ${task.estimateMinutes} 分钟；可以考虑重新拆解或校准估时。`;
    if (!task.nextAction && stats.totalMs) return "已经开始做了。如果后面容易卡住，可以补一个更具体的下一步动作。";
    if (!task.outcome && !task.nextAction) return "可以直接开始专注；如果任务比较复杂，再补完成标准或下一步动作。";
    if (task.obstacle && !task.ifThen) return "如果这个障碍经常出现，可以补一个 If–Then 应对。";
    return "";
  };

  let filter = "open", ui;

  const priorityText = task => PRIORITIES[task.priority]?.label || "";
  const normalRows = items => items.map(task => {
    const stats = taskStats(task.id);
    const meta = [
      task.nextAction ? `下一步：${task.nextAction}` : "",
      task.plannedAt ? formatShortDate(task.plannedAt) : "",
      stats.totalMs ? compactDuration(stats.totalMs) : "",
      priorityText(task)
    ].filter(Boolean).join(" · ") || "打开即可开始";
    return `<article class="task-row ${task.status==="done"?"is-done":""}">
      <button class="task-check" data-task-toggle="${escapeHtml(task.id)}" type="button" aria-label="${task.status==="done"?"重新打开":"完成"}">${task.status==="done"?"✓":""}</button>
      <button class="task-main" data-task-open="${escapeHtml(task.id)}" type="button"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(meta)}</span></button>
    </article>`;
  }).join("");

  const matrixView = items => {
    const cells = Object.entries(PRIORITIES);
    const classified = new Set();
    const html = cells.map(([key,meta]) => {
      const group = items.filter(x=>x.priority===key);
      group.forEach(x=>classified.add(x.id));
      return `<section class="priority-cell"><div class="priority-cell-head"><strong>${meta.label}</strong><span>${meta.action}</span></div><div class="priority-tasks">${group.length?group.map(t=>`<button class="priority-task" data-task-open="${escapeHtml(t.id)}" type="button"><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.nextAction||"打开任务")}</span></button>`).join(""):"<span class='help-text'>暂无</span>"}</div></section>`;
    }).join("");
    const unclassified = items.filter(x=>!classified.has(x.id));
    return `<div class="priority-matrix">${html}</div>${unclassified.length?`<div class="unclassified-tasks"><span>未分类 · 可选</span>${unclassified.map(t=>`<button class="priority-task" data-task-open="${escapeHtml(t.id)}" type="button"><strong>${escapeHtml(t.title)}</strong><span>尚未设置优先级</span></button>`).join("")}</div>`:""}`;
  };

  const render = () => {
    const data = taskData(), all = activeItems(data), open = all.filter(x=>x.status!=="done"), done = all.filter(x=>x.status==="done");
    ui.openBtn.classList.toggle("active",filter==="open");
    ui.doneBtn.classList.toggle("active",filter==="done");
    ui.matrixBtn.classList.toggle("active",filter==="matrix");
    const items = (filter==="done"?done:open).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
    ui.count.textContent = filter==="matrix" ? `${open.length} 项待办` : `${items.length} 项`;
    if (filter==="matrix") ui.list.innerHTML = matrixView(open);
    else ui.list.innerHTML = items.length ? normalRows(items) : `<div class="task-empty">${filter==="done"?"还没有已完成事项。":"把最近想做的一件事写下来。"}</div>`;
  };

  const addTask = () => {
    const titles = String(ui.input.value||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,30);
    if (!titles.length) return;
    const data = taskData(), ts = now();
    titles.forEach((title,i)=>data.items.push(normalizeTask({id:uid("t"),title,createdAt:ts+i,updatedAt:ts+i})));
    saveTaskData(data);
    ui.input.value = "";
    filter = "open";
    render();
    toast(titles.length===1?"已加入待办":`已加入 ${titles.length} 条待办`);
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
    const rows = data.activities.filter(x=>x?.taskId===taskId).map(x=>({
      time:x.createdAt||0,
      label:x.type==="reflection"?"完成复盘":(x.toolName||"思维分析"),
      detail:x.content||""
    }));
    const p = storage.get("tools.pomodoro.history",[]) || [];
    if (Array.isArray(p)) p.filter(x=>x?.taskId===taskId).forEach(x=>rows.push({time:x.endedAt||0,label:"完成番茄钟",detail:`${x.minutes||0} 分钟 · ${x.plannedAction||x.taskTitle||""}`}));
    const f = storage.get("tools.focuslog.sessions",[]) || [];
    if (Array.isArray(f)) f.filter(x=>x?.taskId===taskId).forEach(x=>rows.push({time:x.endedAt||Date.parse(x.date)||0,label:"深度工作",detail:`${x.duration||compactDuration(x.durationMs||0)} · ${x.plannedAction||x.task||""}${x.note?` · ${x.note}`:""}`}));
    return rows.sort((a,b)=>b.time-a.time);
  };

  const openTask = id => {
    const data = taskData(), task = taskById(data,id);
    if (!task) return;
    const stats = taskStats(id), history = historyRows(id), actualMinutes = Math.round(stats.totalMs/60000);
    const hasPlanning = Boolean(task.outcome||task.nextAction||task.estimateMinutes||task.plannedAt||task.obstacle||task.ifThen||task.note||task.priority);
    const suggestion = suggestionFor(task,stats);

    openPanel({icon:"✓",title:task.title,desc:"可以直接开始，也可以按需补充计划、思考或复盘。"}, root => {
      root.innerHTML = `<div class="editor-stack task-detail">
        <div class="task-minimal">
          <div class="field"><label>待办</label><input id="taskTitle" class="text-input task-title-input" value="${escapeHtml(task.title)}"></div>
          <div class="task-primary-actions">
            <button data-task-tool="pomodoro" class="primary-btn" type="button">开始番茄钟</button>
            <button data-task-tool="focuslog" class="secondary-btn" type="button">深度工作</button>
            <button id="taskToggle" class="secondary-btn" type="button">${task.status==="done"?"重新打开":"标记完成"}</button>
            <button id="taskDelete" class="danger-btn" type="button">删除</button>
          </div>
        </div>

        ${suggestion?`<div class="task-suggestion"><span>可选建议</span><p>${escapeHtml(suggestion)}</p></div>`:""}

        <div class="metrics task-metrics compact-metrics">
          <div class="metric"><strong>${actualMinutes||0}</strong><span>实际专注分钟</span></div>
          <div class="metric"><strong>${stats.pomodoros}</strong><span>完成番茄</span></div>
          <div class="metric"><strong>${stats.thoughtCount}</strong><span>已保存分析</span></div>
        </div>

        <details class="task-capability" ${hasPlanning?"open":""}>
          <summary><strong>补充任务信息</strong><span>${hasPlanning?"已填写部分信息":"按需填写"}</span></summary>
          <div class="task-capability-body">
            <div class="field"><label>完成标准</label><textarea id="taskOutcome" class="input-area mini-area" placeholder="什么结果才算完成？">${escapeHtml(task.outcome||"")}</textarea></div>
            <div class="field"><label>下一步动作</label><input id="taskNext" class="text-input" placeholder="接下来具体做什么？" value="${escapeHtml(task.nextAction||"")}"></div>
            <div class="two-col"><div class="field"><label>预计用时（分钟）</label><input id="taskEstimate" class="text-input" type="number" min="1" max="1440" value="${task.estimateMinutes||""}"></div><div class="field"><label>计划开始时间</label><input id="taskPlanned" class="text-input" type="datetime-local" value="${escapeHtml(toLocalInput(task.plannedAt))}"></div></div>
            <div class="field"><label>优先级 · 可不设置</label><select id="taskPriority" class="select-input"><option value="" ${!task.priority?"selected":""}>未设置</option>${Object.entries(PRIORITIES).map(([key,meta])=>`<option value="${key}" ${task.priority===key?"selected":""}>${meta.label} · ${meta.action}</option>`).join("")}</select></div>
            <div class="field"><label>可能的障碍</label><input id="taskObstacle" class="text-input" value="${escapeHtml(task.obstacle||"")}"></div>
            <div class="field"><label>If–Then 应对</label><input id="taskIfThen" class="text-input" placeholder="如果……发生，那么我就……" value="${escapeHtml(task.ifThen||"")}"></div>
            <div class="field"><label>背景 / 备注</label><textarea id="taskNote" class="input-area mini-area">${escapeHtml(task.note||"")}</textarea></div>
            <button id="taskSave" class="secondary-btn" type="button">保存这些信息</button>
          </div>
        </details>

        <details class="task-capability">
          <summary><strong>深入思考</strong><span>需要时调用</span></summary>
          <div class="task-capability-body"><div class="task-action-grid">
            <button data-task-tool="taskbreak" class="secondary-btn" type="button">任务拆解</button>
            <button data-task-tool="premortem" class="secondary-btn" type="button">事前风险</button>
            <button data-task-tool="decision" class="secondary-btn" type="button">Decision Journal</button>
            <button data-task-tool="fivewhys" class="secondary-btn" type="button">原因探索</button>
            <button data-task-tool="review" class="secondary-btn" type="button">阶段复盘</button>
            <button data-task-tool="feynman" class="secondary-btn" type="button">解释与学习</button>
          </div></div>
        </details>

        ${task.status==="done"?`<details class="task-capability reflection-card" ${task.reflection?"open":""}><summary><strong>完成后复盘</strong><span>可选</span></summary><div class="task-capability-body">
          <div class="field"><label>实际结果</label><textarea id="taskReflectResult" class="input-area mini-area">${escapeHtml(task.reflection?.result||"")}</textarea></div>
          <div class="field"><label>最大的偏差 / 学到什么</label><textarea id="taskReflectLearn" class="input-area mini-area">${escapeHtml(task.reflection?.learned||"")}</textarea></div>
          <div class="field"><label>下次遇到类似事情，我会怎么做</label><input id="taskReflectNext" class="text-input" value="${escapeHtml(task.reflection?.nextTime||"")}"></div>
          <button id="taskReflectionSave" class="secondary-btn" type="button">保存复盘</button>
        </div></details>`:""}

        <details class="task-capability" ${history.length?"open":""}>
          <summary><strong>历史</strong><span>${history.length?`${history.length} 条`:"暂无记录"}</span></summary>
          <div class="task-capability-body"><div class="task-history">${history.length?history.slice(0,40).map(x=>`<div class="task-history-item"><span><strong>${escapeHtml(x.label)}</strong><small>${escapeHtml(formatDate(x.time))}</small></span><p>${escapeHtml(String(x.detail).slice(0,360))}</p></div>`).join(""):`<span class="help-text">还没有分析或专注记录。</span>`}</div></div>
        </details>
      </div>`;

      const saveFields = (silent=false) => {
        const fresh = taskData(), current = taskById(fresh,id);
        if (!current) return null;
        current.title = $("#taskTitle",root).value.trim() || current.title;
        const outcome = $("#taskOutcome",root), next = $("#taskNext",root), estimate = $("#taskEstimate",root), planned = $("#taskPlanned",root), priority = $("#taskPriority",root), obstacle = $("#taskObstacle",root), ifThen = $("#taskIfThen",root), note = $("#taskNote",root);
        if (outcome) current.outcome = outcome.value.trim();
        if (next) current.nextAction = next.value.trim();
        if (estimate) current.estimateMinutes = Math.max(0,Number(estimate.value)||0) || null;
        if (planned) current.plannedAt = planned.value ? Date.parse(planned.value) : null;
        if (priority) current.priority = priority.value;
        if (obstacle) current.obstacle = obstacle.value.trim();
        if (ifThen) current.ifThen = ifThen.value.trim();
        if (note) current.note = note.value.trim();
        current.updatedAt = now();
        saveTaskData(fresh);
        render();
        if (!silent) toast("已保存");
        return current;
      };

      $("#taskTitle",root).addEventListener("change",()=>saveFields(true));
      $("#taskSave",root)?.addEventListener("click",()=>{saveFields();openTask(id);});
      $("#taskToggle",root).onclick = () => { saveFields(true); toggleTask(id); openTask(id); };
      $("#taskDelete",root).onclick = () => {
        if (!confirm("删除这条待办？历史记录会保留 taskId，但待办本身将不再显示。")) return;
        const fresh=taskData(), current=taskById(fresh,id);
        if (current) { current.deletedAt=now(); current.updatedAt=now(); saveTaskData(fresh); }
        Toolbox.closeDialog(); render();
      };

      if (task.status==="done") {
        $("#taskReflectionSave",root)?.addEventListener("click",()=>{
          const fresh=taskData(), current=taskById(fresh,id);
          if (!current) return;
          const result=$("#taskReflectResult",root).value.trim(), learned=$("#taskReflectLearn",root).value.trim(), nextTime=$("#taskReflectNext",root).value.trim();
          const createdAt=now(), existingId=current.reflection?.activityId||uid("r");
          current.reflection={result,learned,nextTime,updatedAt:createdAt,activityId:existingId};
          current.updatedAt=createdAt;
          const content=`实际结果：${result||"（未填写）"}\n偏差 / 学习：${learned||"（未填写）"}\n下次调整：${nextTime||"（未填写）"}`;
          const existing=fresh.activities.find(x=>x?.id===existingId);
          if (existing) { existing.content=content; existing.createdAt=createdAt; }
          else fresh.activities.unshift({id:existingId,taskId:id,type:"reflection",toolId:"task-reflection",toolName:"完成复盘",content,createdAt});
          saveTaskData(fresh); toast("复盘已保存"); render(); openTask(id);
        });
      }

      root.addEventListener("click",e=>{
        const btn=e.target.closest("[data-task-tool]");
        if (!btn) return;
        const current=saveFields(true)||taskById(taskData(),id);
        openTool(btn.dataset.taskTool,{taskId:id,task:{...current}});
      });
    });
  };

  const start = () => {
    ui = { input:$("#taskInput"), add:$("#addTaskBtn"), list:$("#taskList"), count:$("#taskCount"), openBtn:$("#taskFilterOpen"), doneBtn:$("#taskFilterDone"), matrixBtn:$("#taskFilterMatrix") };
    if (!ui.input || !ui.list) return;
    ui.add.onclick = addTask;
    ui.input.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();addTask();}});
    ui.openBtn.onclick=()=>{filter="open";render();};
    ui.doneBtn.onclick=()=>{filter="done";render();};
    ui.matrixBtn.onclick=()=>{filter="matrix";render();};
    ui.list.addEventListener("click",e=>{
      const toggle=e.target.closest("[data-task-toggle]");
      if (toggle){toggleTask(toggle.dataset.taskToggle);return;}
      const open=e.target.closest("[data-task-open]");
      if (open) openTask(open.dataset.taskOpen);
    });
    Toolbox.openTask = openTask;
    render();
  };

  document.addEventListener("DOMContentLoaded",start,{once:true});
})();