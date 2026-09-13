(() => {
  "use strict";
  const { registerTool, storage, $ , escapeHtml } = Toolbox;

  registerTool({ id:"pomodoro", icon:"◴", name:"番茄钟", category:"专注", desc:"自定义专注 / 休息循环并保留进度。", keywords:"番茄钟 pomodoro 专注 倒计时 休息" }, root => {
    const defaults = { focus:25, rest:5, long:15, cycles:0, mode:"专注", running:false, remaining:1500, endAt:null };
    let s = { ...defaults, ...(storage.get("tools.pomodoro", {}) || {}) };
    let timer;
    root.innerHTML = `<div class="editor-stack"><div id="pMode" class="timer-mode"></div><div id="pTime" class="timer-face">25:00</div><div class="three-col"><div class="field"><label>专注（分钟）</label><input id="pFocus" class="text-input" type="number" min="1" max="180" value="${s.focus}"></div><div class="field"><label>短休息</label><input id="pRest" class="text-input" type="number" min="1" max="60" value="${s.rest}"></div><div class="field"><label>长休息</label><input id="pLong" class="text-input" type="number" min="1" max="90" value="${s.long}"></div></div><div class="toolbar"><button id="pStart" class="primary-btn" type="button">开始</button><button id="pReset" class="secondary-btn" type="button">重置</button><button id="pSkip" class="secondary-btn" type="button">切换阶段</button></div><div id="pStats" class="output-panel"></div></div>`;
    const time=$("#pTime",root), mode=$("#pMode",root), stats=$("#pStats",root), start=$("#pStart",root);
    const settings=()=>{s.focus=Math.max(1,+$("#pFocus",root).value||25);s.rest=Math.max(1,+$("#pRest",root).value||5);s.long=Math.max(1,+$("#pLong",root).value||15);};
    const save=()=>storage.set("tools.pomodoro",s);
    const fmt=n=>`${String(Math.floor(n/60)).padStart(2,"0")}:${String(n%60).padStart(2,"0")}`;
    const sync=()=>{if(s.running&&s.endAt)s.remaining=Math.max(0,Math.ceil((s.endAt-Date.now())/1000));};
    const draw=()=>{sync();time.textContent=fmt(s.remaining);mode.textContent=`${s.mode} · 已完成 ${s.cycles} 个番茄`;stats.textContent=`${s.focus} 分钟专注 / ${s.rest} 分钟短休息 · 每 4 个番茄使用 ${s.long} 分钟长休息。`;start.textContent=s.running?"暂停":"开始";document.title=s.running?`${fmt(s.remaining)} · ${s.mode} · Toolbox`:"Toolbox";};
    const sound=()=>{try{const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;const a=new AudioCtx(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);g.gain.value=.04;o.start();o.stop(a.currentTime+.16);setTimeout(()=>a.close?.(),300);}catch{}};
    const next=()=>{settings();if(s.mode==="专注"){s.cycles++;s.mode=s.cycles%4===0?"长休息":"休息";s.remaining=(s.mode==="长休息"?s.long:s.rest)*60;}else{s.mode="专注";s.remaining=s.focus*60;}s.running=false;s.endAt=null;sound();save();draw();};
    start.onclick=()=>{settings();if(s.running){sync();s.running=false;s.endAt=null;}else{s.running=true;s.endAt=Date.now()+s.remaining*1000;}save();draw();};
    $("#pReset",root).onclick=()=>{settings();s={...s,running:false,mode:"专注",remaining:s.focus*60,endAt:null};save();draw();};
    $("#pSkip",root).onclick=next;
    ["#pFocus","#pRest","#pLong"].forEach(id=>$(id,root).onchange=()=>{settings();if(!s.running&&s.mode==="专注")s.remaining=s.focus*60;save();draw();});
    sync();if(s.running&&s.remaining<=0)next();draw();timer=setInterval(()=>{sync();if(s.running&&s.remaining<=0)next();draw();},1000);
    return ()=>{clearInterval(timer);save();document.title="Toolbox";};
  });

  registerTool({ id:"focuslog", icon:"◎", name:"深度工作计时", category:"专注", desc:"为一件任务计时，并保留本地专注记录。", keywords:"深度工作 focus 计时 专注 记录" }, root => {
    const saved = storage.get("tools.focuslog", {}) || {};
    let sessions = Array.isArray(saved.sessions) ? saved.sessions : [];
    let active = saved.active && Number(saved.active.startedAt) ? saved.active : null;
    let timer=null;
    root.innerHTML=`<div class="editor-stack"><div class="field"><label>这次只做什么？</label><input id="fTask" class="text-input" placeholder="例如：完成方案初稿，不处理消息" value="${active?escapeHtml(active.task||""):""}"></div><div id="fClock" class="timer-face timer-face-small">00:00:00</div><div class="toolbar"><button id="fStart" class="primary-btn" type="button">开始专注</button><button id="fFinish" class="secondary-btn" type="button">结束并记录</button><button id="fCancel" class="secondary-btn" type="button">取消本次</button><button id="fClear" class="secondary-btn" type="button">清空记录</button></div><div class="field"><label>结束备注</label><input id="fNote" class="text-input" placeholder="完成了什么 / 被什么打断？"></div><div id="fSessions" class="session-list"></div></div>`;
    const clock=$("#fClock",root),start=$("#fStart",root),finish=$("#fFinish",root),cancel=$("#fCancel",root),list=$("#fSessions",root),task=$("#fTask",root);
    const fmt=ms=>{const n=Math.max(0,Math.floor(ms/1000));return [Math.floor(n/3600),Math.floor(n%3600/60),n%60].map(x=>String(x).padStart(2,"0")).join(":");};
    const persist=()=>storage.set("tools.focuslog",{sessions,active});
    const show=()=>{list.innerHTML=sessions.length?sessions.slice(0,12).map(x=>`<div class="session-item"><span><strong>${escapeHtml(x.task)}</strong><br>${escapeHtml(x.note||"")}</span><span>${escapeHtml(x.duration)}<br>${escapeHtml(x.date)}</span></div>`).join(""):"<span class='help-text'>还没有专注记录。</span>";};
    const tick=()=>{clock.textContent=active?fmt(Date.now()-active.startedAt):"00:00:00";start.disabled=!!active;finish.disabled=!active;cancel.disabled=!active;};
    const ensureTimer=()=>{if(timer)clearInterval(timer);if(active)timer=setInterval(tick,1000);};
    start.onclick=()=>{if(active)return;active={startedAt:Date.now(),task:task.value.trim()||"未命名专注"};persist();tick();ensureTimer();};
    finish.onclick=()=>{if(!active)return;const elapsed=Date.now()-active.startedAt;sessions.unshift({task:active.task,note:$("#fNote",root).value.trim(),duration:fmt(elapsed),date:new Date().toLocaleString()});sessions=sessions.slice(0,50);active=null;persist();ensureTimer();tick();show();};
    cancel.onclick=()=>{active=null;persist();ensureTimer();tick();};
    $("#fClear",root).onclick=()=>{sessions=[];persist();show();};
    tick();show();ensureTimer();
    return ()=>{clearInterval(timer);persist();};
  });
})();