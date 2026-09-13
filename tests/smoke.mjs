import fs from "node:fs";

const files = ["core.js","tools-pdf.js","tools-focus.js","tools-thinking.js","tools-external.js"];
const index = fs.readFileSync("index.html","utf8");
for (const file of files) {
  if (!fs.existsSync(file)) throw new Error(`missing ${file}`);
  if (!index.includes(`./${file}`)) throw new Error(`index does not load ${file}`);
}

const source = files.map(file => fs.readFileSync(file,"utf8")).join("\n");
const ids = [...source.matchAll(/registerTool\(\{\s*id:\s*"([^"]+)"/g)].map(m => m[1]);
const unique = new Set(ids);
if (ids.length !== 12) throw new Error(`expected 12 tools, found ${ids.length}`);
if (unique.size !== ids.length) throw new Error("duplicate tool ids");
if (/DeskKit/.test(source) || /DeskKit/.test(index)) throw new Error("legacy brand remains in active source");
for (const legacy of ["tools-basic.js","tools-utility.js","tools-media.js","tools-practical.js","compact.css"]) {
  if (index.includes(legacy)) throw new Error(`legacy module is still loaded: ${legacy}`);
}
console.log(`ok: ${ids.length} tools, ${files.length} scripts`);
