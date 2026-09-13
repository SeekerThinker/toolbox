import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
const pwa = fs.readFileSync("pwa.js", "utf8");
const capture = fs.readFileSync("capture.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

for (const file of ["manifest.webmanifest", "pwa.js", "capture.js", "sw.js", "pwa-icon-192.svg", "pwa-icon-512.svg"]) {
  if (!fs.existsSync(file)) throw new Error(`missing PWA asset: ${file}`);
}

if (!index.includes('rel="manifest" href="./manifest.webmanifest"')) throw new Error("manifest is not linked from index");
if (!index.includes('src="./pwa.js"') || !index.includes('src="./capture.js"')) throw new Error("PWA bootstrap or capture handler is not loaded");
if (manifest.name !== "Toolbox" || manifest.short_name !== "Toolbox") throw new Error("PWA brand must remain Toolbox");
if (manifest.start_url !== "./" || manifest.scope !== "./") throw new Error("PWA must stay inside the GitHub Pages subpath");
if (manifest.display !== "standalone") throw new Error("PWA should launch as a standalone app");

const sizes = new Set((manifest.icons || []).map(icon => icon.sizes));
if (!sizes.has("192x192") || !sizes.has("512x512")) throw new Error("manifest needs 192 and 512 icons");
if (!pwa.includes("beforeinstallprompt") || !pwa.includes('navigator.serviceWorker.register("./sw.js"')) throw new Error("PWA install flow is incomplete");

const quickCapture = (manifest.shortcuts || []).find(shortcut => shortcut.url === "./?capture=1");
if (!quickCapture || !quickCapture.name.includes("待办")) throw new Error("PWA quick-capture shortcut is missing");
if (manifest.share_target?.action !== "./?capture=share" || manifest.share_target?.method !== "GET") throw new Error("PWA share target is missing or unsafe");
for (const key of ["title", "text", "url"]) {
  if (manifest.share_target?.params?.[key] !== key) throw new Error(`share target missing ${key}`);
}
for (const token of ['params.get("capture")', 'mode === "share"', '#taskInput', "history.replaceState", "确认后添加"]) {
  if (!capture.includes(token)) throw new Error(`capture handler missing token: ${token}`);
}
if (/\.click\(\)|storage\.set|addTask/i.test(capture)) throw new Error("shared content must be confirmed before creating a task");

if (!sw.includes("toolbox-shell-v2") || !sw.includes("request.mode === \"navigate\"") || !sw.includes('"./capture.js"')) throw new Error("offline app shell is incomplete");
if (!sw.includes('url.pathname.endsWith("/cloud-config.js")') || !sw.includes("networkFirst(request)")) throw new Error("cloud config must stay network-first");
if (!sw.includes("url.origin !== self.location.origin")) throw new Error("service worker must not cache third-party requests");

console.log("ok: installable PWA, offline cache, quick capture and safe share target enabled");
