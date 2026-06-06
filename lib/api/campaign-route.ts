import { handleAuthError } from "@/lib/api/auth-response";
import { getAuthedClient } from "@/lib/api/with-auth";
import { assertCampaignAccess } from "@/lib/supabase/user-db";

export async function getAuthedCampaignContext(campaignId: string) {
  const auth = await getAuthedClient();
  if (auth instanceof Response) {
    return { response: auth } as const;
  }

  const { supabase, user } = auth;

  try {
    await assertCampaignAccess(supabase, user.id, campaignId);
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return { response: res } as const;
    throw err;
  }

  return { supabase, user } as const;
}
