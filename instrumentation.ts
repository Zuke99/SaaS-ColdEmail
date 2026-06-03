export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { provisionAppSchema } = await import("./lib/supabase/provision");
    try {
      await provisionAppSchema();
    } catch (err) {
      console.error("[Startup] Schema provisioning failed:", err);
    }
  }
}
