(() => {
  "use strict";

  const publicConfig = window.ToolboxPublicCloudConfig || {};
  const debugMode = new URLSearchParams(window.location.search).get("debug") === "cloud";
  const RUNTIME_KEY = "toolbox:supabase:publishable-key";
  let debugKey = "";

  if (debugMode) {
    try {
      debugKey = localStorage.getItem(RUNTIME_KEY) || "";
    } catch {}
    if (!/^sb_publishable_/.test(debugKey)) debugKey = "";
  }

  const deployedKey = /^sb_publishable_/.test(publicConfig.publishableKey || "") ? publicConfig.publishableKey : "";

  window.ToolboxCloudConfig = Object.freeze({
    provider: "supabase",
    url: "https://bmclrtrtzntzrhudwisv.supabase.co",
    publishableKey: deployedKey || debugKey,
    emailOtp: publicConfig.emailOtp !== false,
    wechatProvider: /^custom:[a-z0-9:-]+$/.test(publicConfig.wechatProvider || "") ? publicConfig.wechatProvider : "",
    accountDeletionEnabled: publicConfig.accountDeletionEnabled === true,
    debugMode,
    runtimeKeyStorage: RUNTIME_KEY
  });
})();
