(() => {
  "use strict";

  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm";
  const config = window.ToolboxCloudConfig || {};
  const urlReady = config.provider === "supabase" && /^https:\/\//.test(config.url || "");
  const keyReady = /^sb_publishable_/.test(config.publishableKey || "");
  const configured = urlReady && keyReady;
  const runtimeKeyStorage = config.runtimeKeyStorage || "toolbox:supabase:publishable-key";
  let clientPromise = null;

  const getClient = async () => {
    if (!configured) throw new Error("Project URL 或 publishable key 尚未配置");
    if (!clientPromise) {
      clientPromise = import(SDK_URL).then(({ createClient }) => createClient(config.url, config.publishableKey, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "toolbox:supabase:auth:v1"
        }
      }));
    }
    return clientPromise;
  };

  const row = (name, state, detail) => `<div class="cloud-check ${state}"><strong>${name}</strong><span>${detail}</span></div>`;

  const renderBootstrap = mount => {
    if (!urlReady || keyReady) return;
    mount.insertAdjacentHTML("beforeend", `<div class="cloud-key-setup">
      <label class="field"><span class="help-text">Supabase Publishable Key</span><input class="text-input" data-cloud-key-input type="password" autocomplete="off" placeholder="sb_publishable_…"></label>
      <div class="toolbar"><button class="primary-btn" data-save-cloud-key type="button">连接这台设备</button></div>
      <span class="help-text">在 Supabase → Settings → API Keys 复制 default Publishable key。这里只接受浏览器公开的 <code>sb_publishable_…</code>；不要粘贴 <code>sb_secret_…</code>、service_role 或数据库密码。这个值只保存在当前浏览器。</span>
    </div>`);
    const input = mount.querySelector("[data-cloud-key-input]");
    const button = mount.querySelector("[data-save-cloud-key]");
    button.onclick = () => {
      const value = String(input.value || "").trim();
      if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) {
        if (window.Toolbox?.toast) Toolbox.toast("请输入 sb_publishable_ 开头的 Publishable Key");
        return;
      }
      try {
        localStorage.setItem(runtimeKeyStorage, value);
        if (window.Toolbox?.toast) Toolbox.toast("连接配置已保存，正在重新加载");
        setTimeout(() => location.reload(), 250);
      } catch {
        if (window.Toolbox?.toast) Toolbox.toast("当前浏览器无法保存本地连接配置");
      }
    };
  };

  const runChecks = async mount => {
    const rows = [];
    rows.push(row("Project URL", urlReady ? "ok" : "bad", urlReady ? "已指向 Toolbox 的 Supabase 项目" : "尚未配置"));
    rows.push(row("Publishable Key", keyReady ? "ok" : "bad", keyReady ? "当前浏览器已配置" : "尚未配置；登录同步暂不可用"));
    if (!configured) {
      mount.innerHTML = rows.join("");
      renderBootstrap(mount);
      return;
    }

    let client;
    try {
      client = await getClient();
      rows.push(row("Supabase SDK", "ok", "初始化成功"));
    } catch (error) {
      rows.push(row("Supabase SDK", "bad", error.message || "初始化失败"));
      mount.innerHTML = rows.join("");
      return;
    }

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      rows.push(row("登录会话", "bad", sessionError.message));
      mount.innerHTML = rows.join("");
      return;
    }
    const session = sessionData.session;
    if (!session) {
      rows.push(row("登录会话", "idle", "尚未登录；登录后可继续检查数据库与 Edge Function"));
      mount.innerHTML = rows.join("");
      return;
    }
    rows.push(row("登录会话", "ok", "当前会话有效"));

    try {
      const { error } = await client.from("toolbox_sync").select("revision").limit(1);
      if (error) throw error;
      rows.push(row("数据库 / RLS", "ok", "toolbox_sync 可访问，RLS 请求通过"));
    } catch (error) {
      rows.push(row("数据库 / RLS", "bad", error.message || "数据库检查失败"));
    }

    try {
      const response = await fetch(`${config.url.replace(/\/$/,"")}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "apikey": config.publishableKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ confirm:"probe-only" })
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 400 && body?.error === "confirmation_required") {
        rows.push(row("账号删除函数", "ok", "函数可达且用户认证有效；未执行任何删除"));
      } else if (response.status === 404) {
        rows.push(row("账号删除函数", "bad", "delete-account 尚未部署"));
      } else {
        rows.push(row("账号删除函数", "bad", `返回 ${response.status}: ${body?.error || "unexpected_response"}`));
      }
    } catch (error) {
      rows.push(row("账号删除函数", "bad", error.message || "函数检查失败"));
    }

    mount.innerHTML = rows.join("");
  };

  const inject = () => {
    const dialog = document.querySelector("#toolDialog");
    const title = document.querySelector("#dialogTitle");
    const root = document.querySelector("#toolMount");
    if (!dialog?.open || title?.textContent !== "账号与同步" || !root || root.querySelector("[data-cloud-diagnostics]")) return;

    const details = document.createElement("details");
    details.className = "task-capability";
    details.dataset.cloudDiagnostics = "1";
    details.open = !configured;
    details.innerHTML = `<summary><strong>${configured ? "连接自检" : "连接云端"}</strong><span>${configured ? "只读检查" : "首次设置"}</span></summary><div class="task-capability-body"><button class="secondary-btn" data-run-cloud-checks type="button">检查云端连接</button><div class="cloud-checks" data-cloud-check-results><span class="help-text">不会上传、覆盖或删除任何数据。</span></div></div>`;
    root.appendChild(details);
    const button = details.querySelector("[data-run-cloud-checks]");
    const mount = details.querySelector("[data-cloud-check-results]");
    button.onclick = async () => {
      mount.innerHTML = `<span class="help-text">正在检查…</span>`;
      await runChecks(mount);
    };
    if (!configured) {
      mount.innerHTML = `<span class="help-text">正在读取连接状态…</span>`;
      runChecks(mount);
    }
  };

  const observer = new MutationObserver(inject);
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("#toolDialog");
    if (root) observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:["open"]});
    document.querySelector("#accountBtn")?.addEventListener("click",()=>setTimeout(inject,0));
  },{once:true});
})();
