import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getUserOrNull(
  supabase: SupabaseClient
): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireUser(
  supabase: SupabaseClient
): Promise<User> {
  const user = await getUserOrNull(supabase);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
