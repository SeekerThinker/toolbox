(() => {
  "use strict";

  const RUNTIME_KEY = "toolbox:supabase:publishable-key";
  let runtimeKey = "";
  try {
    runtimeKey = localStorage.getItem(RUNTIME_KEY) || "";
  } catch {}

  if (!/^sb_publishable_/.test(runtimeKey)) runtimeKey = "";

  window.ToolboxCloudConfig = Object.freeze({
    provider: "supabase",
    url: "https://bmclrtrtzntzrhudwisv.supabase.co",
    publishableKey: runtimeKey,
    oauthProviders: ["github"],
    runtimeKeyStorage: RUNTIME_KEY
  });
})();
