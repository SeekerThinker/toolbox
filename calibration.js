(() => {
  "use strict";
  const { storage, $, escapeHtml, toast } = Toolbox;
  const DAY = 86400000;
  const now = () => Date.now();
  const localDayKey = value => {
    const d = value instanceof Date ? value : new Date(value || Date.now());
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const startOfDay = value => { const d=new Date(value); d.setHours(0,0,0,0); return d; };
  const rangeFor = (type, value=new Date()) => {
    const d=startOfDay(value); let start,end,key,label;
    if(type==="day"){start=d;end=new Date(d);end.setDate(end.getDate()+1);key=localDayKey(start);label=`${start.getMonth()+1}月${start.getDate()}日`;}
    else if(type==="week"){start=new Date(d);start.setDate(start.getDate()-((start.getDay()+6)%7));end=new Date(start);end.setDate(end.getDate()+7);key=localDayKey(start);const last=new Date(end);last.setDate(last.getDate()-1);label=`${start.getMonth()+1}月${start.getDate()}日–${last.getMonth()+1}月${last.getDate()}日`;}
    else if(type==="month"){start=new Date(d.getFullYear(),d.getMonth(),1);end=new Date(d.getFullYear(),d.getMonth()+1,1);key=`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}`;label=`${start.getFullYear()}年${start.getMonth()+1}月`;}
    else {start=new Date(d.getFullYear(),0,1);end=new Date(d.getFullYear()+1,0,1);key=String(start.getFullYear());label=`${start.getFullYear()}年`;}
    return {type,start:start.getTime(),end:end.getTime(),key,label};
  };
  const inRange=(time,range)=>Number(time)>=range.start&&Number(time)<range.end;
  const formatMinutes=value=>{const m=Math.max(0,Math.round(Number(value)||0));if(m<60)return `${m} 分钟`;const h=Math.floor(m/60),r=m%60;return r?`${h} 小时 ${r} 分钟`:`${h} 小时`;};
  const median=values=>{if(!values.length)return null;const a=[...values].sort((x,y)=>x-y),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};

  const tasks=()=>{const v=storage.get("tasks.items",[]);return Array.isArray(v)?v.filter(x=>x&&!x.deletedAt):[];};
  const pomodoros=()=>{const v=storage.get("tools.pomodoro.history",[]);return Array.isArray(v)?v:[];};
  const focusSessions=()=>{const v=storage.get("tools.focuslog.sessions",[]);return Array.isArray(v)?v:[];};
  const decisions=()=>{const v=storage.get("tools.decision.history",[]);return Array.isArray(v)?v:[];};
  const sessionTime=s=>Number(s?.endedAt)||Date.parse(s?.date||"")||Number(s?.startedAt)||0;
  const sessionMinutes=s=>Number(s?.minutes)||Math.round((Number(s?.durationMs)||0)/60000)||0;
  const planningData=()=>{
    const raw=storage.get("planning",{})||{},periods=raw.periods&&typeof raw.periods==="object"?raw.periods:{};
    return {
      periods:{day:periods.day||{},week:periods.week||{},month:periods.month||{},year:periods.year||{}},
      goals:Array.isArray(raw.goals)?raw.goals.map(g=>({...g,taskIds:Array.isArray(g?.taskIds)?g.taskIds:[],targetPerWeek:Number(g?.targetPerWeek)>0?Math.min(7,Math.max(1,Number(g.targetPerWeek))):null})):[],
      checkins:Array.isArray(raw.checkins)?raw.checkins:[]
    };
  };
  const savePlanning=data=>storage.set("planning",data);

  const effortMap=()=>{
    const map=new Map();
    pomodoros().forEach(x=>{if(x?.taskId)map.set(x.taskId,(map.get(x.taskId)||0)+(Number(x.minutes)||0));});
    focusSessions().forEach(x=>{if(x?.taskId)map.set(x.taskId,(map.get(x.taskId)||0)+sessionMinutes(x));});
    return map;
  };
  const effortInRange=(taskIds,range)=>{
    const ids=new Set(taskIds);
    return pomodoros().filter(x=>ids.has(x?.taskId)&&inRange(x.endedAt,range)).reduce((s,x)=>s+(Number(x.minutes)||0),0)+focusSessions().filter(x=>ids.has(x?.taskId)&&inRange(sessionTime(x),range)).reduce((s,x)=>s+sessionMinutes(x),0);
  };
  const actuals=range=>{
    const p=pomodoros().filter(x=>inRange(x.endedAt,range)),f=focusSessions().filter(x=>inRange(sessionTime(x),range)),planning=planningData();
    return {
      completed:tasks().filter(t=>inRange(t.completedAt,range)),
      focusMinutes:p.reduce((s,x)=>s+(Number(x.minutes)||0),0)+f.reduce((s,x)=>s+sessionMinutes(x),0),
      checkins:planning.checkins.filter(x=>inRange(x.createdAt,range))
    };
  };
  const estimateStats=()=>{
    const effort=effortMap(),samples=tasks().filter(t=>t.status==="done"&&t.estimateMinutes&&effort.get(t.id)>0).map(t=>({task:t,ratio:effort.get(t.id)/Number(t.estimateMinutes)}));
    return {samples,ratio:median(samples.map(x=>x.ratio))};
  };
  const repeatedObstacles=()=>{
    const map=new Map();
    tasks().forEach(t=>{const text=String(t.obstacle||"").trim();if(!text)return;const key=text.toLowerCase().replace(/[，。！？,.!?\s]+/g," ").trim(),row=map.get(key)||{text,count:0};row.count++;map.set(key,row);});
    return [...map.values()].filter(x=>x.count>=2).sort((a,b)=>b.count-a.count).slice(0,5);
  };
  const focusPattern=since=>{
    const hours=[];pomodoros().forEach(x=>{if(Number(x.endedAt)>=since)hours.push(new Date(Number(x.endedAt)).getHours());});focusSessions().forEach(x=>{const t=sessionTime(x);if(t>=since)hours.push(new Date(t).getHours());});
    if(hours.length<6)return null;
    const buckets=[{name:"凌晨",test:h=>h<6},{name:"上午",test:h=>h>=6&&h<12},{name:"下午",test:h=>h>=12&&h<18},{name:"晚上",test:h=>h>=18}];
    return {total:hours.length,top:buckets.map(b=>({name:b.name,count:hours.filter(b.test).length})).sort((a,b)=>b.count-a.count)[0]};
  };
  const goalStats=(goal,planning)=>{
    const linked=tasks().filter(t=>goal.taskIds.includes(t.id)),done=linked.filter(t=>t.status==="done").length,since7=now()-7*DAY,range30={start:now()-30*DAY,end:now()+1};
    return {linked,done,last7:planning.checkins.filter(x=>x.goalId===goal.id&&x.createdAt>=since7).length,total:planning.checkins.filter(x=>x.goalId===goal.id).length,effort30:effortInRange(goal.taskIds,range30)};
  };
  const factsForRange=range=>{
    const a=actuals(range),e=effortMap(),samples=a.completed.filter(t=>t.estimateMinutes&&e.get(t.id)>0).map(t=>e.get(t.id)/Number(t.estimateMinutes)),ratio=median(samples);
    const lines=[`完成任务 ${a.completed.length} 个`,`专注 ${formatMinutes(a.focusMinutes)}`,`目标打卡 ${a.checkins.length} 次`];
    if(samples.length>=2&&ratio!=null)lines.push(`已完成任务估时样本 ${samples.length} 个，中位实际/估时 ${ratio.toFixed(1)}×`);
    if(a.completed.length)lines.push(`完成：${a.completed.slice(0,6).map(t=>t.title).join("、")}`);
    return lines.join("\n");
  };

  let mount;
  const overview=()=>{
    const nowTs=now(),since7=nowTs-7*DAY,since30=nowTs-30*DAY,all=tasks(),completed=all.filter(t=>t.status==="done"),e=estimateStats(),repeat=repeatedObstacles(),pattern=focusPattern(since30),history=decisions(),today=localDayKey(new Date());
    const due=history.filter(x=>x?.reviewAt&&x.reviewAt<=today&&!x.reviewedAt),reviewed=history.filter(x=>x?.reviewedAt),highMiss=reviewed.filter(x=>Number(x.confidence)>=70&&x.reviewFit==="missed").length,overdue=all.filter(t=>t.status!=="done"&&t.plannedAt&&Number(t.plannedAt)<nowTs).length;
    const focus7=pomodoros().filter(x=>Number(x.endedAt)>=since7).reduce((s,x)=>s+(Number(x.minutes)||0),0)+focusSessions().filter(x=>sessionTime(x)>=since7).reduce((s,x)=>s+sessionMinutes(x),0);
    const observations=[];
    if(e.samples.length>=3&&e.ratio!=null)observations.push(`在 ${e.samples.length} 个已完成且可比较的任务里，中位“累计专注 / 任务级估时”约为 ${e.ratio.toFixed(1)}×。${e.ratio>1.25?"记录里存在偏低估的迹象。":e.ratio<0.8?"记录里存在偏高估的迹象。":"目前大致接近。"}`);
    else observations.push("已完成任务的估时样本还不够多；至少 3 个样本后再看趋势更有意义。");
    if(repeat.length)observations.push(`重复障碍：${repeat.map(x=>`${x.text}（${x.count} 次）`).join("、")}。它们值得验证，但不等于已经找到根因。`);
    if(overdue>=2)observations.push(`当前有 ${overdue} 个未完成任务的计划开始时间已经过去；这表示计划和实际出现偏差，不判断原因。`);
    if(pattern)observations.push(`近 30 天 ${pattern.total} 条专注记录中，最多出现在${pattern.top.name}（${pattern.top.count} 条）。这是时间分布，不代表这个时段一定更高效。`);
    if(due.length)observations.push(`有 ${due.length} 条 Decision Journal 已到回看日期。`);
    if(reviewed.length>=3)observations.push(`已回看 ${reviewed.length} 条决策，其中 ${highMiss} 条是“当时置信度 ≥70%，后来结果明显偏离”。`);
    return `<div class="calibration-metrics"><div class="metric"><strong>${completed.filter(t=>Number(t.completedAt)>=since7).length}</strong><span>近7天完成</span></div><div class="metric"><strong>${formatMinutes(focus7)}</strong><span>近7天专注</span></div><div class="metric"><strong>${e.samples.length}</strong><span>估时样本</span></div><div class="metric"><strong>${due.length}</strong><span>待回看决策</span></div></div><div class="calibration-observations">${observations.map(x=>`<div>${escapeHtml(x)}</div>`).join("")}</div>`;
  };
  const periodCards=()=>{
    const planning=planningData();
    return ["day","week","month","year"].map(type=>{const range=rangeFor(type),record=planning.periods[type]?.[range.key]||{},facts=factsForRange(range);return `<article class="calibration-period"><div><strong>${type==="day"?"今日":type==="week"?"本周":type==="month"?"本月":"今年"}</strong><span>${escapeHtml(range.label)}</span></div><p><b>计划方向：</b>${escapeHtml(record.focus||"未填写")}</p><pre>${escapeHtml(facts)}</pre><button class="mini-btn" data-write-period-facts="${type}" type="button">把事实写入回顾</button></article>`;}).join("");
  };
  const goalCards=()=>{
    const planning=planningData(),goals=planning.goals.filter(g=>!g.archivedAt);
    if(!goals.length)return `<span class="help-text">还没有目标数据。</span>`;
    return goals.map(goal=>{const s=goalStats(goal,planning);return `<article class="calibration-goal"><div><strong>${escapeHtml(goal.title)}</strong><span>近7天打卡 ${s.last7}${goal.targetPerWeek?`/${goal.targetPerWeek}`:""} · 近30天关联任务专注 ${formatMinutes(s.effort30)} · 关联任务完成 ${s.done}/${s.linked.length}</span></div></article>`;}).join("");
  };
  const decisionCards=()=>{
    const today=localDayKey(new Date()),items=decisions().filter(x=>x?.reviewAt&&x.reviewAt<=today&&!x.reviewedAt).slice(0,6);
    if(!items.length)return `<span class="help-text">目前没有到期的决策需要回看。</span>`;
    return items.map(x=>`<article class="calibration-decision"><div><strong>${escapeHtml(x.topic||"未命名决策")}</strong><span>当时选择：${escapeHtml(x.winner||"未记录")} · 置信度 ${escapeHtml(x.confidence||"?")}% · 回看 ${escapeHtml(x.reviewAt||"")}</span></div><div class="field"><label>后来实际发生了什么？</label><textarea class="input-area mini-area" data-cal-decision-outcome="${escapeHtml(x.id)}"></textarea></div><div class="two-col"><div class="field"><label>结果与当时判断</label><select class="select-input" data-cal-decision-fit="${escapeHtml(x.id)}"><option value="unclear">暂时无法判断</option><option value="matched">大体符合</option><option value="partial">部分符合</option><option value="missed">明显偏离</option></select></div><div class="field"><label>现在最重要的学习</label><input class="text-input" data-cal-decision-learning="${escapeHtml(x.id)}"></div></div><button class="secondary-btn" data-cal-decision-save="${escapeHtml(x.id)}" type="button">保存回看</button></article>`).join("");
  };
  const render=()=>{
    if(!mount)return;
    mount.innerHTML=`<details class="calibration-layer"><summary><strong>长期校准</strong><span>计划 → 实际 → 偏差 → 调整</span></summary><div class="calibration-body">${overview()}<details class="calibration-section" open><summary><strong>计划与实际</strong><span>自动引用真实记录</span></summary><div class="calibration-period-grid">${periodCards()}</div></details><details class="calibration-section"><summary><strong>目标节奏</strong><span>只看设定与实际，不在这里改目标</span></summary><div class="calibration-goal-list">${goalCards()}</div></details><details class="calibration-section"><summary><strong>Decision Journal 回看</strong><span>把判断和结果接起来</span></summary><div class="calibration-decision-list">${decisionCards()}</div></details></div></details>`;
    bind();
  };
  const bind=()=>{
    mount.querySelectorAll("[data-write-period-facts]").forEach(btn=>btn.onclick=()=>{const type=btn.dataset.writePeriodFacts,data=planningData(),range=rangeFor(type),facts=factsForRange(range),old=data.periods[type]?.[range.key]||{},marker=`【自动事实 ${range.label}】`,block=`${marker}\n${facts}\n\n我的调整：\n`;if(!data.periods[type])data.periods[type]={};if(!String(old.review||"").includes(marker))data.periods[type][range.key]={...old,review:(old.review?`${old.review.trim()}\n\n`:"")+block,updatedAt:now()};savePlanning(data);document.querySelector(`[data-horizon-tab="${type}"]`)?.click();render();toast("已写入该周期回顾");});
    mount.querySelectorAll("[data-cal-decision-save]").forEach(btn=>btn.onclick=()=>{const id=btn.dataset.calDecisionSave,history=decisions(),item=history.find(x=>String(x.id)===String(id));if(!item)return;item.reviewOutcome=mount.querySelector(`[data-cal-decision-outcome="${CSS.escape(id)}"]`)?.value.trim()||"";item.reviewFit=mount.querySelector(`[data-cal-decision-fit="${CSS.escape(id)}"]`)?.value||"unclear";item.reviewLearning=mount.querySelector(`[data-cal-decision-learning="${CSS.escape(id)}"]`)?.value.trim()||"";item.reviewedAt=now();storage.set("tools.decision.history",history);render();toast("决策回看已保存");});
  };
  const start=()=>{mount=$("#calibrationMount");if(!mount)return;render();};
  document.addEventListener("DOMContentLoaded",start,{once:true});
})();
