import fs from "node:fs";
import assert from "node:assert/strict";

const publicConfig = fs.readFileSync(new URL("../cloud-public.js", import.meta.url), "utf8");
const syncSource = fs.readFileSync(new URL("../sync.js", import.meta.url), "utf8");
const diagnostics = fs.readFileSync(new URL("../cloud-diagnostics.js", import.meta.url), "utf8");
const index = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(publicConfig, /emailOtp:\s*false/, "public email OTP must stay disabled in the guest release");
assert.doesNotMatch(publicConfig, /wechatProvider|phoneOtp|sms/i, "reserved auth config must stay guest plus email only");
assert.match(publicConfig, /accountDeletionEnabled:\s*true/, "account deletion backend may remain prepared for a future account release");

assert.doesNotMatch(index, /id="accountBtn"/, "guest release must not render an account entry");
for (const dormant of ["cloud-public.js","cloud-config.js","sync-policy.js","sync.js","account-lifecycle.js","cloud-diagnostics.js","cloud.css"]) {
  assert.equal(index.includes(`./${dormant}`), false, `guest runtime must not load dormant account asset: ${dormant}`);
}
assert.match(syncSource, /const emailOtpEnabled = config\.emailOtp === true;/, "email OTP must require explicit product enablement");
assert.match(syncSource, /不登录也能完整使用 Toolbox/, "guest-first behavior must remain explicit in the dormant account flow");
assert.match(syncSource, /邮箱登录只用于跨设备同步，不会先上传本机数据/, "future email login must not imply upload");
assert.match(syncSource, /signInWithOtp/, "reserved email OTP request flow must remain available");
assert.match(syncSource, /verifyOtp/, "reserved email OTP verification flow must remain available");
assert.match(syncSource, /enabled:false/, "future login must leave sync disabled until explicit opt-in");
assert.doesNotMatch(syncSource, /微信|wechat|signInWithOAuth|phoneOtp|type:\s*"sms"/i, "reserved consumer auth must stay email-only when accounts are eventually enabled");

assert.doesNotMatch(index, /sb_publishable_|service_role|sb_secret_/i, "HTML must not expose cloud credentials directly");
assert.doesNotMatch(index, /Supabase|OAuth callback|publishable key/i, "normal product surface must not mention developer cloud setup");
assert.match(diagnostics, /debug=cloud|cloud/i, "developer diagnostics may remain in the repository for a future account release");

console.log("ok: public runtime is local-only guest mode; email auth remains dormant and explicitly gated");
