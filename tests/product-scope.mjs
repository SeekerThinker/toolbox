import fs from "node:fs";
import assert from "node:assert/strict";

const index = fs.readFileSync("index.html", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const horizons = fs.readFileSync("horizons.js", "utf8");
const calibration = fs.readFileSync("calibration.js", "utf8");
const core = fs.readFileSync("core.js", "utf8");
const focus = fs.readFileSync("tools-focus.js", "utf8");

assert.equal(fs.existsSync("catalog.yml"), false, "Toolbox must not keep a catalog for unrelated projects");
assert.equal(fs.existsSync("word-writing-templates"), false, "independent Word project must not be copied into Toolbox");
assert.doesNotMatch(index, /word-writing-templates/i, "core UI must not reference the independent Word project");
assert.doesNotMatch(readme, /word-writing-templates|在线选择器/i, "README must stay focused on Toolbox itself");

assert.doesNotMatch(index, /id="accountBtn"/, "guest release must not render an account entry");
assert.match(index, /id="dataBtn"[^>]*>备份</, "local backup must be a visible top-level guest action");
assert.match(index, /<section class="task-center"/, "task center must remain the first primary work surface");
assert.match(index, /计划、目标与校准/, "secondary planning layer should have one clear calibration concept");
assert.match(index, /<details class="method-section">/, "method library must remain secondary and collapsed");
assert.match(index, /仅本机 · 可导出备份/, "guest release must clearly communicate local persistence");

assert.doesNotMatch(horizons, /data-horizon-tab="insights"|insightsView/, "cross-task insights must have one owner: calibration");
assert.match(horizons, /data-goal-target-save/, "goal cadence must be configured on the goal itself");
assert.doesNotMatch(calibration, /data-cal-goal-save|data-cal-goal-target/, "calibration must observe goals, not configure them");
assert.doesNotMatch(core, /data-fav|favoritesBtn|我的收藏/, "an eight-method curated library does not need a favorites UI");
assert.doesNotMatch(focus, /id="fClear"|清空全部记录/, "accumulated focus evidence must not have a one-click destructive clear action");

console.log("ok: Toolbox stays task-first, guest-first, curated and free of duplicate product layers");
