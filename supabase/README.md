# Toolbox 云同步配置

Toolbox 的本地模式不依赖云端。只有站点维护者配置本目录中的 Supabase 后端后，“账号”入口才会启用真实登录与同步。

## 1. 创建 Supabase 项目

创建项目后，在 SQL Editor 中执行 `schema.sql`。

该脚本会创建：

- `toolbox_sync`：每个用户一行 JSON 数据；
- Row Level Security：登录用户只能读写自己的 `user_id`；
- `toolbox_push`：使用 `revision` 做乐观并发控制，防止两台设备无提示互相覆盖。

## 2. 配置登录提供方

在 Supabase Auth 中启用需要的 OAuth provider，例如 GitHub 或 Google。

站点回调地址至少加入：

```text
https://seekerthinker.github.io/toolbox/
```

本地调试时可另外加入本地地址。

## 3. 填写浏览器配置

编辑仓库根目录的 `cloud-config.js`：

```js
window.ToolboxCloudConfig = Object.freeze({
  provider: "supabase",
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "sb_publishable_...",
  oauthProviders: ["github", "google"]
});
```

这里只使用 Supabase 的 browser publishable key。不要在静态前端中放置任何高权限服务端凭据。

## 4. 同步行为

- 未登录：完全本地使用；
- 已登录但未点“开始同步”：仍然不上传本地数据；
- 第一次同步且云端为空：上传本机数据；
- 只有云端发生变化：前台同步时恢复云端；
- 只有本机发生变化：上传本机；
- 本机和云端都变化：要求用户选择，不自动覆盖；
- 所有云端数据都由同一用户的 RLS 规则隔离。

`cloud-config.js` 未填写时，线上站点会继续显示本地模式，账号面板只提示云同步尚未配置。
