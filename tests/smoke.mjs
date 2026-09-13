import fs from "node:fs";

const files=["core.js","tools-focus.js","tools-thinking.js","tasks.js","horizons.js","calibration.js"];
const index=fs.readFileSync("index.html","utf8");
for(const file of files){
  if(!fs.existsSync(file))throw new Error(`missing ${file}`);
  if(!index.includes(`./${file}`))throw new Error(`index does not load ${file}`);
}
for(const css of ["horizons.css","calibration.css"]){if(!fs.existsSync(css)||!index.includes(`./${css}`))throw new Error(`missing style ${css}`);}
const source=files.map(file=>fs.readFileSync(file,"utf8")).join("\n");
const tasks=fs.readFileSync("tasks.js","utf8");
const thinking=fs.readFileSync("tools-thinking.js","utf8");
const focus=fs.readFileSync("tools-focus.js","utf8");
const horizons=fs.readFileSync("horizons.js","utf8");
const calibration=fs.readFileSync("calibration.js","utf8");
const ids=[...source.matchAll(/registerTool\(\{\s*id:\s*"([^"]+)"/g)].map(m=>m[1]);

if(ids.length!==8)throw new Error(`expected 8 methods, found ${ids.length}`);
if(new Set(ids).size!==ids.length)throw new Error("duplicate tool ids");
if(ids.includes("braindump")||ids.includes("eisenhower"))throw new Error("capture/matrix should be native task capabilities");
if(/DeskKit/.test(source)||/DeskKit/.test(index))throw new Error("legacy brand remains in active source");
if(index.includes("word-writing-templates"))throw new Error("obsolete word template module leaked back into the core product");
if(!index.includes('<textarea id="taskInput"')||!index.includes('id="taskFilterMatrix"'))throw new Error("native capture or matrix view is missing");
if(!index.includes('id="horizonMount"')||!index.includes('id="calibrationMount"'))throw new Error("planning or calibration layer is missing");
if(!index.includes('<details class="method-section">'))throw new Error("method library should remain secondary");

for(const field of ["outcome","nextAction","estimateMinutes","plannedAt","obstacle","ifThen","priority","reflection"]){
  if(!tasks.includes(field))throw new Error(`optional task field missing: ${field}`);
}
if(!tasks.includes('data-task-tool="pomodoro"')||!tasks.includes('data-task-tool="focuslog"'))throw new Error("task cannot start focus directly");
if(!tasks.includes("标记完成")||tasks.includes("完成并复盘"))throw new Error("completion should not force reflection");
if(!tasks.includes('class="task-capability"')||!tasks.includes("按需填写")||!tasks.includes("需要时调用"))throw new Error("progressive disclosure for optional capabilities is missing");
if(!tasks.includes("未分类 · 可选")||!tasks.includes('value=""'))throw new Error("priority must remain optional");
if(!tasks.includes("可选建议")||!tasks.includes("suggestionFor"))throw new Error("metacognitive guidance should be optional");

if(!thinking.includes("Decision Journal")||!thinking.includes("confidence")||!thinking.includes("disconfirm")||!thinking.includes("reviewAt"))throw new Error("decision journal is incomplete");
if(!thinking.includes("原因探索")||!thinking.includes("反证 / 其他解释")||!thinking.includes("下一步验证"))throw new Error("evidence-aware cause exploration is missing");
if(!thinking.includes("taskEffortMinutes")||!thinking.includes("实际专注"))throw new Error("review does not read task execution history");
if(!focus.includes("taskAction")||!focus.includes("plannedAction")||!focus.includes("taskId"))throw new Error("focus sessions are not linked to task context");

for(const token of ["planning","periods","goals","checkins","day","week","month","year"]){if(!horizons.includes(token))throw new Error(`planning layer missing token: ${token}`);}
if(!horizons.includes("目标打卡")||!horizons.includes("关联任务"))throw new Error("goal check-in or task linking is missing");

for(const token of ["estimateStats","repeatedObstacles","focusPattern","targetPerWeek","reviewOutcome","reviewFit","reviewedAt","data-write-period-facts"]){
  if(!calibration.includes(token))throw new Error(`calibration layer missing token: ${token}`);
}
if(!calibration.includes('t.status==="done"&&t.estimateMinutes'))throw new Error("estimate calibration must use completed tasks, not unfinished tasks");
if(!calibration.includes("不等于已经找到根因")||!calibration.includes("不代表这个时段一定更高效"))throw new Error("metacognitive observations need uncertainty boundaries");
if(!calibration.includes("把事实写入回顾")||!calibration.includes("我的调整"))throw new Error("plan → actual → adjustment loop is incomplete");
if(!calibration.includes("当时置信度 ≥70%")||!calibration.includes("保存回看"))throw new Error("decision calibration loop is incomplete");

console.log(`ok: ${ids.length} methods, optional task system, focus horizons, goals and long-term calibration loops enabled`);
