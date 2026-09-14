(() => {
  "use strict";

  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm";
  const config = window.ToolboxCloudConfig || {};
  if (!config.debugMode) return;

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
      <label class="field"><span class="help-text">Supabase Publishable Key（调试）</span><input class="text-input" data-cloud-key-input type="password" autocomplete="off" placeholder="sb_publishable_…"></label>
      <div class="toolbar"><button class="primary-btn" data-save-cloud-key type="button">保存调试配置</button></div>
      <span class="help-text">仅供产品开发调试。正式用户不会看到此入口；不要粘贴 secret/service_role 或数据库密码。</span>
    </div>`);
    const input = mount.querySelector("[data-cloud-key-input]");
    const button = mount.querySelector("[data-save-cloud-key]");
    button.onclick = () => {
      const value = String(input.value || "").trim();
      if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) {
        window.Toolbox?.toast?.("请输入 sb_publishable_ 开头的 Publishable Key");
        return;
      }
      try {
        localStorage.setItem(runtimeKeyStorage, value);
        window.Toolbox?.toast?.("调试配置已保存，正在重新加载");
        setTimeout(() => location.reload(), 250);
      } catch {
        window.Toolbox?.toast?.("当前浏览器无法保存调试配置");
      }
    };
  };

  const runChecks = async mount => {
    const rows = [
      row("Project URL", urlReady ? "ok" : "bad", urlReady ? "已配置" : "尚未配置"),
      row("Publishable Key", keyReady ? "ok" : "bad", keyReady ? "已配置" : "尚未配置")
    ];
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
    if (sessionError) rows.push(row("登录会话", "bad", sessionError.message));
    else if (!sessionData.session) rows.push(row("登录会话", "idle", "尚未登录"));
    else {
      rows.push(row("登录会话", "ok", "当前会话有效"));
      const { error } = await client.from("toolbox_sync").select("revision").limit(1);
      rows.push(row("数据库 / RLS", error ? "bad" : "ok", error?.message || "RLS 请求通过"));
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
    details.open = true;
    details.innerHTML = `<summary><strong>开发者连接自检</strong><span>debug=cloud</span></summary><div class="task-capability-body"><button class="secondary-btn" data-run-cloud-checks type="button">检查连接</button><div class="cloud-checks" data-cloud-check-results><span class="help-text">只读检查，不上传或覆盖用户数据。</span></div></div>`;
    root.appendChild(details);
    const mount = details.querySelector("[data-cloud-check-results]");
    details.querySelector("[data-run-cloud-checks]").onclick = () => runChecks(mount);
    if (!configured) runChecks(mount);
  };

  const observer = new MutationObserver(inject);
  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("#toolDialog");
    if (root) observer.observe(root, { subtree:true, childList:true, attributes:true, attributeFilter:["open"] });
    document.querySelector("#accountBtn")?.addEventListener("click", () => setTimeout(inject, 0));
  }, { once:true });
})();
