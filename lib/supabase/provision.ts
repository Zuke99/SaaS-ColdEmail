import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

export async function provisionAppSchema(): Promise<{
  success: boolean;
  message: string;
}> {
  const appId = env.NEXT_PUBLIC_APP_ID;

  if (!/^[a-z][a-z0-9_]{1,48}$/.test(appId)) {
    throw new Error(
      "NEXT_PUBLIC_APP_ID must be lowercase alphanumeric with underscores, e.g. youtube_toolkit"
    );
  }

  const adminClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await adminClient.rpc("provision_app_schema", {
    schema_name: appId,
  });

  if (error) {
    console.error("[Schema Provisioning] Failed:", error.message);
    return { success: false, message: error.message };
  }

  console.log(`[Schema Provisioning] Schema "${appId}" is ready`);
  return { success: true, message: `Schema "${appId}" is ready` };
}
