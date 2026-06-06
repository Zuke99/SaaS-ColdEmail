import type { User } from "@supabase/supabase-js";
import { handleAuthError } from "@/lib/api/auth-response";
import { getUserDbContext, type UserDbClient } from "@/lib/supabase/user-db";

export async function getAuthedClient(): Promise<
  { supabase: UserDbClient; user: User } | Response
> {
  try {
    const { user, db } = await getUserDbContext();
    return { supabase: db, user };
  } catch (err) {
    const res = handleAuthError(err);
    if (res) return res;
    throw err;
  }
}
