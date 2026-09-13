import { withSupabase } from "@supabase/server";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status });

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "delete") return json({ error: "confirmation_required" }, 400);

    const userId = ctx.userClaims?.id || ctx.jwtClaims?.sub;
    if (!userId) return json({ error: "invalid_session" }, 401);

    const { error } = await ctx.supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("delete-account failed", error);
      return json({ error: "delete_failed" }, 500);
    }

    // toolbox_sync.user_id references auth.users with ON DELETE CASCADE,
    // so deleting the auth user also removes that user's synced Toolbox payload.
    return json({ ok: true });
  })
};
