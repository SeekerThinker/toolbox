(() => {
  "use strict";
  const { storage, $, escapeHtml, toast } = Toolbox;
  const now = () => Date.now();
  const uid = prefix => crypto.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const DAY = 86400000;

  const localDayKey = value => {
    const d = value instanceof Date ? value : new Date(value || Date.now());
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const startOfDay = value => { const d = new Date(value); d.setHours(0,0,0,0); return d; };
  const rangeFor = (type, cursor) => {
    const d = startOfDay(cursor);
    let start, end, key, label;
    if (type === "day") {
      start = d; end = new Date(d); end.setDate(end.getDate()+1);
      key = localDayKey(start); label = `${start.getFullYear()}年${start.getMonth()+1}月${start.getDate()}日`;
    } else if (type === "week") {
      start = new Date(d); start.setDate(start.getDate()-((start.getDay()+6)%7));
      end = new Date(start); end.setDate(end.getDate()+7);
      key = localDayKey(start);
      const last = new Date(end); last.setDate(last.getDate()-1);
      label = `${start.getMonth()+1}月${start.getDate()}日 – ${last.getMonth()+1}月${last.getDate()}日`;
    } else if (type === "month") {
      start = new Date(d.getFullYear(),d.getMonth(),1); end = new Date(d.getFullYear(),d.getMonth()+1,1);
      key = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}`; label = `${start.getFullYear()}年${start.getMonth()+1}月`;
    } else {
      start = new Date(d.getFullYear(),0,1); end = new Date(d.getFullYear()+1,0,1);
      key = String(start.getFullYear()); label = `${start.getFullYear()}年`;
    }
    return { type, start:start.getTime(), end:end.getTime(), key, label };
  };
  const shiftCursor = (type, cursor, delta) => {
    const d = new Date(cursor);
    if (type === "day") d.setDate(d.getDate()+delta);
    else if (type === "week") d.setDate(d.getDate()+delta*7);
    else if (type === "month") d.setMonth(d.getMonth()+delta);
    else d.setFullYear(d.getFullYear()+delta);
    return d;
  };

  const planningData = () => {
    const raw = storage.get("planning", {}) || {};
    const periods = raw.periods && typeof raw.periods === "object" ? raw.periods : {};
    return {
      periods: {
        day: periods.day && typeof periods.day === "object" ? periods.day : {},
        week: periods.week && typeof periods.week === "object" ? periods.week : {},
        month: periods.month && typeof periods.month === "object" ? periods.month : {},
        year: periods.year && typeof periods.year === "object" ? periods.year : {}
      },
      goals: Array.isArray(raw.goals) ? raw.goals.map(g=>({ ...g, taskIds:Array.isArray(g?.taskIds)?g.taskIds:[] })) : [],
      checkins: Array.isArray(raw.checkins) ? raw.checkins : []
    };
  };
  const savePlanning = data => storage.set("planning", data);
  const taskItems = () => { const v=storage.get("tasks.items",[]); return Array.isArray(v)?v.filter(x=>x&&!x.deletedAt):[]; };
  const pomodoros = () => { const v=storage.get("tools.pomodoro.history",[]); return Array.isArray(v)?v:[]; };
  const focusSessions = () => { const v=storage.get("tools.focuslog.sessions",[]); return Array.isArray(v)?v:[]; };
  const sessionTime = s => Number(s?.endedAt) || Date.parse(s?.date||"") || Number(s?.startedAt) || 0;
  const sessionMinutes = s => Number(s?.minutes) || Math.round((Number(s?.durationMs)||0)/60000) || 0;
  const inRange = (time, range) => Number(time)>=range.start && Number(time)<range.end;
  const formatMinutes = value => {
    const m = Math.max(0,Math.round(Number(value)||0));
    if (m < 60) return `${m}`;
    const h=Math.floor(m/60),r=m%60; return r?`${h}h ${r}m`:`${h}h`;
  };

  const actualsFor = (range, planning) => {
    const tasks = taskItems();
    const completed = tasks.filter(t=>inRange(t.completedAt,range));
    const p = pomodoros().filter(x=>inRange(x.endedAt,range));
    const f = focusSessions().filter(x=>inRange(sessionTime(x),range));
    const focusMinutes = p.reduce((s,x)=>s+(Number(x.minutes)||0),0)+f.reduce((s,x)=>s+sessionMinutes(x),0);
    const checkins = planning.checkins.filter(x=>inRange(x.createdAt,range));
    return { completed, focusMinutes, checkins };
  };

  let view = "week";
  const cursors = { day:new Date(), week:new Date(), month:new Date(), year:new Date() };
  let mount;

  const tabsHtml = () => `<div class="horizon-tabs">
    ${[["day","日"],["week","周"],["month","月"],["year","年"],["goals","目标"],["insights","洞察"]].map(([id,label])=>`<button class="mini-btn ${view===id?"active":""}" data-horizon-tab="${id}" type="button">${label}</button>`).join("")}
  </div>`;

  const periodView = type => {
    const planning = planningData(), range = rangeFor(type,cursors[type]), record = planning.periods[type][range.key] || {};
    const actual = actualsFor(range,planning);
    return `${tabsHtml()}<div class="horizon-period-head"><div><strong>${escapeHtml(range.label)}</strong><span>${type==="day"?"日计划":type==="week"?"周计划":type==="month"?"月计划":"年计划"}</span></div><div class="toolbar"><button class="mini-btn" data-period-shift="-1" type="button">←</button><button class="mini-btn" data-period-today type="button">当前</button><button class="mini-btn" data-period-shift="1" type="button">→</button></div></div>
      <div class="horizon-metrics"><div class="metric"><strong>${actual.completed.length}</strong><span>完成任务</span></div><div class="metric"><strong>${formatMinutes(actual.focusMinutes)}</strong><span>专注分钟</span></div><div class="metric"><strong>${actual.checkins.length}</strong><span>目标打卡</span></div></div>
      <div class="horizon-form">
        <div class="field"><label>这个周期最重要的方向 / 结果</label><input id="periodFocus" class="text-input" value="${escapeHtml(record.focus||"")}" placeholder="只写真正重要的 1–2 件事也可以"></div>
        <div class="field"><label>计划 / 提醒</label><textarea id="periodIntentions" class="input-area mini-area" placeholder="可留空；需要时再写">${escapeHtml(record.intentions||"")}</textarea></div>
        <div class="field"><label>回顾 / 调整</label><textarea id="periodReview" class="input-area mini-area" placeholder="周期结束后再补，也可以完全不写">${escapeHtml(record.review||"")}</textarea></div>
        <div class="toolbar"><button id="savePeriod" class="secondary-btn" type="button">保存这个周期</button></div>
      </div>
      ${actual.completed.length?`<div class="horizon-facts"><span>本周期已完成</span>${actual.completed.slice(0,8).map(t=>`<button data-open-task="${escapeHtml(t.id)}" type="button">${escapeHtml(t.title)}</button>`).join("")}</div>`:""}`;
  };

  const goalStats = (goal, planning) => {
    const linked = taskItems().filter(t=>goal.taskIds.includes(t.id));
    const done = linked.filter(t=>t.status==="done").length;
    const todayKey = localDayKey(new Date());
    const today = planning.checkins.find(x=>x.goalId===goal.id&&x.dayKey===todayKey) || null;
    const since = Date.now()-7*DAY;
    const last7 = planning.checkins.filter(x=>x.goalId===goal.id&&x.createdAt>=since).length;
    const total = planning.checkins.filter(x=>x.goalId===goal.id).length;
    return { linked, done, today, last7, total };
  };

  const goalsView = () => {
    const planning = planningData(), goals = planning.goals.filter(g=>!g.archivedAt), tasks = taskItems().filter(t=>t.status!=="done");
    return `${tabsHtml()}<div class="goal-create"><input id="goalTitle" class="text-input" placeholder="新增一个长期目标，例如：稳定运动、完成论文、找到新工作"><button id="addGoal" class="primary-btn" type="button">添加目标</button></div>
      <div class="goal-list">${goals.length?goals.map(goal=>{const s=goalStats(goal,planning),available=tasks.filter(t=>!goal.taskIds.includes(t.id));return `<article class="goal-card"><div class="goal-card-head"><div><strong>${escapeHtml(goal.title)}</strong><span>近 7 天 ${s.last7} 次 · 累计 ${s.total} 次${s.linked.length?` · 关联任务 ${s.done}/${s.linked.length}`:""}</span></div><button class="mini-btn ${s.today?"active":""}" data-goal-check="${escapeHtml(goal.id)}" type="button">${s.today?"今日已打卡":"今日打卡"}</button></div>
        <details><summary>关联任务 <span>${s.linked.length} 项</span></summary><div class="goal-links">${s.linked.length?s.linked.map(t=>`<div><button data-open-task="${escapeHtml(t.id)}" type="button">${escapeHtml(t.title)}</button><button class="mini-btn" data-goal-unlink="${escapeHtml(goal.id)}" data-task-id="${escapeHtml(t.id)}" type="button">移除</button></div>`).join(""):"<span class='help-text'>可以关联，也可以不关联任何任务。</span>"}<div class="goal-link-add"><select class="select-input" data-goal-task-select="${escapeHtml(goal.id)}"><option value="">选择一个待办…</option>${available.map(t=>`<option value="${escapeHtml(t.id)}">${escapeHtml(t.title)}</option>`).join("")}</select><button class="secondary-btn" data-goal-link="${escapeHtml(goal.id)}" type="button">关联</button></div></div></details>
        <button class="goal-archive" data-goal-archive="${escapeHtml(goal.id)}" type="button">归档目标</button></article>`;}).join(""):"<div class='task-empty'>还没有目标。目标也是可选层；没有目标时，任务系统照常使用。</div>"}</div>`;
  };

  const median = values => {
    if (!values.length) return null;
    const arr=[...values].sort((a,b)=>a-b),mid=Math.floor(arr.length/2);
    return arr.length%2?arr[mid]:(arr[mid-1]+arr[mid])/2;
  };
  const taskEffortMap = () => {
    const map = new Map();
    pomodoros().forEach(x=>{if(x?.taskId)map.set(x.taskId,(map.get(x.taskId)||0)+(Number(x.minutes)||0));});
    focusSessions().forEach(x=>{if(x?.taskId)map.set(x.taskId,(map.get(x.taskId)||0)+sessionMinutes(x));});
    return map;
  };
  const insightsView = () => {
    const planning=planningData(),tasks=taskItems(),effort=taskEffortMap(),nowTs=Date.now(),since7=nowTs-7*DAY,since30=nowTs-30*DAY;
    const completed7=tasks.filter(t=>Number(t.completedAt)>=since7).length,completed30=tasks.filter(t=>Number(t.completedAt)>=since30).length;
    const focus7=[...pomodoros().filter(x=>Number(x.endedAt)>=since7).map(x=>Number(x.minutes)||0),...focusSessions().filter(x=>sessionTime(x)>=since7).map(sessionMinutes)].reduce((a,b)=>a+b,0);
    const focus30=[...pomodoros().filter(x=>Number(x.endedAt)>=since30).map(x=>Number(x.minutes)||0),...focusSessions().filter(x=>sessionTime(x)>=since30).map(sessionMinutes)].reduce((a,b)=>a+b,0);
    const estimateSamples=tasks.filter(t=>t.estimateMinutes&&effort.get(t.id)>0).map(t=>({task:t,ratio:effort.get(t.id)/t.estimateMinutes}));
    const ratio=median(estimateSamples.map(x=>x.ratio));
    const obstacles=new Map();
    tasks.forEach(t=>{const text=String(t.obstacle||"").trim();if(!text)return;const key=text.toLowerCase();const item=obstacles.get(key)||{text,count:0};item.count++;obstacles.set(key,item);});
    const repeated=[...obstacles.values()].filter(x=>x.count>=2).sort((a,b)=>b.count-a.count).slice(0,4);
    const decisions=storage.get("tools.decision.history",[])||[];
    const today=localDayKey(new Date());
    const dueDecisions=Array.isArray(decisions)?decisions.filter(x=>x?.reviewAt&&x.reviewAt<=today).length:0;
    const completed=tasks.filter(t=>t.status==="done"),reflected=completed.filter(t=>t.reflection).length;
    const goalChecks7=planning.checkins.filter(x=>x.createdAt>=since7).length;
    const observations=[];
    if (estimateSamples.length>=3 && ratio!=null) {
      if (ratio>1.25) observations.push(`你有 ${estimateSamples.length} 个可比较的估时样本；中位“累计专注 / 当前估时”约为 ${ratio.toFixed(1)}×，记录里存在偏低估的迹象。`);
      else if (ratio<0.8) observations.push(`你有 ${estimateSamples.length} 个可比较的估时样本；中位“累计专注 / 当前估时”约为 ${ratio.toFixed(1)}×，记录里存在偏高估的迹象。`);
      else observations.push(`你有 ${estimateSamples.length} 个可比较的估时样本；中位“累计专注 / 当前估时”约为 ${ratio.toFixed(1)}×。`);
    } else observations.push("估时样本还不够多；有 3 个以上“估时 + 实际专注”任务后，再看趋势会更有意义。");
    if (repeated.length) observations.push(`重复出现的障碍：${repeated.map(x=>`${x.text}（${x.count} 次）`).join("、")}。这是值得优先验证的模式，不等于已经找到原因。`);
    if (dueDecisions) observations.push(`有 ${dueDecisions} 条 Decision Journal 已到或超过回看日期，可以检查当时的置信度和实际结果。`);
    if (completed.length>=5 && reflected/completed.length<0.25) observations.push(`已完成 ${completed.length} 个任务，其中 ${reflected} 个保存了完成复盘。复盘不必覆盖所有任务，只挑真正值得学习的任务即可。`);
    if (!repeated.length && !dueDecisions && estimateSamples.length<3) observations.push("目前还没有明显的跨任务模式。继续正常使用即可，不需要为了“产生洞察”而额外填数据。");
    return `${tabsHtml()}<div class="horizon-metrics insight-metrics"><div class="metric"><strong>${completed7}</strong><span>近 7 天完成</span></div><div class="metric"><strong>${formatMinutes(focus7)}</strong><span>近 7 天专注分钟</span></div><div class="metric"><strong>${goalChecks7}</strong><span>近 7 天目标打卡</span></div><div class="metric"><strong>${dueDecisions}</strong><span>待回看决策</span></div></div>
      <div class="insight-list">${observations.map(text=>`<div class="insight-item">${escapeHtml(text)}</div>`).join("")}</div>
      <div class="horizon-facts"><span>30 天事实</span><p>完成任务 ${completed30} 个 · 专注 ${formatMinutes(focus30)} 分钟 · 已完成任务复盘 ${reflected}/${completed.length||0}</p></div>`;
  };

  const render = () => {
    if (!mount) return;
    mount.innerHTML = view==="goals"?goalsView():view==="insights"?insightsView():periodView(view);
    bind();
  };

  const bind = () => {
    mount.querySelectorAll("[data-horizon-tab]").forEach(btn=>btn.onclick=()=>{view=btn.dataset.horizonTab;render();});
    mount.querySelectorAll("[data-open-task]").forEach(btn=>btn.onclick=()=>Toolbox.openTask?.(btn.dataset.openTask));
    mount.querySelectorAll("[data-period-shift]").forEach(btn=>btn.onclick=()=>{cursors[view]=shiftCursor(view,cursors[view],Number(btn.dataset.periodShift));render();});
    mount.querySelector("[data-period-today]")?.addEventListener("click",()=>{cursors[view]=new Date();render();});
    mount.querySelector("#savePeriod")?.addEventListener("click",()=>{
      const data=planningData(),range=rangeFor(view,cursors[view]);
      data.periods[view][range.key]={focus:$("#periodFocus",mount).value.trim(),intentions:$("#periodIntentions",mount).value.trim(),review:$("#periodReview",mount).value.trim(),updatedAt:now()};
      savePlanning(data);toast("周期计划已保存");
    });
    mount.querySelector("#addGoal")?.addEventListener("click",()=>{
      const input=$("#goalTitle",mount),title=input.value.trim();if(!title)return;
      const data=planningData();data.goals.unshift({id:uid("g"),title,taskIds:[],createdAt:now(),updatedAt:now(),archivedAt:null});savePlanning(data);render();toast("目标已添加");
    });
    mount.querySelectorAll("[data-goal-check]").forEach(btn=>btn.onclick=()=>{
      const data=planningData(),goalId=btn.dataset.goalCheck,dayKey=localDayKey(new Date());
      const existing=data.checkins.findIndex(x=>x.goalId===goalId&&x.dayKey===dayKey);
      if(existing>=0)data.checkins.splice(existing,1);else data.checkins.unshift({id:uid("c"),goalId,dayKey,createdAt:now()});
      savePlanning(data);render();toast(existing>=0?"已取消今日打卡":"今日已打卡");
    });
    mount.querySelectorAll("[data-goal-link]").forEach(btn=>btn.onclick=()=>{
      const goalId=btn.dataset.goalLink,select=mount.querySelector(`[data-goal-task-select="${CSS.escape(goalId)}"]`),taskId=select?.value;if(!taskId)return;
      const data=planningData(),goal=data.goals.find(x=>x.id===goalId);if(!goal)return;if(!goal.taskIds.includes(taskId))goal.taskIds.push(taskId);goal.updatedAt=now();savePlanning(data);render();
    });
    mount.querySelectorAll("[data-goal-unlink]").forEach(btn=>btn.onclick=()=>{
      const data=planningData(),goal=data.goals.find(x=>x.id===btn.dataset.goalUnlink);if(!goal)return;goal.taskIds=goal.taskIds.filter(id=>id!==btn.dataset.taskId);goal.updatedAt=now();savePlanning(data);render();
    });
    mount.querySelectorAll("[data-goal-archive]").forEach(btn=>btn.onclick=()=>{
      const data=planningData(),goal=data.goals.find(x=>x.id===btn.dataset.goalArchive);if(!goal)return;goal.archivedAt=now();goal.updatedAt=now();savePlanning(data);render();toast("目标已归档");
    });
  };

  const start = () => {
    mount = $("#horizonMount");
    if (!mount) return;
    render();
  };
  document.addEventListener("DOMContentLoaded",start,{once:true});
})();
