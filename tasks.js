(() => {
  "use strict";
  const { storage, $, escapeHtml, openTool, openPanel, toast } = Toolbox;

  const now = () => Date.now();
  const uid = prefix => crypto.randomUUID?.() || `${prefix || "id"}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const normalizeTask = task => ({
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
    reflection: task.reflection && typeof task.reflection === "object" ? task.reflection : null
  });
  const taskData = () => {
    const raw = storage.get("tasks", {}) || {};
    return {
      items: Array.isArray(raw.items) ? raw.items.map(normalizeTask) : [],
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
  const formatDate = value => value ? new Date(value).toLocaleString() : "";
  const formatShortDate = value => value ? new Date(value).toLocaleString([], {month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "";
  const toLocalInput = value => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const local = new Date(d.getTime() - d.getTimezoneOffset()*60000);
    return local.toISOString().slice(0,16);
  };

  const taskStats = id => {
    const pomodoro = storage.get("tools.pomodoro.history", []) || [];
    const focus = storage.get("tools.focuslog.sessions", []) || [];
    const data = taskData();
    const p = Array.isArray(pomodoro) ? pomodoro.filter(x => x?.taskId === id) : [];
    const f = Array.isArray(focus) ? focus.filter(x => x?.taskId === id) : [];
    const pomodoroMs = p.reduce((sum,x) => sum + (Number(x.minutes)||0)*60000, 0);
    const focusMs = f.reduce((sum,x) => sum + (Number(x.durationMs)||durationTextToMs(x.duration)), 0);
    const thoughtCount = data.activities.filter(x => x?.taskId === id && x.type === "analysis").length;
    const reflectionCount = data.activities.filter(x => x?.taskId === id && x.type === "reflection").length;
    return { pomodoros:p.length, pomodoroMs, focusMs, totalMs:pomodoroMs+focusMs, thoughtCount, reflectionCount };
  };

  const guideFor = (task, stats) => {
    if (task.status === "done" && !task.reflection) return "完成了。趁记忆还清楚：实际结果和原先预期有什么差异？下次会改什么？";
    if (!task.outcome.trim()) return "先定义“完成”。完成这件事时，你能看到什么具体、可验证的结果？";
    if (!task.nextAction.trim()) return "把它压缩成一个可以直接开始的动作。最好小到 5–30 分钟内就能启动。";
    if (!task.estimateMinutes) return "先估一下下一步需要多久。之后再和实际投入比较，逐渐校准自己的时间判断。";
    if (!task.plannedAt) return "事情已经比较清楚了。给它一个具体开始时间，比继续放在待办列表里更容易真正发生。";
    if (task.obstacle.trim() && !task.ifThen.trim()) return "你已经知道主要障碍了。把它写成 If–Then：如果障碍出现，那么我就采取什么动作？";
    if (task.estimateMinutes && stats.totalMs > task.estimateMinutes*60000*1.5) return `实际专注投入已经达到 ${compactDuration(stats.totalMs)}，明显高于原先估计的 ${task.estimateMinutes} 分钟。要不要重新拆解，或更新你的估时模型？`;
    if (!stats.totalMs) return `下一步已经明确：“${task.nextAction}”。现在最有价值的是开始一次专注，而不是继续规划。`;
    return "继续执行。完成后再比较：原来的预期、实际过程和最终结果之间，哪里出现了偏差？";
  };

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
      const action = task.nextAction ? `下一步：${task.nextAction}` : "还没定义下一步";
      const timing = task.plannedAt ? ` · ${formatShortDate(task.plannedAt)}` : "";
      const effort = stats.totalMs ? ` · ${compactDuration(stats.totalMs)}` : "";
      return `<article class="task-row ${task.status === "done" ? "is-done" : ""}">
        <button class="task-check" data-task-toggle="${escapeHtml(task.id)}" type="button" aria-label="${task.status === "done" ? "重新打开" : "完成"}">${task.status === "done" ? "✓" : ""}</button>
        <button class="task-main" data-task-open="${escapeHtml(task.id)}" type="button">
          <strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(action + timing + effort)}</span>
        </button>
      </article>`;
    }).join("") : `<div class="task-empty">${filter === "done" ? "还没有已完成事项。" : "把最近想做的一件事写下来。"}</div>`;
  };

  const addTask = () => {
    const title = ui.input.value.trim();
    if (!title) return;
    const data = taskData(), ts = now();
    data.items.push(normalizeTask({ id:uid("t"), title, createdAt:ts, updatedAt:ts }));
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
    const rows = data.activities.filter(x => x?.taskId === taskId).map(x => ({
      time:x.createdAt||0,
      label:x.type === "reflection" ? "完成复盘" : (x.toolName||"思维分析"),
      detail:x.content||"",
      kind:x.type||"analysis"
    }));
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
    openPanel({ icon:"✓", title:task.title, desc:"先澄清，再行动；需要时调用方法，执行和复盘都留在这件事下面。" }, root => {
      const history = historyRows(id);
      const actualMinutes = Math.round(stats.totalMs/60000);
      root.innerHTML = `<div class="editor-stack task-detail">
        <div class="meta-guide"><span>现在最值得问</span><strong>${escapeHtml(guideFor(task,stats))}</strong></div>

        <div class="task-action-group"><h3>1 · 澄清这件事</h3>
          <div class="field"><label>待办事项</label><input id="taskTitle" class="text-input" value="${escapeHtml(task.title)}"></div>
          <div class="field"><label>完成标准 · 什么结果算真的完成？</label><textarea id="taskOutcome" class="input-area mini-area" placeholder="写一个可观察、可验收的结果">${escapeHtml(task.outcome||"")}</textarea></div>
          <div class="field"><label>下一步动作 · 接下来具体做什么？</label><input id="taskNext" class="text-input" placeholder="例如：打开文档，先写出三个一级标题" value="${escapeHtml(task.nextAction||"")}"></div>
          <div class="two-col"><div class="field"><label>预计用时（分钟）</label><input id="taskEstimate" class="text-input" type="number" min="1" max="1440" placeholder="30" value="${task.estimateMinutes||""}"></div><div class="field"><label>计划开始时间</label><input id="taskPlanned" class="text-input" type="datetime-local" value="${escapeHtml(toLocalInput(task.plannedAt))}"></div></div>
        </div>

        <div class="task-action-group"><h3>2 · 提前处理阻碍</h3>
          <div class="field"><label>最可能阻碍我开始或完成的是什么？</label><input id="taskObstacle" class="text-input" placeholder="例如：一打开电脑就先处理消息" value="${escapeHtml(task.obstacle||"")}"></div>
          <div class="field"><label>If–Then 应对</label><input id="taskIfThen" class="text-input" placeholder="如果……发生，那么我就……" value="${escapeHtml(task.ifThen||"")}"></div>
          <div class="field"><label>背景 / 限制条件</label><textarea id="taskNote" class="input-area mini-area" placeholder="必要背景、约束、参考信息……">${escapeHtml(task.note||"")}</textarea></div>
        </div>

        <div class="toolbar"><button id="taskSave" class="primary-btn" type="button">保存计划</button><button id="taskToggle" class="secondary-btn" type="button">${task.status === "done" ? "重新打开" : "完成并复盘"}</button><button id="taskDelete" class="danger-btn" type="button">删除</button></div>

        <div class="metrics task-metrics"><div class="metric"><strong>${task.estimateMinutes||"—"}</strong><span>预计分钟</span></div><div class="metric"><strong>${actualMinutes||0}</strong><span>实际专注分钟</span></div><div class="metric"><strong>${stats.pomodoros}</strong><span>完成番茄</span></div><div class="metric"><strong>${stats.thoughtCount}</strong><span>已保存分析</span></div></div>

        <div class="task-action-group"><h3>3 · 需要时再深入思考</h3><div class="task-action-grid">
          <button data-task-tool="taskbreak" class="secondary-btn" type="button">继续拆解</button><button data-task-tool="premortem" class="secondary-btn" type="button">事前风险</button><button data-task-tool="decision" class="secondary-btn" type="button">比较方案</button><button data-task-tool="fivewhys" class="secondary-btn" type="button">原因探索</button><button data-task-tool="review" class="secondary-btn" type="button">阶段复盘</button><button data-task-tool="feynman" class="secondary-btn" type="button">解释与学习</button>
        </div></div>

        <div class="task-action-group"><h3>4 · 开始执行</h3><div class="task-action-grid"><button data-task-tool="pomodoro" class="primary-btn" type="button">开始番茄钟</button><button data-task-tool="focuslog" class="secondary-btn" type="button">深度工作计时</button></div></div>

        ${task.status === "done" ? `<div class="task-action-group reflection-card"><h3>5 · 完成后复盘</h3><div class="field"><label>实际结果</label><textarea id="taskReflectResult" class="input-area mini-area" placeholder="最后实际发生了什么？">${escapeHtml(task.reflection?.result||"")}</textarea></div><div class="field"><label>最大的偏差 / 学到什么</label><textarea id="taskReflectLearn" class="input-area mini-area" placeholder="和原先预期相比，哪里判断错了或做对了？">${escapeHtml(task.reflection?.learned||"")}</textarea></div><div class="field"><label>下次遇到类似事情，我会怎么做</label><input id="taskReflectNext" class="text-input" value="${escapeHtml(task.reflection?.nextTime||"")}"></div><button id="taskReflectionSave" class="primary-btn" type="button">保存完成复盘</button></div>` : ""}

        <div class="field"><label>这件事的历史</label><div class="task-history">${history.length ? history.slice(0,40).map(x=>`<div class="task-history-item"><span><strong>${escapeHtml(x.label)}</strong><small>${escapeHtml(formatDate(x.time))}</small></span><p>${escapeHtml(String(x.detail).slice(0,360))}</p></div>`).join("") : `<span class="help-text">还没有分析或专注记录。</span>`}</div></div>
      </div>`;

      const saveFields = (silent=false) => {
        const fresh = taskData(), current = taskById(fresh,id);
        if (!current) return null;
        current.title = $("#taskTitle",root).value.trim() || current.title;
        current.outcome = $("#taskOutcome",root).value.trim();
        current.nextAction = $("#taskNext",root).value.trim();
        current.estimateMinutes = Math.max(0, Number($("#taskEstimate",root).value)||0) || null;
        current.plannedAt = $("#taskPlanned",root).value ? Date.parse($("#taskPlanned",root).value) : null;
        current.obstacle = $("#taskObstacle",root).value.trim();
        current.ifThen = $("#taskIfThen",root).value.trim();
        current.note = $("#taskNote",root).value.trim();
        current.updatedAt = now();
        saveTaskData(fresh);
        render();
        if (!silent) toast("已保存");
        return current;
      };

      $("#taskSave",root).onclick=()=>{saveFields();openTask(id);};
      $("#taskToggle",root).onclick=()=>{saveFields(true);toggleTask(id);openTask(id);};
      $("#taskDelete",root).onclick=()=>{if(!confirm("删除这条待办？历史记录会保留 taskId，但待办本身将不再显示。"))return;const fresh=taskData(),current=taskById(fresh,id);if(current){current.deletedAt=now();current.updatedAt=now();saveTaskData(fresh);}Toolbox.closeDialog();render();};

      if (task.status === "done") {
        $("#taskReflectionSave",root).onclick=()=>{
          const fresh=taskData(),current=taskById(fresh,id);if(!current)return;
          const result=$("#taskReflectResult",root).value.trim(), learned=$("#taskReflectLearn",root).value.trim(), nextTime=$("#taskReflectNext",root).value.trim();
          const createdAt=now(), existingId=current.reflection?.activityId||uid("r");
          current.reflection={result,learned,nextTime,updatedAt:createdAt,activityId:existingId};current.updatedAt=createdAt;
          const content=`实际结果：${result||"（未填写）"}\n偏差 / 学习：${learned||"（未填写）"}\n下次调整：${nextTime||"（未填写）"}`;
          const existing=fresh.activities.find(x=>x?.id===existingId);
          if(existing){existing.content=content;existing.createdAt=createdAt;}else{fresh.activities.unshift({id:existingId,taskId:id,type:"reflection",toolId:"task-reflection",toolName:"完成复盘",content,createdAt});}
          saveTaskData(fresh);toast("复盘已保存");render();openTask(id);
        };
      }

      root.addEventListener("click", e=>{
        const btn=e.target.closest("[data-task-tool]");if(!btn)return;
        const current=saveFields(true)||taskById(taskData(),id);
        openTool(btn.dataset.taskTool,{taskId:id,task:{...current}});
      });
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
