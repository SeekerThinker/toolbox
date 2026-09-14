(() => {
  "use strict";

  const { $, toast } = Toolbox;
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm";
  const META_KEY = "toolbox:sync:v1";
  const AUTH_KEY = "toolbox:supabase:auth:v1";
  const config = window.ToolboxCloudConfig || {};
  const configured = config.provider === "supabase" && /^https:\/\//.test(config.url || "") && /^sb_publishable_/.test(config.publishableKey || "");
  const enabled = configured && config.accountDeletionEnabled === true;
  let clientPromise = null;

  const getClient = async () => {
    if (!enabled) throw new Error("账号删除服务尚未启用");
    if (!clientPromise) {
      clientPromise = import(SDK_URL).then(({ createClient }) => createClient(config.url, config.publishableKey, {
        auth: {
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
          storageKey: AUTH_KEY
        }
      }));
    }
    return clientPromise;
  };

  const clearLocalAccountState = () => {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem("toolbox:auth-pending");
  };

  const injectDeleteAccount = root => {
    if (!enabled || !root || $("#syncDeleteAccountBtn", root)) return;
    const cloudDelete = $("#syncDeleteCloudBtn", root);
    if (!cloudDelete) return;
    const body = cloudDelete.closest(".task-capability-body");
    if (!body) return;

    const divider = document.createElement("hr");
    divider.className = "divider";
    const button = document.createElement("button");
    button.id = "syncDeleteAccountBtn";
    button.className = "danger-btn";
    button.type = "button";
    button.textContent = "删除账号及云端数据";
    const help = document.createElement("span");
    help.className = "help-text";
    help.textContent = "永久删除登录身份和云端 Toolbox 数据；当前浏览器里的本地数据会保留。";
    body.append(divider, button, help);

    button.onclick = async () => {
      if (!confirm("永久删除这个 Toolbox 账号及其云端数据？当前浏览器本地数据会保留，但账号身份和云端副本无法恢复。")) return;
      button.disabled = true;
      try {
        const client = await getClient();
        const { data: { session } } = await client.auth.getSession();
        if (!session) throw new Error("请先重新登录");
        const { error } = await client.functions.invoke("delete-account", { body: { confirm: "delete" } });
        if (error) throw error;
        try { await client.auth.signOut({ scope: "local" }); } catch {}
        clearLocalAccountState();
        toast("账号及云端数据已删除，本机数据仍保留");
        setTimeout(() => location.reload(), 500);
      } catch (error) {
        button.disabled = false;
        toast(`删除账号失败：${error.message || error}`);
      }
    };
  };

  const start = () => {
    if (!enabled) return;
    const dialog = $("#toolDialog");
    if (!dialog) return;
    const observer = new MutationObserver(() => injectDeleteAccount(dialog));
    observer.observe(dialog, { childList: true, subtree: true });
    injectDeleteAccount(dialog);
  };

  document.addEventListener("DOMContentLoaded", start, { once: true });
})();
