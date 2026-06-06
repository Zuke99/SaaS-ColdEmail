import { createClient } from "@/lib/supabase/server";
import { createCronClient } from "@/lib/supabase/cron";

/**
 * Server API DB access: verify identity with the session client, then use the
 * service-role client for cold_email (RLS + custom schema + Route Handler JWT
 * forwarding is unreliable in dev).
 */
export type UserDbClient = ReturnType<typeof createCronClient>;

export async function getUserDbContext() {
  const authClient = await createClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const db = createCronClient();

  return { user, db };
}

/** Ensures the campaign belongs to the current user (required when using service role). */
export async function assertCampaignAccess(
  db: UserDbClient,
  userId: string,
  campaignId: string
): Promise<void> {
  const { data, error } = await db
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    throw new Error("CAMPAIGN_NOT_FOUND");
  }
}
