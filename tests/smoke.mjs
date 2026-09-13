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
for (const removed of ["tools-pdf.js","tools-external.js","tools-practical.js","tools-basic.js","tools-utility.js","tools-media.js","compact.css"]) {
  if (index.includes(removed)) throw new Error(`removed module is still loaded: ${removed}`);
}

const wizardFiles = [
  "word-writing-templates/index.html",
  "word-writing-templates/styles.css",
  "word-writing-templates/app.js"
];
for (const file of wizardFiles) {
  if (!fs.existsSync(file)) throw new Error(`missing wizard file: ${file}`);
}
const wizardIndex = fs.readFileSync(wizardFiles[0], "utf8");
const wizardApp = fs.readFileSync(wizardFiles[2], "utf8");
if (!wizardIndex.includes("./app.js") || !wizardIndex.includes("./styles.css")) throw new Error("wizard assets are not linked");
if (!index.includes("./word-writing-templates/")) throw new Error("Toolbox does not index the Word template wizard");
for (const id of ["book-cn-traditional","book-chapter-decimal","book-pure-decimal","article-cn-academic","article-decimal","article-cn-compact"]) {
  if (!wizardApp.includes(id)) throw new Error(`wizard missing template option: ${id}`);
}
for (const name of ["Word-Writing-Templates-Windows.zip","Word-Writing-Templates-macOS.zip"]) {
  if (!wizardApp.includes(name)) throw new Error(`wizard missing stable download: ${name}`);
}

console.log(`ok: ${ids.length} tools, ${files.length} core scripts, Word template wizard present`);
