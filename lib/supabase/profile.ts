import type { SupabaseClient, User } from "@supabase/supabase-js";
import { fromAppTable, getTable } from "@/lib/supabase/schema";

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<void> {
  const profiles = fromAppTable(supabase, "profiles");

  const { data: existing } = await profiles
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { error } = await profiles.insert({
    id: user.id,
    email: user.email ?? null,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  });

  if (error) {
    console.error(
      `[Profile] Failed to create profile in ${getTable("profiles")}:`,
      error.message
    );
  }
}
