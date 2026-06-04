import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/** Service-role client for cron jobs (no user session). */
export function createCronClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      db: { schema: "cold_email" },
    }
  );
}
