import fs from "node:fs";
import assert from "node:assert/strict";

const index = fs.readFileSync("index.html", "utf8");
const readme = fs.readFileSync("README.md", "utf8");
const horizonsCss = fs.readFileSync("horizons.css", "utf8");
const readability = fs.readFileSync("readability.css", "utf8");

assert.equal(fs.existsSync("catalog.yml"), false, "Toolbox must not keep a catalog for unrelated projects");
assert.equal(fs.existsSync("word-writing-templates"), false, "independent Word project must not be copied into Toolbox");
assert.doesNotMatch(index, /word-writing-templates/i, "core UI must not reference the independent Word project");
assert.doesNotMatch(readme, /word-writing-templates|在线选择器/i, "README must stay focused on Toolbox itself");

assert.match(index, /id="accountBtn"[^>]*hidden/, "guest release must keep account entry hidden");
assert.match(index, /id="dataBtn"[^>]*>备份</, "local backup must be a visible top-level guest action");
assert.match(index, /<section class="task-center"/, "task center must remain the first primary work surface");
assert.match(index, /计划、目标与校准/, "secondary planning layer should have one clear calibration concept");
assert.match(index, /<details class="method-section">/, "method library must remain secondary and collapsed");
assert.match(index, /仅本机 · 可导出备份/, "guest release must clearly communicate local persistence");
assert.match(horizonsCss, /data-horizon-tab="insights"\]\{display:none\}/, "duplicate horizon insights entry must stay hidden while calibration owns cross-task insights");
assert.match(readability, /\.favorite,\.chip\[data-category="收藏"\],#fClear\{display:none\}/, "low-value favorites and destructive focus-history clearing must stay off the public surface");

console.log("ok: Toolbox stays task-first, guest-first, curated and free of unrelated project scope");
