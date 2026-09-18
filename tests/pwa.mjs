import fs from "node:fs";

const index = fs.readFileSync("index.html", "utf8");
const manifest = JSON.parse(fs.readFileSync("manifest.webmanifest", "utf8"));
const pwa = fs.readFileSync("pwa.js", "utf8");
const capture = fs.readFileSync("capture.js", "utf8");
const sw = fs.readFileSync("sw.js", "utf8");

for (const file of ["manifest.webmanifest", "pwa.js", "capture.js", "sw.js", "readability.css", "pwa-icon-192.svg", "pwa-icon-512.svg"]) {
  if (!fs.existsSync(file)) throw new Error(`missing PWA asset: ${file}`);
}

if (!index.includes('rel="manifest" href="./manifest.webmanifest"')) throw new Error("manifest is not linked from index");
if (!index.includes('href="./readability.css"')) throw new Error("readability refinements are not linked from index");
if (!index.includes('src="./pwa.js"') || !index.includes('src="./capture.js"')) throw new Error("PWA bootstrap or capture handler is not loaded");
for (const dormant of ["cloud-public.js","cloud-config.js","sync-policy.js","sync.js","account-lifecycle.js","cloud-diagnostics.js","cloud.css"]) {
  if (index.includes(`./${dormant}`)) throw new Error(`guest runtime must not load dormant cloud asset: ${dormant}`);
}
if (manifest.name !== "Toolbox" || manifest.short_name !== "Toolbox") throw new Error("PWA brand must remain Toolbox");
if (manifest.start_url !== "./" || manifest.scope !== "./") throw new Error("PWA must stay inside the GitHub Pages subpath");
if (manifest.display !== "standalone") throw new Error("PWA should launch as a standalone app");

const sizes = new Set((manifest.icons || []).map(icon => icon.sizes));
if (!sizes.has("192x192") || !sizes.has("512x512")) throw new Error("manifest needs 192 and 512 icons");
if (!pwa.includes("beforeinstallprompt") || !pwa.includes('navigator.serviceWorker.register("./sw.js"')) throw new Error("PWA install flow is incomplete");

const quickCapture = (manifest.shortcuts || []).find(shortcut => shortcut.url === "./?capture=1");
if (!quickCapture || !quickCapture.name.includes("待办")) throw new Error("PWA quick-capture shortcut is missing");
if (manifest.share_target?.action !== "./share-target" || manifest.share_target?.method !== "POST" || manifest.share_target?.enctype !== "multipart/form-data") throw new Error("PWA share target must use a private POST handoff");
for (const key of ["title", "text", "url"]) {
  if (manifest.share_target?.params?.[key] !== key) throw new Error(`share target missing ${key}`);
}
for (const token of ['params.get("capture")', 'mode !== "shared"', 'toolbox-share-inbox-v1', '#taskInput', "history.replaceState", "确认后添加"]) {
  if (!capture.includes(token)) throw new Error(`capture handler missing token: ${token}`);
}
if (/params\.get\("(?:title|text|url)"\)|\.click\(\)|storage\.set|addTask/i.test(capture)) throw new Error("shared content must not travel in URL params or auto-create a task");

for (const token of ["toolbox-shell-v8", "toolbox-share-inbox-v1", 'request.method === "POST"', 'url.pathname.endsWith("/share-target")', "request.formData()", "SHARE_ENTRY", '"./readability.css"', '"./capture.js"']) {
  if (!sw.includes(token)) throw new Error(`service worker missing token: ${token}`);
}
for (const dormant of ["cloud-public.js","cloud-config.js","sync-policy.js","sync.js","account-lifecycle.js","cloud-diagnostics.js","cloud.css"]) {
  if (sw.includes(`"./${dormant}"`)) throw new Error(`guest app shell must not cache dormant cloud asset: ${dormant}`);
}
if (!sw.includes("networkFirst(request)") || !sw.includes("url.origin !== self.location.origin")) throw new Error("service worker network safety is incomplete");

console.log("ok: installable local-only PWA, offline shell, quick capture and privacy-safe share handoff enabled");
