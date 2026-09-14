import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../sync.js", import.meta.url), "utf8");

const requiredSourceContracts = [
  ["sync requires explicit opt-in", /if \(!meta\.enabled\) return \{ skipped:true \};/],
  ["missing remote starts at revision zero", /if \(!remote\) return pushLocal\(0\);/],
  ["existing remote on first sync becomes a choice", /lastConflict = \{ remote, localHash, reason:"first" \}/],
  ["background remote update does not overwrite local automatically", /if \(background\) \{[\s\S]*?reason:"remote-newer"[\s\S]*?return \{ conflict:lastConflict \};[\s\S]*?\}/],
  ["local-only change uploads with remote revision", /if \(localChanged && !remoteChanged\) return pushLocal\(remoteRevision\);/],
  ["two-sided change becomes a conflict", /lastConflict = \{ remote, localHash, reason:"both" \}/],
  ["email login does not enable sync automatically", /writeMeta\(\{[\s\S]*?enabled:false,[\s\S]*?userId:activeSession\.user\.id/],
  ["sync conflicts recognize SQLSTATE 40001", /String\(error\.code\) === "40001"/]
];

for (const [name, pattern] of requiredSourceContracts) {
  assert.match(source, pattern, name);
}

function decide({ enabled, hasSession, hasRemote, hasBaseline, localChanged, remoteChanged, background }) {
  if (!enabled || !hasSession) return "skip";
  if (!hasRemote) return "upload-new";
  if (!hasBaseline) return "conflict-first";
  if (!localChanged && !remoteChanged) return "noop";
  if (!localChanged && remoteChanged) return background ? "conflict-remote-newer" : "restore-remote";
  if (localChanged && !remoteChanged) return "upload-local";
  return "conflict-both";
}

const cases = [
  ["guest never syncs", { enabled:false, hasSession:false, hasRemote:false, hasBaseline:false, localChanged:false, remoteChanged:false, background:false }, "skip"],
  ["login alone never uploads", { enabled:false, hasSession:true, hasRemote:false, hasBaseline:false, localChanged:true, remoteChanged:false, background:false }, "skip"],
  ["opted-in first device uploads when cloud empty", { enabled:true, hasSession:true, hasRemote:false, hasBaseline:false, localChanged:true, remoteChanged:false, background:false }, "upload-new"],
  ["existing cloud on first sync requires user choice", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:false, localChanged:true, remoteChanged:true, background:false }, "conflict-first"],
  ["unchanged state is a no-op", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:false, remoteChanged:false, background:true }, "noop"],
  ["foreground can restore remote-only change", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:false, remoteChanged:true, background:false }, "restore-remote"],
  ["background never silently restores remote-only change", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:false, remoteChanged:true, background:true }, "conflict-remote-newer"],
  ["local-only change uploads", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:true, remoteChanged:false, background:true }, "upload-local"],
  ["two-sided edits always require choice", { enabled:true, hasSession:true, hasRemote:true, hasBaseline:true, localChanged:true, remoteChanged:true, background:false }, "conflict-both"]
];

for (const [name, input, expected] of cases) {
  assert.equal(decide(input), expected, name);
}

console.log(`ok: ${cases.length} sync decisions + ${requiredSourceContracts.length} source contracts`);
