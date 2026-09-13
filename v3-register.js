(() => {
  tools.push(
    {id:"pomodoro",icon:"◴",name:"番茄钟",category:"专注",desc:"自定义专注 / 休息循环，并在本机记录完成次数。",keywords:"番茄钟 pomodoro 专注 倒计时 休息",local:true},
    {id:"focuslog",icon:"◎",name:"深度工作计时",category:"专注",desc:"为一件重要任务计时，并留下本地专注记录。",keywords:"深度工作 focus 计时 专注 记录",local:true},
    {id:"braindump",icon:"☁",name:"Brain Dump 思路收集",category:"思维",desc:"把脑内杂事一次写下，再分成现在、稍后、等待和舍弃。",keywords:"brain dump 思路 收集 GTD 待办",local:true},
    {id:"taskbreak",icon:"↳",name:"任务拆解器",category:"思维",desc:"把模糊目标拆成完成标准、步骤和下一步行动。",keywords:"任务 拆解 下一步 行动 目标 项目",local:true},
    {id:"eisenhower",icon:"田",name:"艾森豪威尔矩阵",category:"思维",desc:"按重要 / 紧急四象限整理任务和优先级。",keywords:"艾森豪威尔 四象限 优先级 重要 紧急",local:true},
    {id:"decision",icon:"⚖",name:"加权决策矩阵",category:"思维",desc:"按标准和权重为多个方案评分并计算总分。",keywords:"决策 矩阵 权重 评分 比较 方案",local:true},
    {id:"fivewhys",icon:"5?",name:"5 Whys 根因分析",category:"思维",desc:"连续追问为什么，从表面现象走向可控制的原因。",keywords:"5 whys 五问 根因 分析 问题",local:true},
    {id:"premortem",icon:"⚑",name:"Pre-mortem 事前风险推演",category:"思维",desc:"提前列出可能出问题的原因、预警信号和预防动作。",keywords:"premortem 事前 风险 推演 预案 项目",local:true},
    {id:"review",icon:"↺",name:"每日 / 每周复盘",category:"思维",desc:"记录成果、卡点、学习、状态与下一步。",keywords:"复盘 reflection daily weekly 元认知",local:true},
    {id:"feynman",icon:"费",name:"费曼学习卡",category:"思维",desc:"用自己的话解释概念，暴露知识缺口并压缩理解。",keywords:"费曼 学习 理解 元认知 知识",local:true}
  );
  const i=categories.indexOf("收藏");
  if(!categories.includes("思维")) categories.splice(i>=0?i:categories.length,0,"思维","专注");
  const st=document.createElement("style");
  st.textContent=`.matrix-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.matrix-cell{border:1px solid var(--line);border-radius:16px;padding:12px;background:var(--bg)}.matrix-cell h3{margin:0 0 8px;font-size:14px}.timer-face{font-variant-numeric:tabular-nums;font-size:clamp(52px,10vw,86px);font-weight:850;letter-spacing:-.06em;text-align:center;padding:20px 0}.timer-mode{text-align:center;color:var(--muted);font-size:13px}.session-list{display:grid;gap:7px;max-height:220px;overflow:auto}.session-item{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;border:1px solid var(--line);border-radius:12px;background:var(--bg);font-size:12px}.mind-list{display:grid;gap:8px}.mind-row{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.score-table{width:100%;border-collapse:collapse;font-size:13px}.score-table th,.score-table td{border-bottom:1px solid var(--line);padding:8px;text-align:left}.score-table input{width:72px;padding:7px;border:1px solid var(--line);border-radius:9px;background:var(--bg);color:var(--text)}.why-stack{display:grid;gap:9px}.why-row{display:grid;grid-template-columns:70px 1fr;gap:8px;align-items:center}.why-row span{font-size:12px;color:var(--muted);font-weight:800}.reflection-scale{display:flex;gap:7px;flex-wrap:wrap}.reflection-scale button.active{background:var(--accent);color:#fff;border-color:var(--accent)}@media(max-width:700px){.matrix-grid{grid-template-columns:1fr}.why-row{grid-template-columns:55px 1fr}.score-table{min-width:650px}.table-scroll{overflow:auto}}`;
  document.head.appendChild(st);
  window.mindLines=s=>String(s||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  window.mindEsc=s=>escapeHtml(String(s??""));
  render();
})();
