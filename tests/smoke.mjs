import fs from "node:fs";

const files = ["core.js","tools-focus.js","tools-thinking.js"];
const index = fs.readFileSync("index.html","utf8");
for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  if (!index.includes(`./${file}`)) throw new Error(`index does not load ${file}`);
}

const source = files.map(file => fs.readFileSync(file,"utf8")).join("\n");
const ids = [...source.matchAll(/registerTool\(\{\s*id:\s*"([^"]+)"/g)].map(m => m[1]);
const unique = new Set(ids);
if (ids.length !== 10) throw new Error(`expected 10 tools, found ${ids.length}`);
if (unique.size !== ids.length) throw new Error("duplicate tool ids");
if (/DeskKit/.test(source) || /DeskKit/.test(index)) throw new Error("legacy brand remains in active source");
if (!index.includes('id="dataBtn"')) throw new Error("data backup entry is missing");
if (!source.includes("tools.review.history")) throw new Error("review history is missing");
if (!source.includes("tools.decision.history")) throw new Error("decision history is missing");
if (!source.includes("近 7 天")) throw new Error("focus trend summary is missing");

for (const removed of ["tools-pdf.js","tools-external.js","tools-practical.js","tools-basic.js","tools-utility.js","tools-media.js","compact.css","word-writing-templates/"]) {
  if (index.includes(removed)) throw new Error(`removed module or route is still loaded: ${removed}`);
}

console.log(`ok: ${ids.length} long-term tools, ${files.length} scripts, history and backup enabled`);
