import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const read = file => fs.readFileSync(file, "utf8");
const readme = read("README.md");
const agents = read("AGENTS.md");
const context = read("docs/PROJECT_CONTEXT.md");
const index = read("index.html");
const sw = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

// A new collaborator must be able to follow the documented entry points.
assert.match(readme, /\[AGENTS\.md\]\(AGENTS\.md\)/);
assert.match(readme, /\[项目上下文\]\(docs\/PROJECT_CONTEXT\.md\)/);
for (const [file, body] of [["README.md", readme], ["AGENTS.md", agents], ["docs/PROJECT_CONTEXT.md", context]]) {
  for (const [, target] of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    if (/^(?:https?:|mailto:|#)/i.test(target)) continue;
    const local = target.split("#")[0];
    if (!local) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(local));
    assert.ok(resolved.startsWith(process.cwd() + path.sep), `${file}: link escapes repository: ${target}`);
    assert.ok(fs.existsSync(resolved), `${file}: broken local link: ${target}`);
  }
}

// A written guest-only promise must match what the browser actually loads.
assert.match(context, /游客版/);
assert.match(context, /未对公众启用/);
assert.match(agents, /最新源码和测试/);
assert.match(agents, /不自动上传/);
assert.doesNotMatch(index, /accountBtn|src="\.\/(?:sync|cloud-[^"/]+|account-lifecycle)\.js"|href="\.\/cloud\.css"/i);
assert.match(index, /仅本机 · 可导出备份/);
assert.equal(manifest.name, "Toolbox");
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");

// Offline packaging must match actual page dependencies, not a stale hand-written list.
const shellMatch = sw.match(/const APP_SHELL = (\[[\s\S]*?\]);/);
assert.ok(shellMatch, "service worker must declare APP_SHELL");
const shell = JSON.parse(shellMatch[1]);
assert.equal(new Set(shell).size, shell.length, "offline shell must not contain duplicate assets");
const pageAssets = [...index.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(\.\/[^"?#]+)"/g)].map(x => x[1]);
for (const asset of pageAssets) assert.ok(shell.includes(asset), `page asset not cached offline: ${asset}`);
for (const asset of shell) {
  if (asset === "./") continue;
  assert.ok(asset.startsWith("./") && fs.existsSync(asset.slice(2)), `missing shell asset: ${asset}`);
  assert.doesNotMatch(asset, /cloud|sync|account-lifecycle/i, `guest PWA must not precache dormant cloud module: ${asset}`);
}

console.log("ok: handoff links, guest release claims and offline asset manifest match source");
