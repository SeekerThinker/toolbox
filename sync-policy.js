(() => {
  "use strict";

  const ACTIONS = Object.freeze({
    SKIP: "skip",
    UPLOAD_NEW: "upload-new",
    CONFLICT_FIRST: "conflict-first",
    NOOP: "noop",
    RESTORE_REMOTE: "restore-remote",
    CONFLICT_REMOTE_NEWER: "conflict-remote-newer",
    UPLOAD_LOCAL: "upload-local",
    CONFLICT_BOTH: "conflict-both"
  });

  const decide = ({
    enabled,
    hasSession,
    hasRemote,
    hasBaseline,
    localChanged = false,
    remoteChanged = false,
    background = false
  }) => {
    if (!enabled || !hasSession) return ACTIONS.SKIP;
    if (!hasRemote) return ACTIONS.UPLOAD_NEW;
    if (!hasBaseline) return ACTIONS.CONFLICT_FIRST;
    if (!localChanged && !remoteChanged) return ACTIONS.NOOP;
    if (!localChanged && remoteChanged) {
      return background ? ACTIONS.CONFLICT_REMOTE_NEWER : ACTIONS.RESTORE_REMOTE;
    }
    if (localChanged && !remoteChanged) return ACTIONS.UPLOAD_LOCAL;
    return ACTIONS.CONFLICT_BOTH;
  };

  globalThis.ToolboxSyncPolicy = Object.freeze({ ACTIONS, decide });
})();
