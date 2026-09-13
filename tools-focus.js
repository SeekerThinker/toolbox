(() => {
  "use strict";
  const { registerTool, storage, $, escapeHtml } = Toolbox;

  const localDayKey = value => {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };
  const recentDayKeys = count => {
    const keys=[],d=new Date();d.setHours(12,0,0,0);
    for(let i=count-1;i>=0;i--){const x=new Date(d);x.setDate(d.getDate()-i);keys.push(localDayKey(x));}
    return keys;
  };
  const durationTextToMs = value => {
    const p=String(value||"").split(":").map(Number);
    return p.length===3&&p.every(Number.isFinite)?((p[0]*3600)+(p[1]*60)+p[2])*1000:0;
  };
  const compactDuration = ms => {
    const minutes=Math.round(Math.max(0,ms)/60000);
    if(minutes<60)return `${minutes} 分钟`;
    const h=Math.floor(minutes/60),r=minutes%60;return r?`${h} 小时 ${r} 分钟`:`${h} 小时`;
  };
  const taskAction = task => task?.nextAction?.trim() || task?.title?.trim() || "";

  registerTool({ id:"pomodoro", icon:"◴", name:"番茄钟", category:"专注", desc:"围绕一件事的下一步动作进行专注循环，并积累历史。", keywords:"番茄钟 pomodoro 专注 倒计时 休息 待办 下一步" }, (root,ctx={}) => {
    const defaults={focus:25,rest:5,long:15,cycles:0,mode:"专注",running:false,remaining:1500,endAt:null,history:[],currentTaskId:null,currentTaskTitle:"",currentAction:""};
    let s={...defaults,...(storage.get("tools.pomodoro",{})||{})};
    if(!Array.isArray(s.history))s.history=[];
    if(ctx.taskId&&!s.running){s.currentTaskId=ctx.taskId;s.currentTaskTitle=ctx.task?.title||s.currentTaskTitle||"";s.currentAction=taskAction(ctx.task)||s.currentAction||"";}
    let timer;
    root.innerHTML=`<div class="editor-stack"><div id="pTask" class="timer-mode"></div><div id="pAction" class="focus-action"></div><div id="pMode" class="timer-mode"></div><div id="pTime" class="timer-face">25:00</div><div class="three-col"><div class="field"><label>专注（分钟）</label><input id="pFocus" class="text-input" type="number" min="1" max="180" value="${s.focus}"></div><div class="field"><label>短休息</label><input id="pRest" class="text-input" type="number" min="1" max="60" value="${s.rest}"></div><div class="field"><label>长休息</label><input id="pLong" class="text-input" type="number" min="1" max="90" value="${s.long}"></div></div><div class="toolbar"><button id="pStart" class="primary-btn" type="button">开始</button><button id="pReset" class="secondary-btn" type="button">重置</button><button id="pSkip" class="secondary-btn" type="button">切换阶段</button></div><div id="pStats" class="output-panel"></div></div>`;
    const time=$("#pTime",root),mode=$("#pMode",root),taskLabel=$("#pTask",root),actionLabel=$("#pAction",root),stats=$("#pStats",root),start=$("#pStart",root);
    const settings=()=>{s.focus=Math.max(1,+$("#pFocus",root).value||25);s.rest=Math.max(1,+$("#pRest",root).value||5);s.long=Math.max(1,+$("#pLong",root).value||15);};
    const save=()=>storage.set("tools.pomodoro",s);
    const fmt=n=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
    const sync=()=>{if(s.running&&s.endAt)s.remaining=Math.max(0,Math.ceil((s.endAt-Date.now())/1000));};
    const trend=()=>{const keys=recentDayKeys(7),today=keys.at(-1),valid=s.history.filter(x=>x?.endedAt&&keys.includes(localDayKey(x.endedAt)));return{todayCount:valid.filter(x=>localDayKey(x.endedAt)===today).length,weekCount:valid.length};};
    const draw=()=>{sync();const t=trend();time.textContent=fmt(s.remaining);mode.textContent=`${s.mode} · 已完成 ${s.cycles} 个番茄`;taskLabel.textContent=s.currentTaskTitle?`当前待办：${s.currentTaskTitle}`:"";taskLabel.hidden=!s.currentTaskTitle;actionLabel.textContent=s.currentAction?`这次只做：${s.currentAction}`:"";actionLabel.hidden=!s.currentAction;stats.textContent=`今日完成 ${t.todayCount} 个 · 近 7 天 ${t.weekCount} 个\n${s.focus} 分钟专注 / ${s.rest} 分钟短休息 · 每 4 个完成番茄使用 ${s.long} 分钟长休息。`;start.textContent=s.running?"暂停":"开始";document.title=s.running?`${fmt(s.remaining)} · ${s.mode} · Toolbox`:"Toolbox";};
    const sound=()=>{try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;const a=new AudioCtx(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);g.gain.value=.04;o.start();o.stop(a.currentTime+.16);setTimeout(()=>a.close?.(),300);}catch{}};
    const next=(completed=false)=>{settings();if(s.mode==="专注"){if(completed){s.cycles++;s.history.unshift({endedAt:Date.now(),minutes:s.focus,taskId:s.currentTaskId||null,taskTitle:s.currentTaskTitle||"",action:s.currentAction||""});s.history=s.history.slice(0,500);}s.mode=completed&&s.cycles%4===0?"长休息":"休息";s.remaining=(s.mode==="长休息"?s.long:s.rest)*60;}else{s.mode="专注";s.remaining=s.focus*60;}s.running=false;s.endAt=null;if(completed)sound();save();draw();};
    start.onclick=()=>{settings();if(ctx.taskId){s.currentTaskId=ctx.taskId;s.currentTaskTitle=ctx.task?.title||s.currentTaskTitle||"";s.currentAction=taskAction(ctx.task)||s.currentAction||"";}if(s.running){sync();s.running=false;s.endAt=null;}else{s.running=true;s.endAt=Date.now()+s.remaining*1000;}save();draw();};
    $("#pReset",root).onclick=()=>{settings();s={...s,running:false,mode:"专注",remaining:s.focus*60,endAt:null};save();draw();};
    $("#pSkip",root).onclick=()=>next(false);
    ["#pFocus","#pRest","#pLong"].forEach(id=>$(id,root).onchange=()=>{settings();if(!s.running&&s.mode==="专注")s.remaining=s.focus*60;save();draw();});
    sync();if(s.running&&s.remaining<=0)next(true);draw();timer=setInterval(()=>{sync();if(s.running&&s.remaining<=0)next(true);draw();},1000);
    return()=>{clearInterval(timer);save();document.title="Toolbox";};
  });

  registerTool({ id:"focuslog", icon:"◎", name:"深度工作计时", category:"专注", desc:"针对待办的下一步动作计时，并保留任务级专注记录。", keywords:"深度工作 focus 计时 专注 记录 趋势 待办 下一步" }, (root,ctx={}) => {
    const saved=storage.get("tools.focuslog",{})||{};
    let sessions=Array.isArray(saved.sessions)?saved.sessions:[],active=saved.active&&Number(saved.active.startedAt)?saved.active:null,timer=null;
    const suggested=taskAction(ctx.task);
    root.innerHTML=`<div class="editor-stack"><div class="field"><label>这次只做什么？</label><input id="fTask" class="text-input" placeholder="例如：完成方案初稿，不处理消息" value="${active?escapeHtml(active.task||""):escapeHtml(suggested)}"></div><div id="fClock" class="timer-face timer-face-small">00:00:00</div><div class="toolbar"><button id="fStart" class="primary-btn" type="button">开始专注</button><button id="fFinish" class="secondary-btn" type="button">结束并记录</button><button id="fCancel" class="secondary-btn" type="button">取消本次</button></div><div class="field"><label>结束备注</label><input id="fNote" class="text-input" placeholder="完成了什么 / 被什么打断？"></div><div id="fSummary" class="output-panel"></div><div class="field"><label>最近记录</label><div id="fSessions" class="session-list"></div></div><button id="fClear" class="secondary-btn" type="button">清空全部记录</button></div>`;
    const clock=$("#fClock",root),start=$("#fStart",root),finish=$("#fFinish",root),cancel=$("#fCancel",root),list=$("#fSessions",root),task=$("#fTask",root),summary=$("#fSummary",root);
    const fmt=ms=>{const n=Math.max(0,Math.floor(ms/1000));return[Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,"0")).join(":");};
    const sessionMs=x=>Number(x.durationMs)||durationTextToMs(x.duration),sessionTime=x=>Number(x.endedAt)||Date.parse(x.date)||0;
    const persist=()=>storage.set("tools.focuslog",{sessions,active});
    const show=()=>{const keys=recentDayKeys(7),totals=Object.fromEntries(keys.map(k=>[k,0]));let weekCount=0,weekMs=0,todayMs=0;for(const x of sessions){const key=localDayKey(sessionTime(x));if(!keys.includes(key))continue;const ms=sessionMs(x);totals[key]+=ms;weekCount++;weekMs+=ms;if(key===keys.at(-1))todayMs+=ms;}const daily=keys.map(k=>`${k.slice(5)} ${Math.round(totals[k]/60000)}m`).join(" · ");summary.textContent=`今日 ${compactDuration(todayMs)} · 近 7 天 ${compactDuration(weekMs)} · ${weekCount} 次${weekCount?` · 平均 ${compactDuration(weekMs/weekCount)}`:""}\n${daily}`;list.innerHTML=sessions.length?sessions.slice(0,12).map(x=>`<div class="session-item"><span><strong>${escapeHtml(x.task||"未命名专注")}</strong><br>${escapeHtml(x.note||"")}</span><span>${escapeHtml(x.duration||fmt(sessionMs(x)))}<br>${escapeHtml(x.date||new Date(sessionTime(x)).toLocaleString())}</span></div>`).join(""):"<span class='help-text'>还没有专注记录。</span>";};
    const tick=()=>{clock.textContent=active?fmt(Date.now()-active.startedAt):"00:00:00";start.disabled=!!active;finish.disabled=!active;cancel.disabled=!active;};
    const ensureTimer=()=>{if(timer)clearInterval(timer);if(active)timer=setInterval(tick,1000);};
    start.onclick=()=>{if(active)return;active={startedAt:Date.now(),task:task.value.trim()||"未命名专注",taskId:ctx.taskId||null,taskTitle:ctx.task?.title||"",plannedAction:ctx.task?.nextAction||""};persist();tick();ensureTimer();};
    finish.onclick=()=>{if(!active)return;const endedAt=Date.now(),elapsed=endedAt-active.startedAt;sessions.unshift({task:active.task,note:$("#fNote",root).value.trim(),taskId:active.taskId||null,taskTitle:active.taskTitle||"",plannedAction:active.plannedAction||"",startedAt:active.startedAt,endedAt,durationMs:elapsed,duration:fmt(elapsed),date:new Date(endedAt).toLocaleString()});sessions=sessions.slice(0,300);active=null;$("#fNote",root).value="";persist();ensureTimer();tick();show();};
    cancel.onclick=()=>{active=null;persist();ensureTimer();tick();};
    $("#fClear",root).onclick=()=>{if(!confirm("清空全部深度工作记录？此操作不可撤销。"))return;sessions=[];persist();show();};
    tick();show();ensureTimer();
    return()=>{clearInterval(timer);persist();};
  });
})();
