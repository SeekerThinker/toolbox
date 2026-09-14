import fs from "node:fs";

const files=["core.js","cloud-public.js","cloud-config.js","sync-policy.js","sync.js","account-lifecycle.js","cloud-diagnostics.js","tools-focus.js","tools-thinking.js","tasks.js","horizons.js","calibration.js"];
const index=fs.readFileSync("index.html","utf8");
for(const file of files){
  if(!fs.existsSync(file))throw new Error(`missing ${file}`);
  if(!index.includes(`./${file}`))throw new Error(`index does not load ${file}`);
}
for(const css of ["horizons.css","calibration.css","cloud.css"]){if(!fs.existsSync(css)||!index.includes(`./${css}`))throw new Error(`missing style ${css}`);}
const source=files.map(file=>fs.readFileSync(file,"utf8")).join("\n");
const tasks=fs.readFileSync("tasks.js","utf8");
const thinking=fs.readFileSync("tools-thinking.js","utf8");
const focus=fs.readFileSync("tools-focus.js","utf8");
const horizons=fs.readFileSync("horizons.js","utf8");
const calibration=fs.readFileSync("calibration.js","utf8");
const syncPolicy=fs.readFileSync("sync-policy.js","utf8");
const sync=fs.readFileSync("sync.js","utf8");
const lifecycle=fs.readFileSync("account-lifecycle.js","utf8");
const diagnostics=fs.readFileSync("cloud-diagnostics.js","utf8");
const cloudConfig=fs.readFileSync("cloud-config.js","utf8");
const cloudPublic=fs.readFileSync("cloud-public.js","utf8");
const migrationPath="supabase/migrations/20260914023912_create_toolbox_sync_table.sql";
const migration=fs.readFileSync(migrationPath,"utf8");
const expectedMigrations=[
  "20260914023912_create_toolbox_sync_table.sql",
  "20260914023934_secure_toolbox_sync.sql",
  "20260914023947_add_toolbox_push.sql"
];
const migrations=fs.readdirSync("supabase/migrations").filter(name=>name.endsWith(".sql")).sort();
const supabaseConfig=fs.readFileSync("supabase/config.toml","utf8");
const deleteAccount=fs.readFileSync("supabase/functions/delete-account/index.ts","utf8");
const deleteAccountDeno=fs.readFileSync("supabase/functions/delete-account/deno.json","utf8");
const gitignore=fs.readFileSync(".gitignore","utf8");
const ids=[...source.matchAll(/registerTool\(\{\s*id:\s*"([^"]+)"/g)].map(m=>m[1]);

if(ids.length!==8)throw new Error(`expected 8 methods, found ${ids.length}`);
if(new Set(ids).size!==ids.length)throw new Error("duplicate tool ids");
if(ids.includes("braindump")||ids.includes("eisenhower"))throw new Error("capture/matrix should be native task capabilities");
if(/DeskKit/.test(source)||/DeskKit/.test(index))throw new Error("legacy brand remains in active source");
if(index.includes("word-writing-templates"))throw new Error("obsolete word template module leaked back into the core product");
if(!index.includes('<textarea id="taskInput"')||!index.includes('id="taskFilterMatrix"'))throw new Error("native capture or matrix view is missing");
if(!index.includes('id="horizonMount"')||!index.includes('id="calibrationMount"'))throw new Error("planning or calibration layer is missing");
if(!index.includes('id="accountBtn"'))throw new Error("optional account entry is missing");
if(!index.includes('<details class="method-section">'))throw new Error("method library should remain secondary");

for(const field of ["outcome","nextAction","estimateMinutes","plannedAt","obstacle","ifThen","priority","reflection"]){
  if(!tasks.includes(field))throw new Error(`optional task field missing: ${field}`);
}
if(!tasks.includes('data-task-tool="pomodoro"')||!tasks.includes('data-task-tool="focuslog"'))throw new Error("task cannot start focus directly");
if(!tasks.includes("标记完成")||tasks.includes("完成并复盘"))throw new Error("completion should not force reflection");
if(!tasks.includes('class="task-capability"')||!tasks.includes("按需填写")||!tasks.includes("需要时调用"))throw new Error("progressive disclosure for optional capabilities is missing");
if(!tasks.includes("未分类 · 可选")||!tasks.includes('value=""'))throw new Error("priority must remain optional");
if(!tasks.includes("可选建议")||!tasks.includes("suggestionFor"))throw new Error("metacognitive guidance should be optional");

if(!thinking.includes("Decision Journal")||!thinking.includes("confidence")||!thinking.includes("disconfirm")||!thinking.includes("reviewAt"))throw new Error("decision journal is incomplete");
if(!thinking.includes("原因探索")||!thinking.includes("反证 / 其他解释")||!thinking.includes("下一步验证"))throw new Error("evidence-aware cause exploration is missing");
if(!thinking.includes("taskEffortMinutes")||!thinking.includes("实际专注"))throw new Error("review does not read task execution history");
if(!focus.includes("taskAction")||!focus.includes("plannedAction")||!focus.includes("taskId"))throw new Error("focus sessions are not linked to task context");

for(const token of ["planning","periods","goals","checkins","day","week","month","year"]){if(!horizons.includes(token))throw new Error(`planning layer missing token: ${token}`);}
if(!horizons.includes("目标打卡")||!horizons.includes("关联任务"))throw new Error("goal check-in or task linking is missing");

for(const token of ["estimateStats","repeatedObstacles","focusPattern","targetPerWeek","reviewOutcome","reviewFit","reviewedAt","data-write-period-facts"]){
  if(!calibration.includes(token))throw new Error(`calibration layer missing token: ${token}`);
}
if(!calibration.includes('t.status==="done"&&t.estimateMinutes'))throw new Error("estimate calibration must use completed tasks, not unfinished tasks");
if(!calibration.includes("不等于已经找到根因")||!calibration.includes("不代表这个时段一定更高效"))throw new Error("metacognitive observations need uncertainty boundaries");
if(!calibration.includes("把事实写入回顾")||!calibration.includes("我的调整"))throw new Error("plan → actual → adjustment loop is incomplete");
if(!calibration.includes("当时置信度 ≥70%")||!calibration.includes("保存回看"))throw new Error("decision calibration loop is incomplete");

if(!index.includes('src="./cloud-public.js"')||index.indexOf('src="./cloud-public.js"')>index.indexOf('src="./cloud-config.js"'))throw new Error("public deployment config must load before cloud config");
if(index.indexOf('src="./sync-policy.js"')<0||index.indexOf('src="./sync-policy.js"')>index.indexOf('src="./sync.js"'))throw new Error("shared sync policy must load before sync I/O");
if(!cloudPublic.includes("publishableKey")||!cloudPublic.includes("emailOtp"))throw new Error("public email auth deployment config is incomplete");
if(/wechatProvider|phoneOtp|sms/i.test(cloudPublic))throw new Error("public auth deployment config must stay email-only");
if(/sb_secret_|service_role/.test(cloudPublic))throw new Error("public deployment config must never contain privileged credentials");
if(!cloudConfig.includes("ToolboxPublicCloudConfig")||!cloudConfig.includes("debugMode")||!cloudConfig.includes("emailOtp"))throw new Error("cloud config must separate product deployment from debug setup");
for(const token of ["UPLOAD_NEW","CONFLICT_FIRST","CONFLICT_REMOTE_NEWER","UPLOAD_LOCAL","CONFLICT_BOTH"]){
  if(!syncPolicy.includes(token))throw new Error(`sync policy missing action: ${token}`);
}
if(!sync.includes("syncPolicy.decide")||!sync.includes("syncPolicy.ACTIONS"))throw new Error("production sync must use the shared conflict policy");
for(const token of ["flowType: \"pkce\"","toolbox:data-changed","lastSyncedHash","lastSyncedRevision","SYNC_CONFLICT","开始同步","本机和云端"]){
  if(!sync.includes(token))throw new Error(`sync layer missing token: ${token}`);
}
for(const token of ["当前：直接使用","不登录也能完整使用","signInWithOtp","verifyOtp","邮箱登录"]){
  if(!sync.includes(token))throw new Error(`guest-first email auth missing token: ${token}`);
}
if(/微信|wechat|使用 GitHub 登录|signInWithOAuth|type:\s*"sms"/i.test(sync))throw new Error("consumer auth must remain guest plus email only");
if(!sync.includes("enabled:false")||!sync.includes("不会先上传本机数据"))throw new Error("cloud upload must remain explicit after login");
if(!diagnostics.includes("if (!config.debugMode) return")||!diagnostics.includes("开发者连接自检"))throw new Error("Supabase setup must remain developer-only");

if(fs.existsSync("supabase/schema.sql"))throw new Error("database schema must live in versioned migrations, not a second schema.sql source");
if(JSON.stringify(migrations)!==JSON.stringify(expectedMigrations))throw new Error(`migration history drift: ${migrations.join(", ")}`);
if(!/enable row level security/i.test(migration)||!migration.includes("auth.uid()")||!/security invoker/i.test(migration))throw new Error("cloud migration must enforce authenticated per-user RLS");
if(!migration.includes("expected_revision")||!migration.includes("sync_conflict"))throw new Error("cloud writes need optimistic concurrency protection");
if(!migration.includes("on delete cascade"))throw new Error("deleting an auth user should cascade to synced Toolbox data");
if(!supabaseConfig.includes('project_id = "toolbox"')||!supabaseConfig.includes("additional_redirect_urls")||!supabaseConfig.includes("[functions.delete-account]")||!supabaseConfig.includes("verify_jwt = true"))throw new Error("Supabase CLI config is incomplete");

if(!lifecycle.includes("delete-account")||!lifecycle.includes("删除账号及云端数据")||!lifecycle.includes("当前浏览器里的本地数据会保留"))throw new Error("account deletion lifecycle is incomplete");
if(!deleteAccount.includes('withSupabase({ auth: "user" }')||!deleteAccount.includes("ctx.supabaseAdmin.auth.admin.deleteUser")||!deleteAccount.includes("ctx.userClaims"))throw new Error("account deletion must use authenticated server-side Supabase context");
if(/SUPABASE_SECRET_KEYS|sb_secret_|service_role/.test(deleteAccount))throw new Error("server credentials should be provided by Supabase context, not handled in function source");
if(!deleteAccountDeno.includes('"@supabase/server": "npm:@supabase/server"'))throw new Error("Edge Function dependency map is missing");
if(!gitignore.includes("supabase/functions/.env")||!gitignore.includes("supabase/.temp/"))throw new Error("local Supabase secrets/state must be ignored");

console.log(`ok: ${ids.length} methods, guest-plus-email auth, shared sync policy, calibration, aligned migrations and account lifecycle enabled`);
