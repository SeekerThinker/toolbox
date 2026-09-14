import fs from "node:fs";
import assert from "node:assert/strict";

const core = fs.readFileSync("core.js", "utf8");
const tasks = fs.readFileSync("tasks.js", "utf8");
const thinking = fs.readFileSync("tools-thinking.js", "utf8");
const horizons = fs.readFileSync("horizons.js", "utf8");
const calibration = fs.readFileSync("calibration.js", "utf8");

const confirmAt = core.indexOf('confirm("导入备份会覆盖当前浏览器里的全部 Toolbox 数据。继续吗？")');
const importAt = core.indexOf("storage.importData(await file.text())");
assert.ok(confirmAt >= 0 && importAt > confirmAt, "backup import must confirm before overwriting local data");
assert.match(core, /导出 JSON 可备份或迁移到另一个浏览器/, "backup copy must describe the current guest use case");

const pomodoroAt = tasks.indexOf('data-task-tool="pomodoro"');
const optionalAt = tasks.indexOf('<details class="task-capability"');
assert.ok(pomodoroAt >= 0 && optionalAt > pomodoroAt, "focus must remain directly available before optional task details");
assert.match(tasks, /标记完成/);
assert.doesNotMatch(tasks, /完成并复盘/, "completion must never require reflection");

assert.doesNotMatch(thinking, /id="rvPeriod"|<option>今日<\/option>|<option>本周<\/option>/, "stage review must not duplicate day/week horizon reviews");
assert.match(thinking, /const periodLabel=task\?"本次任务":"本次阶段"/, "stage review must stay scoped to a task or project stage");
for (const misleading of ["生成行动计划", "生成风险卡", "生成复盘", "生成学习卡"]) {
  assert.equal(thinking.includes(misleading), false, `non-AI method should not claim: ${misleading}`);
}
for (const accurate of ["整理行动计划", "形成风险卡", "整理复盘", "整理学习卡"]) {
  assert.equal(thinking.includes(accurate), true, `accurate method wording missing: ${accurate}`);
}

assert.match(horizons, /targetPerWeek/);
assert.match(horizons, /每周目标次数 · 可选/);
assert.match(calibration, /只看设定与实际，不在这里改目标/);
assert.doesNotMatch(calibration, /data-cal-goal-save|data-cal-goal-target/);

console.log("ok: direct execution, safe backup restore, accurate method wording and clean review/goal ownership");
