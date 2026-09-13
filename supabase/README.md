# Toolbox 云同步配置

Toolbox 的本地模式不依赖云端。只有站点维护者配置本目录中的 Supabase 后端后，“账号”入口才会启用真实登录与同步。

## 1. 创建 Supabase 项目

创建项目后，在 SQL Editor 中执行 `schema.sql`。

该脚本会创建：

- `toolbox_sync`：每个用户一行 JSON 数据；
- Row Level Security：登录用户只能读写自己的 `user_id`；
- `toolbox_push`：使用 `revision` 做乐观并发控制，防止两台设备无提示互相覆盖；
- `auth.users → toolbox_sync` 的 `ON DELETE CASCADE`：删除账号身份时自动删除同步数据。

## 2. 配置站点 URL 与 OAuth 回调

在 Supabase Auth 的 URL Configuration 中设置：

```text
Site URL
https://seekerthinker.github.io/toolbox/

Redirect URLs
https://seekerthinker.github.io/toolbox/
http://localhost:8080/
```

生产环境必须把实际 `redirectTo` 地址加入 Redirect URLs，否则 OAuth 登录完成后无法回到 Toolbox。

## 3. 配置 GitHub / Google 登录

在 Supabase Auth 中启用需要的 OAuth provider。

以 GitHub 为例：

1. 在 Supabase 的 GitHub provider 页面复制 Callback URL；
2. 在 GitHub 创建 OAuth App；
3. Homepage URL 填 Toolbox 站点；
4. Authorization callback URL 填 Supabase 提供的 callback URL，形如：

```text
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

5. 把 GitHub Client ID / Client Secret 填回 Supabase Auth provider 配置。

Google 同理，由 provider 控制台把回调地址指向 Supabase。

## 4. 填写浏览器配置

编辑仓库根目录的 `cloud-config.js`：

```js
window.ToolboxCloudConfig = Object.freeze({
  provider: "supabase",
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "sb_publishable_...",
  oauthProviders: ["github", "google"]
});
```

这里只允许放 **Project URL + publishable key**。publishable key 本来就是浏览器端凭据，真正的数据边界由登录身份和 RLS 控制。

不要把 `sb_secret_...`、legacy `service_role` key、OAuth Client Secret 或数据库密码写进静态前端或 Git 仓库。

## 5. 部署账号删除 Edge Function

仓库包含：

```text
supabase/functions/delete-account/index.ts
```

它完成完整账号删除：

1. 从调用请求读取当前用户 JWT；
2. 用 Supabase Auth 验证 JWT 并得到当前用户；
3. 只在 Edge Function 服务端读取 `SUPABASE_SECRET_KEYS`；
4. 调用 `auth.admin.deleteUser(user.id)`；
5. `toolbox_sync` 通过外键级联自动删除。

使用 Supabase CLI 部署：

```bash
supabase functions deploy delete-account
```

Edge Functions 托管环境会提供 `SUPABASE_URL`、`SUPABASE_PUBLISHABLE_KEYS` 和 `SUPABASE_SECRET_KEYS`。不要把 secret key 手动复制进函数源码。

部署后，账号面板会在“云端数据管理”下提供两种不同操作：

- **删除我的云端同步数据**：删除云端副本，但保留登录身份；
- **删除账号及云端数据**：永久删除 Supabase Auth 身份和云端数据，本机数据保留。

## 6. 同步行为

- 未登录：完全本地使用；
- 已登录但未点“开始同步”：仍然不上传本地数据；
- 第一次同步且云端为空：上传本机数据；
- 只有云端发生变化：前台同步时恢复云端；
- 只有本机发生变化：上传本机；
- 本机和云端都变化：要求用户选择，不自动覆盖；
- 所有云端数据都由同一用户的 RLS 规则隔离；
- 删除账号不会删除当前浏览器里的 `toolbox:data:v1` 本地工作台。

## 7. 上线前检查

至少验证以下场景：

```text
未登录 → 本地任务完整可用
登录 → 未开启同步 → 云端无数据变化
首次同步 → 本机上传成功
第二设备登录 → 可恢复云端数据
两设备分别修改 → 出现冲突选择，不静默覆盖
删除云端同步数据 → 本地数据保留
删除账号及云端数据 → Auth 用户与 toolbox_sync 行消失，本地数据保留
```

`cloud-config.js` 未填写时，线上站点会继续显示本地模式，账号面板只提示云同步尚未配置。
