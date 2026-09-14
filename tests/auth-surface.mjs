import fs from "node:fs";
import assert from "node:assert/strict";

const publicConfig = fs.readFileSync(new URL("../cloud-public.js", import.meta.url), "utf8");
const syncSource = fs.readFileSync(new URL("../sync.js", import.meta.url), "utf8");
const diagnostics = fs.readFileSync(new URL("../cloud-diagnostics.js", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(publicConfig, /emailOtp:\s*false/, "public email OTP must stay hidden until SMTP is production-ready");
assert.match(publicConfig, /wechatProvider:\s*""/, "WeChat must stay hidden until a provider is configured");
assert.match(publicConfig, /accountDeletionEnabled:\s*true/, "account deletion is enabled because the Edge Function is deployed");

assert.match(syncSource, /不登录也能完整使用 Toolbox/, "guest-first message must remain explicit");
assert.match(syncSource, /登录只用于跨设备同步，不会先上传本机数据/, "login must not imply upload");
assert.match(syncSource, /wechatProvider\s*\?/, "WeChat button must be conditional");
assert.match(syncSource, /emailOtpEnabled\s*\?/, "email login block must be conditional");
assert.match(syncSource, /enabled:false/, "login must leave sync disabled until explicit opt-in");

assert.doesNotMatch(index, /sb_publishable_|service_role|sb_secret_/i, "HTML must not expose cloud credentials directly");
assert.doesNotMatch(index, /Supabase|OAuth callback|publishable key/i, "normal product surface must not mention developer cloud setup");

assert.match(diagnostics, /debug=cloud|cloud/i, "developer diagnostics may exist behind an explicit debug path");

console.log("ok: guest-first auth surface stays zero-config and provider-gated");
