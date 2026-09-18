import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const STORAGE_KEY = "toolbox:data:v1";
const original = {
  version: 1,
  preferences: { theme: "dark" },
  favorites: [],
  recent: [],
  tasks: { items: [{ id: "task-a", title: "保留已有任务" }], activities: [] },
  tools: { pomodoro: { history: [] } }
};
let persisted = JSON.stringify(original);
let failWrite = false;
const localStorage = {
  getItem(key) { return key === STORAGE_KEY ? persisted : null; },
  setItem(key, value) {
    assert.equal(key, STORAGE_KEY);
    if (failWrite) throw new Error("QuotaExceededError");
    persisted = value;
  }
};
const window = {};
vm.runInNewContext(fs.readFileSync("core.js", "utf8"), {
  localStorage,
  window,
  document: { addEventListener() {} },
  console
}, { filename: "core.js" });
const { storage } = window.Toolbox;

const before = storage.exportData();
for (const invalid of [
  "{}",
  "[]",
  "{bad-json",
  JSON.stringify({ ...original, version: 2 }),
  JSON.stringify({ ...original, tasks: {} }),
  JSON.stringify({ ...original, tasks: { items: {}, activities: [] } }),
  JSON.stringify({ ...original, tools: null })
]) {
  assert.throws(() => storage.importData(invalid), "invalid backup must be rejected");
  assert.equal(storage.exportData(), before, "invalid import must preserve in-memory data");
  assert.equal(persisted, JSON.stringify(original), "invalid import must preserve persisted data");
}

const replacement = {
  ...original,
  preferences: { theme: "light" },
  tasks: { items: [{ id: "task-b", title: "新任务" }], activities: [] }
};
failWrite = true;
assert.throws(() => storage.importData(JSON.stringify(replacement)), /QuotaExceededError/);
assert.equal(storage.exportData(), before, "failed persistence must not alter in-memory data");
assert.equal(persisted, JSON.stringify(original), "failed persistence must not alter previous backup");
failWrite = false;
assert.equal(storage.importData(JSON.stringify(replacement)).tasks.items[0].id, "task-b");
assert.equal(JSON.parse(persisted).tasks.items[0].title, "新任务");
assert.equal(storage.importData(storage.exportData()).tasks.items[0].id, "task-b", "export/import round trip must work");

console.log("ok: backup rejects unrelated or corrupt JSON and preserves data on failed writes");
