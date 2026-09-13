(() => {
  "use strict";

  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm";
  const config = window.ToolboxCloudConfig || {};
  const configured = config.provider === "supabase" && /^https:\/\//.test(config.url || "") && /^sb_publishable_/.test(config.publishableKey || "");
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

  const runChecks = async mount => {
    const rows = [];
    rows.push(row("浏览器配置", configured ? "ok" : "bad", configured ? "Project URL 与 publishable key 已配置" : "尚未配置"));
    if (!configured) {
      mount.innerHTML = rows.join("");
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
    details.innerHTML = `<summary><strong>连接自检</strong><span>只读检查</span></summary><div class="task-capability-body"><button class="secondary-btn" data-run-cloud-checks type="button">检查云端连接</button><div class="cloud-checks" data-cloud-check-results><span class="help-text">不会上传、覆盖或删除任何数据。</span></div></div>`;
    root.appendChild(details);
    details.querySelector("[data-run-cloud-checks]").onclick = async () => {
      const mount = details.querySelector("[data-cloud-check-results]");
      mount.innerHTML = `<span class="help-text">正在检查…</span>`;
      await runChecks(mount);
    };
  };

  const observer = new MutationObserver(inject);
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("#toolDialog");
    if (root) observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:["open"]});
    document.querySelector("#accountBtn")?.addEventListener("click",()=>setTimeout(inject,0));
  },{once:true});
})();
