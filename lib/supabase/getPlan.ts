import type { PlanId } from "@/config/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { fromAppTable } from "@/lib/supabase/schema";

type ProfilePlanRow = {
  plan: string | null;
  subscription_ends_at: string | null;
  cancelled_at: string | null;
};

async function downgradeIfExpired(
  userId: string,
  profile: ProfilePlanRow
): Promise<PlanId> {
  const currentPlan = (profile.plan ?? "free") as PlanId;

  if (currentPlan === "free" || !profile.subscription_ends_at) {
    return currentPlan;
  }

  const periodEnd = new Date(profile.subscription_ends_at);
  if (periodEnd > new Date()) {
    return currentPlan;
  }

  const admin = createAdminClient();
  await fromAppTable(admin, "profiles")
    .update({
      plan: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  return "free";
}

export async function getPlan(userId: string): Promise<PlanId> {
  const supabase = await createClient();
  const { data: profile } = await fromAppTable(supabase, "profiles")
    .select("plan, subscription_ends_at, cancelled_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return "free";
  }

  return downgradeIfExpired(userId, profile);
}
