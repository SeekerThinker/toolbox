import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../sync.js", import.meta.url), "utf8");
const policySource = fs.readFileSync(new URL("../sync-policy.js", import.meta.url), "utf8");

const context = {};
vm.createContext(context);
vm.runInContext(policySource, context, { filename:"sync-policy.js" });
const policy = context.ToolboxSyncPolicy;
assert.ok(policy?.decide && policy?.ACTIONS, "production sync policy must load");

const requiredSourceContracts = [
  ["sync requires explicit opt-in", /if \(!meta\.enabled\) return \{ skipped:true \};/],
  ["production uses the shared policy", /const action = syncPolicy\.decide\(/],
  ["first cloud conflict is rendered from policy action", /case syncPolicy\.ACTIONS\.CONFLICT_FIRST:/],
  ["background remote conflict is rendered from policy action", /case syncPolicy\.ACTIONS\.CONFLICT_REMOTE_NEWER:/],
  ["local-only upload is rendered from policy action", /case syncPolicy\.ACTIONS\.UPLOAD_LOCAL:/],
  ["two-sided conflict is rendered from policy action", /case syncPolicy\.ACTIONS\.CONFLICT_BOTH:/],
  ["email login does not enable sync automatically", /writeMeta\(\{[\s\S]*?enabled:false,[\s\S]*?userId:activeSession\.user\.id/],
  ["sync conflicts recognize SQLSTATE 40001", /String\(error\.code\) === "40001"/]
];

for (const [name, pattern] of requiredSourceContracts) {
  assert.match(source, pattern, name);
}

const { ACTIONS, decide } = policy;
const cases = [
  ["guest never syncs", { enabled:false, hasSession:false, hasRemote:false, hasBaseline:false, localChanged:false, remoteChanged:false, background:false }, ACTIONS.SKIP],
  ["login alone never uploads", { enabled:false, hasSession:true, hasRemote:false, hasBaseline:false, localChanged:true, remoteChanged:false, background:false }, ACTIONS.SKIP],
  ["opted-in first device uploads when cloud empty", { enabled:true, hasSession:true, hasRemote:false, hasBaseline:false, localChanged:true, remoteChanged:false, background:false }, ACTIONS.UPLOAD_NEW],
  ["existing cloud on first sync requires user choice", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:false, localChanged:true, remoteChanged:true, background:false }, ACTIONS.CONFLICT_FIRST],
  ["unchanged state is a no-op", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:false, remoteChanged:false, background:true }, ACTIONS.NOOP],
  ["foreground can restore remote-only change", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:false, remoteChanged:true, background:false }, ACTIONS.RESTORE_REMOTE],
  ["background never silently restores remote-only change", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:false, remoteChanged:true, background:true }, ACTIONS.CONFLICT_REMOTE_NEWER],
  ["local-only change uploads", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:true, remoteChanged:false, background:true }, ACTIONS.UPLOAD_LOCAL],
  ["two-sided edits always require choice", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:true, remoteChanged:true, background:false }, ACTIONS.CONFLICT_BOTH]
];

for (const [name, input, expected] of cases) {
  assert.equal(decide(input), expected, name);
}

console.log(`ok: production policy drives ${cases.length} sync decisions + ${requiredSourceContracts.length} source contracts`);
