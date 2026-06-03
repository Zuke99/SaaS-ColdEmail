import { createClient } from "@supabase/supabase-js";

export async function provisionAppSchema(): Promise<{
  success: boolean;
  message: string;
}> {
  const appId = process.env.NEXT_PUBLIC_APP_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!appId || !supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing required env vars: NEXT_PUBLIC_APP_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  if (!/^[a-z][a-z0-9_]{1,48}$/.test(appId)) {
    throw new Error(
      "NEXT_PUBLIC_APP_ID must be lowercase alphanumeric with underscores, e.g. youtube_toolkit"
    );
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: created, error } = await adminClient.rpc(
    "provision_app_schema",
    { schema_name: appId }
  );

  if (error) {
    const hint =
      error.message.includes("schema cache") ||
      error.message.includes("Could not find the function")
        ? " Run supabase/migrations/001_schema_provisioning.sql in Supabase SQL Editor, then restart the dev server."
        : "";
    console.error("[Schema Provisioning] Failed:", error.message + hint);
    return { success: false, message: error.message };
  }

  const message =
    created === true
      ? `Schema "${appId}" was created`
      : `Schema "${appId}" already exists`;

  console.log(`[Schema Provisioning] ${message}`);
  return { success: true, message };
}
