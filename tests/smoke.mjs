import fs from "node:fs";

const files=["core.js","tools-focus.js","tools-thinking.js","tasks.js"];
const index=fs.readFileSync("index.html","utf8");
for(const file of files){if(!fs.existsSync(file))throw new Error(`missing ${file}`);if(!index.includes(`./${file}`))throw new Error(`index does not load ${file}`);}
const source=files.map(file=>fs.readFileSync(file,"utf8")).join("\n");
const tasks=fs.readFileSync("tasks.js","utf8"),thinking=fs.readFileSync("tools-thinking.js","utf8"),focus=fs.readFileSync("tools-focus.js","utf8");
const ids=[...source.matchAll(/registerTool\(\{\s*id:\s*"([^"]+)"/g)].map(m=>m[1]);
if(ids.length!==8)throw new Error(`expected 8 tools, found ${ids.length}`);
if(new Set(ids).size!==ids.length)throw new Error("duplicate tool ids");
if(ids.includes("braindump")||ids.includes("eisenhower"))throw new Error("capture/matrix should be native task capabilities, not tools");
if(/DeskKit/.test(source)||/DeskKit/.test(index))throw new Error("legacy brand remains in active source");
if(!index.includes('id="taskInput"')||!index.includes('id="taskList"'))throw new Error("task capture is missing");
if(!index.includes('<textarea id="taskInput"'))throw new Error("capture should support multi-line inbox entry");
if(!index.includes('id="taskFilterMatrix"'))throw new Error("priority matrix task view is missing");
if(!index.includes('<details class="method-section">'))throw new Error("method library should remain secondary to tasks");
for(const field of ["outcome","nextAction","estimateMinutes","plannedAt","obstacle","ifThen","important","urgent","reflection"]){if(!tasks.includes(field))throw new Error(`guided task field missing: ${field}`);}
if(!tasks.includes("priority-matrix")||!tasks.includes("重要 + 紧急"))throw new Error("Eisenhower-style priority view is not integrated into tasks");
if(!tasks.includes("现在最值得问")||!tasks.includes("guideFor"))throw new Error("metacognitive guidance is missing");
if(!tasks.includes("完成并复盘")||!tasks.includes('type:"reflection"'))throw new Error("completion reflection loop is missing");
if(!thinking.includes("Decision Journal")||!thinking.includes("confidence")||!thinking.includes("disconfirm")||!thinking.includes("reviewAt"))throw new Error("decision journal is incomplete");
if(!thinking.includes("原因探索")||!thinking.includes("反证 / 其他解释")||!thinking.includes("下一步验证"))throw new Error("evidence-aware cause exploration is missing");
if(!thinking.includes("taskEffortMinutes")||!thinking.includes("实际专注"))throw new Error("review does not read task execution history");
if(!thinking.includes("写回待办")||!thinking.includes("更新待办下一步"))throw new Error("thinking methods do not write back into tasks");
if(!focus.includes("taskAction")||!focus.includes("plannedAction")||!focus.includes("taskId"))throw new Error("focus sessions are not linked to task next actions");
if(!source.includes("tools.review.history")||!source.includes("tools.decision.history"))throw new Error("review or decision history is missing");
console.log(`ok: ${ids.length} methods, native capture + priority view, decision journal, cause exploration and contextual review enabled`);
