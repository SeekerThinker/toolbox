# Toolbox 云同步配置

Toolbox 的本地模式不依赖云端。只有站点维护者配置 Supabase 项目后，“账号”入口才会启用真实登录与跨设备同步。

本目录使用标准 Supabase CLI 项目结构：

```text
supabase/
├── config.toml
├── migrations/
│   └── 20260913103000_create_toolbox_sync.sql
└── functions/
    └── delete-account/
        ├── deno.json
        └── index.ts
```

数据库 migration 是云端结构的唯一真相来源。进入 CLI 工作流后，不要再直接在生产 SQL Editor / Table Editor 中修改同一套结构，以免远端迁移历史和仓库失步。

## 1. 本地验证

安装 Supabase CLI 和 Docker 兼容运行时后，在仓库根目录执行：

```bash
supabase start
supabase db reset
```

`db reset` 会从 `supabase/migrations/` 重新建立数据库，用来验证迁移可以从零复现。

本地 Toolbox 页面仍可继续使用：

```bash
python3 -m http.server 8080
```

`supabase/config.toml` 已允许 `localhost:8080` / `127.0.0.1:8080` 的本地 Auth 回调。

## 2. 创建并连接远端项目

在 Supabase 创建项目后，可先从本地完成第一次连接：

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy delete-account
```

迁移会创建：

- `toolbox_sync`：每个用户一行 JSON 工作台数据；
- Row Level Security：登录用户只能读写自己的 `user_id`；
- `toolbox_push`：使用 `revision` 做乐观并发控制；
- `auth.users → toolbox_sync` 的 `ON DELETE CASCADE`：永久删除账号身份时自动删除同步数据。

以后数据库结构变化继续新增 migration，不覆盖旧 migration。

## 3. 生产部署工作流

仓库包含手动工作流：

```text
.github/workflows/deploy-supabase.yml
```

在 GitHub repository secrets 中配置：

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_PROJECT_ID
```

然后从 GitHub Actions 手动运行 `deploy-supabase`。工作流会：

```text
link project
→ db push --dry-run
→ db push
→ deploy delete-account
```

它故意没有设置为每次 push 自动部署；在云端项目、OAuth 和前端 `cloud-config.js` 尚未完成之前，不会误触发生产变更。需要自动发布时，再把触发条件升级为 main 分支部署。

## 4. 配置站点 URL 与 OAuth

在 Supabase Auth 的 URL Configuration 中设置：

```text
Site URL
https://seekerthinker.github.io/toolbox/

Redirect URLs
https://seekerthinker.github.io/toolbox/**
http://localhost:8080/**
http://127.0.0.1:8080/**
```

然后启用需要的 OAuth provider，例如 GitHub / Google。

以 GitHub 为例：

1. 在 Supabase GitHub provider 页面复制 Callback URL；
2. 在 GitHub 创建 OAuth App；
3. Homepage URL 填 Toolbox 站点；
4. Authorization callback URL 填 Supabase 提供的地址，例如：

```text
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

5. 把 GitHub Client ID / Client Secret 只填进 Supabase Auth provider 配置，不写入仓库。

## 5. 账号删除 Edge Function

`delete-account` 使用 `@supabase/server` 的 `auth: "user"` 上下文验证调用者，并通过 `ctx.supabaseAdmin` 在服务端删除当前用户身份。

Supabase 会给函数环境提供项目 URL、publishable keys、secret keys 和 JWT 验证配置；管理员 secret 不进入浏览器，也不硬编码到函数源码。

账号面板有两种不同操作：

- **删除我的云端同步数据**：只删除 `toolbox_sync` 云端副本，保留登录身份；
- **删除账号及云端数据**：永久删除 Auth 身份，并通过外键级联删除同步数据；当前浏览器本地工作台仍保留。

## 6. 填写浏览器配置

编辑仓库根目录 `cloud-config.js`：

```js
window.ToolboxCloudConfig = Object.freeze({
  provider: "supabase",
  url: "https://YOUR_PROJECT.supabase.co",
  publishableKey: "sb_publishable_...",
  oauthProviders: ["github", "google"]
});
```

这里只允许放 **Project URL + publishable key**。不要把 `sb_secret_...`、legacy `service_role` key、OAuth Client Secret 或数据库密码写进静态前端或 Git 仓库。

## 7. 同步行为

- 未登录：完全本地使用；
- 已登录但未点“开始同步”：不上传本地数据；
- 第一次同步且云端为空：上传本机数据；
- 只有云端变化：前台同步时恢复云端；
- 只有本机变化：上传本机；
- 本机和云端都变化：要求用户选择，不静默覆盖；
- RLS 将每位用户限制在自己的同步行；
- 删除账号不会删除当前浏览器里的 `toolbox:data:v1`。

## 8. 上线前检查

至少验证：

```text
未登录 → 本地任务完整可用
登录 → 未开启同步 → 云端无数据变化
首次同步 → 本机上传成功
第二设备登录 → 可恢复云端数据
两设备分别修改 → 出现冲突选择，不静默覆盖
删除云端同步数据 → 本地数据保留
删除账号及云端数据 → Auth 用户与 toolbox_sync 行消失，本地数据保留
```

`cloud-config.js` 未填写时，线上站点继续保持纯本地模式。
