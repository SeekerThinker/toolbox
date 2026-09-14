import fs from "node:fs";
import assert from "node:assert/strict";

const config = fs.readFileSync(new URL("../supabase/config.toml", import.meta.url), "utf8");
const template = fs.readFileSync(new URL("../supabase/templates/magic_link.html", import.meta.url), "utf8");

assert.match(config, /\[auth\.email\.template\.magic_link\]/, "magic-link template config must exist");
assert.match(config, /subject\s*=\s*"Toolbox 登录验证码"/, "email subject should stay product-specific");
assert.match(config, /content_path\s*=\s*"\.\/supabase\/templates\/magic_link\.html"/, "config must point to the OTP template");

assert.match(template, /\{\{\s*\.Token\s*\}\}/, "email must contain the one-time code token");
assert.doesNotMatch(template, /ConfirmationURL|TokenHash/, "OTP email must not silently become a magic-link flow");
assert.match(template, /如果不是你本人发起的登录/, "email should include a minimal unsolicited-login notice");

console.log("ok: email OTP template stays code-based and product-owned");
