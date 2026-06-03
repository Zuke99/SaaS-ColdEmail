import type { SupabaseClient } from "@supabase/supabase-js";

export function getAppSchema(): string {
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  if (!appId) {
    throw new Error("NEXT_PUBLIC_APP_ID is not set");
  }
  return appId;
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
