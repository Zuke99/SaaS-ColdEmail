import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/env";

export function getAppSchema(): string {
  return env.NEXT_PUBLIC_APP_ID;
}

/** Returns schema-qualified table name, e.g. `youtube_toolkit.profiles` */
export function getTable(table: string): string {
  return `${getAppSchema()}.${table}`;
}

/**
 * Query a table in the current app schema.
 * Supabase requires `.schema()` + table name (not dotted notation in `.from()`).
 */
export function fromAppTable(supabase: SupabaseClient, table: string) {
  return supabase.schema(getAppSchema()).from(table);
}
