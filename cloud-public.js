(() => {
  "use strict";

  // Public client configuration injected once by the product deployment.
  // Publishable keys are browser-safe; never put secret/service-role credentials here.
  window.ToolboxPublicCloudConfig = Object.freeze({
    publishableKey: "",
    emailOtp: false,
    wechatProvider: "",
    accountDeletionEnabled: false
  });
})();
