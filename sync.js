(() => {
  "use strict";

  const { storage, $, escapeHtml, openPanel, toast, download } = Toolbox;
  const META_KEY = "toolbox:sync:v1";
  const SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/+esm";
  const config = window.ToolboxCloudConfig || {};
  const configured = config.provider === "supabase" && /^https:\/\//.test(config.url || "") && /^sb_publishable_/.test(config.publishableKey || "");
  const providers = Array.isArray(config.oauthProviders) ? config.oauthProviders.filter(x => ["github","google"].includes(x)) : ["github"];

  const readMeta = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(META_KEY) || "{}");
      return { enabled:false, userId:null, lastSyncedHash:null, lastSyncedRevision:0, lastSyncAt:null, lastError:null, ...raw };
    } catch {
      return { enabled:false, userId:null, lastSyncedHash:null, lastSyncedRevision:0, lastSyncAt:null, lastError:null };
    }
  };
  const writeMeta = patch => {
    const next = { ...readMeta(), ...patch };
    localStorage.setItem(META_KEY, JSON.stringify(next));
    updateAccountButton();
    return next;
  };

  let clientPromise = null;
  let activeSession = null;
  let applyingRemote = false;
  let syncTimer = null;
  let lastConflict = null;

  const stableValue = value => {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stableValue(value[k])]));
    return value;
  };
  const hashPayload = async payload => {
    const text = JSON.stringify(stableValue(payload));
    if (!crypto.subtle) return `plain:${text.length}:${text.slice(0,32)}`;
    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2,"0")).join("");
  };

  const originalSet = storage.set.bind(storage);
  const originalRemove = storage.remove.bind(storage);
  const originalImport = storage.importData.bind(storage);
  storage.set = (path,value) => {
    const result = originalSet(path,value);
    if (!applyingRemote) window.dispatchEvent(new CustomEvent("toolbox:data-changed",{detail:{path}}));
    return result;
  };
  storage.remove = path => {
    const result = originalRemove(path);
    if (!applyingRemote) window.dispatchEvent(new CustomEvent("toolbox:data-changed",{detail:{path}}));
    return result;
  };
  storage.importData = input => {
    const result = originalImport(input);
    if (!applyingRemote) window.dispatchEvent(new CustomEvent("toolbox:data-changed",{detail:{path:"*"}}));
    return result;
  };

  const getClient = async () => {
    if (!configured) throw new Error("云同步尚未配置");
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

  const refreshSession = async () => {
    if (!configured) return null;
    const client = await getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    activeSession = data.session || null;
    const meta = readMeta();
    if (activeSession?.user?.id && meta.userId && meta.userId !== activeSession.user.id) {
      writeMeta({ enabled:false, userId:activeSession.user.id, lastSyncedHash:null, lastSyncedRevision:0, lastSyncAt:null, lastError:null });
    } else if (activeSession?.user?.id && meta.userId !== activeSession.user.id) {
      writeMeta({ userId:activeSession.user.id });
    }
    updateAccountButton();
    return activeSession;
  };

  const fetchRemote = async () => {
    const client = await getClient();
    const session = activeSession || await refreshSession();
    if (!session) throw new Error("请先登录");
    const { data, error } = await client.from("toolbox_sync").select("payload,revision,updated_at").eq("user_id", session.user.id).maybeSingle();
    if (error) throw error;
    return data || null;
  };

  const pushLocal = async expectedRevision => {
    const client = await getClient();
    const payload = storage.snapshot();
    const localHash = await hashPayload(payload);
    const { data, error } = await client.rpc("toolbox_push", { expected_revision: Number(expectedRevision) || 0, new_payload: payload });
    if (error) {
      if (String(error.code) === "40001" || /sync_conflict/i.test(error.message || "")) throw Object.assign(new Error("同步冲突"), { code:"SYNC_CONFLICT" });
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw Object.assign(new Error("同步冲突"), { code:"SYNC_CONFLICT" });
    writeMeta({ enabled:true, userId:activeSession?.user?.id || null, lastSyncedHash:localHash, lastSyncedRevision:Number(row.new_revision)||Number(expectedRevision)+1, lastSyncAt:Date.now(), lastError:null });
    lastConflict = null;
    return { direction:"up", revision:Number(row.new_revision)||0 };
  };

  const applyRemote = async remote => {
    if (!remote?.payload) throw new Error("云端没有可恢复的数据");
    applyingRemote = true;
    try {
      const remoteHash = await hashPayload(remote.payload);
      originalImport(remote.payload);
      writeMeta({ enabled:true, userId:activeSession?.user?.id || null, lastSyncedHash:remoteHash, lastSyncedRevision:Number(remote.revision)||0, lastSyncAt:Date.now(), lastError:null });
      lastConflict = null;
    } finally {
      applyingRemote = false;
    }
    toast("已使用云端数据");
    setTimeout(() => location.reload(), 250);
  };

  const syncNow = async ({ background=false }={}) => {
    const meta = readMeta();
    if (!meta.enabled) return { skipped:true };
    const session = activeSession || await refreshSession();
    if (!session) return { skipped:true };
    const localPayload = storage.snapshot();
    const localHash = await hashPayload(localPayload);
    const remote = await fetchRemote();

    if (!remote) return pushLocal(0);

    const remoteRevision = Number(remote.revision) || 0;
    if (!meta.lastSyncedHash || !meta.lastSyncedRevision) {
      lastConflict = { remote, localHash, reason:"first" };
      writeMeta({ lastError:"首次同步需要选择数据来源" });
      return { conflict:lastConflict };
    }

    const localChanged = localHash !== meta.lastSyncedHash;
    const remoteChanged = remoteRevision !== Number(meta.lastSyncedRevision);

    if (!localChanged && !remoteChanged) {
      writeMeta({ lastSyncAt:Date.now(), lastError:null });
      return { direction:"none" };
    }
    if (!localChanged && remoteChanged) {
      if (background) {
        lastConflict = { remote, localHash, reason:"remote-newer" };
        writeMeta({ lastError:"云端有更新，打开账号确认后恢复" });
        return { conflict:lastConflict };
      }
      return applyRemote(remote);
    }
    if (localChanged && !remoteChanged) return pushLocal(remoteRevision);

    lastConflict = { remote, localHash, reason:"both" };
    writeMeta({ lastError:"本机和云端都已修改，需要选择" });
    return { conflict:lastConflict };
  };

  const scheduleSync = () => {
    clearTimeout(syncTimer);
    if (!readMeta().enabled || !activeSession || !navigator.onLine) return;
    syncTimer = setTimeout(async () => {
      try { await syncNow({ background:true }); }
      catch (error) { writeMeta({ lastError:error.message || "同步失败" }); }
    }, 2500);
  };

  const updateAccountButton = () => {
    const btn = $("#accountBtn");
    if (!btn) return;
    const meta = readMeta();
    if (!configured) btn.textContent = "账号";
    else if (activeSession && meta.lastError) btn.textContent = "同步 !";
    else if (activeSession && meta.enabled) btn.textContent = "已同步";
    else if (activeSession) btn.textContent = "账号 ✓";
    else btn.textContent = "账号";
  };

  const providerLabel = id => id === "google" ? "Google" : "GitHub";
  const formatTime = value => value ? new Date(value).toLocaleString() : "尚未同步";

  const renderAccountPanel = async root => {
    if (!configured) {
      root.innerHTML = `<div class="editor-stack"><div class="output-panel">云同步代码已经就绪，但当前站点还没有配置云端项目。本地任务、计划、专注和备份仍可完整使用。</div><div class="help-text">站点配置后，这里会提供登录、首次同步、冲突处理和退出。</div></div>`;
      return;
    }

    let session;
    try { session = await refreshSession(); }
    catch (error) { root.innerHTML=`<div class="output-panel">账号初始化失败：${escapeHtml(error.message)}</div>`; return; }

    if (!session) {
      root.innerHTML = `<div class="editor-stack"><div class="output-panel">登录只用于跨设备同步。登录前不会上传当前浏览器里的数据。</div><div class="toolbar">${providers.map(p=>`<button class="primary-btn" data-login-provider="${p}" type="button">使用 ${providerLabel(p)} 登录</button>`).join("")}</div></div>`;
      root.querySelectorAll("[data-login-provider]").forEach(btn => btn.onclick = async () => {
        try {
          const client = await getClient();
          sessionStorage.setItem("toolbox:auth-pending","1");
          const { error } = await client.auth.signInWithOAuth({ provider:btn.dataset.loginProvider, options:{ redirectTo:`${location.origin}${location.pathname}` } });
          if (error) throw error;
        } catch (error) { toast(`登录失败：${error.message}`); }
      });
      return;
    }

    const meta = readMeta();
    const who = session.user.email || session.user.user_metadata?.user_name || session.user.id.slice(0,8);
    root.innerHTML = `<div class="editor-stack">
      <div class="output-panel"><strong>${escapeHtml(who)}</strong><br>${meta.enabled?"已开启跨设备同步":"已登录，但尚未开启同步"}<br>上次同步：${escapeHtml(formatTime(meta.lastSyncAt))}${meta.lastError?`<br>状态：${escapeHtml(meta.lastError)}`:""}</div>
      <div class="toolbar"><button id="syncEnableBtn" class="primary-btn" type="button">${meta.enabled?"立即同步":"开始同步"}</button><button id="syncSignOutBtn" class="secondary-btn" type="button">退出登录</button></div>
      <div id="syncConflict"></div>
      <details class="task-capability"><summary><strong>云端数据管理</strong><span>按需展开</span></summary><div class="task-capability-body"><button id="syncDeleteCloudBtn" class="danger-btn" type="button">删除我的云端同步数据</button><span class="help-text">这里只删除 Toolbox 同步数据，不删除登录身份本身。</span></div></details>
    </div>`;

    const renderConflict = conflict => {
      const box = $("#syncConflict",root);
      if (!box || !conflict) { if(box) box.innerHTML=""; return; }
      box.innerHTML = `<div class="task-suggestion"><span>需要你选择</span><p>${conflict.reason==="first"?"云端已有数据，而这台设备还没有同步基线。请选择第一次以哪边为准。":"本机和云端都发生过修改，系统不会自动覆盖其中一边。"}</p><div class="toolbar"><button id="keepLocalBtn" class="secondary-btn" type="button">保留本机并覆盖云端</button><button id="useCloudBtn" class="secondary-btn" type="button">使用云端</button><button id="backupLocalBtn" class="mini-btn" type="button">先导出本机备份</button></div></div>`;
      $("#backupLocalBtn",box).onclick=()=>{const date=new Date().toISOString().slice(0,10);download(new Blob([storage.exportData()],{type:"application/json;charset=utf-8"}),`toolbox-conflict-backup-${date}.json`);};
      $("#useCloudBtn",box).onclick=()=>applyRemote(conflict.remote).catch(error=>toast(error.message));
      $("#keepLocalBtn",box).onclick=async()=>{try{await pushLocal(Number(conflict.remote?.revision)||0);toast("已用本机数据更新云端");renderAccountPanel(root);}catch(error){toast(error.code==="SYNC_CONFLICT"?"云端又有新变化，请重新同步":error.message);}};
    };
    renderConflict(lastConflict);

    $("#syncEnableBtn",root).onclick = async () => {
      try {
        writeMeta({ enabled:true, userId:session.user.id, lastError:null });
        const result = await syncNow();
        if (result?.conflict) renderConflict(result.conflict);
        else { toast(result?.direction==="up"?"已上传到云端":"同步完成"); renderAccountPanel(root); }
      } catch (error) {
        writeMeta({ lastError:error.message || "同步失败" });
        toast(`同步失败：${error.message}`);
        renderAccountPanel(root);
      }
    };
    $("#syncSignOutBtn",root).onclick = async () => {
      try { const client=await getClient(); await client.auth.signOut(); } catch {}
      activeSession=null; lastConflict=null; writeMeta({ enabled:false, userId:null, lastSyncedHash:null, lastSyncedRevision:0, lastSyncAt:null, lastError:null });
      toast("已退出登录");
      renderAccountPanel(root);
    };
    $("#syncDeleteCloudBtn",root).onclick = async () => {
      if (!confirm("删除这份账号下的 Toolbox 云端同步数据？本机数据不会删除。")) return;
      try {
        const client=await getClient();
        const { error }=await client.from("toolbox_sync").delete().eq("user_id",session.user.id);
        if(error)throw error;
        writeMeta({ lastSyncedHash:null,lastSyncedRevision:0,lastSyncAt:null,lastError:null });
        toast("云端同步数据已删除");renderAccountPanel(root);
      } catch(error){toast(`删除失败：${error.message}`);}
    };
  };

  const openAccount = () => openPanel({ icon:"☁", title:"账号与同步", desc:"可选登录；同步任务、计划、专注、思考与复盘。", local:false }, root => { renderAccountPanel(root); });

  window.addEventListener("toolbox:data-changed", scheduleSync);
  window.addEventListener("online", scheduleSync);

  const start = async () => {
    $("#accountBtn")?.addEventListener("click", event => { event.preventDefault(); openAccount(); });
    updateAccountButton();
    if (!configured) return;
    const meta=readMeta(), authPending=sessionStorage.getItem("toolbox:auth-pending")==="1" || new URLSearchParams(location.search).has("code");
    if (!meta.enabled && !authPending) return;
    try {
      await refreshSession();
      sessionStorage.removeItem("toolbox:auth-pending");
      if (activeSession && meta.enabled) scheduleSync();
    } catch (error) { writeMeta({ lastError:error.message || "账号初始化失败" }); }
  };

  document.addEventListener("DOMContentLoaded",start,{once:true});
})();
