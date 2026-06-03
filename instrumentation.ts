export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./env");

    if (process.env.ENABLE_PAYMENTS === "true") {
      const required = [
        "DODO_PAYMENTS_API_KEY",
        "DODO_PAYMENTS_WEBHOOK_KEY",
        "DODO_PAYMENTS_ENVIRONMENT",
        "DODO_PAYMENTS_RETURN_URL",
        "DODO_PRO_PRODUCT_ID",
      ];
      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `ENABLE_PAYMENTS=true but missing required vars:\n${missing.map((k) => `  - ${k}`).join("\n")}`
        );
      }
      console.log("[Features] Payments: enabled");
    } else {
      console.log("[Features] Payments: disabled");
    }

    if (process.env.ENABLE_EMAIL === "true") {
      const required = ["RESEND_API_KEY", "EMAIL_FROM", "EMAIL_REPLY_TO"];
      const missing = required.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `ENABLE_EMAIL=true but missing required vars:\n${missing.map((k) => `  - ${k}`).join("\n")}`
        );
      }
      console.log("[Features] Email: enabled");
    } else {
      console.log("[Features] Email: disabled");
    }

    if (process.env.ENABLE_ANALYTICS === "true") {
      if (!process.env.POSTHOG_API_KEY) {
        throw new Error("ENABLE_ANALYTICS=true but POSTHOG_API_KEY is missing");
      }
      console.log("[Features] Analytics: enabled");
    } else {
      console.log("[Features] Analytics: disabled");
    }

    console.log(
      "[Features] Blog:",
      process.env.ENABLE_BLOG === "false" ? "disabled" : "enabled"
    );

    const { provisionAppSchema } = await import("./lib/supabase/provision");
    try {
      await provisionAppSchema();
    } catch (err) {
      console.error("[Startup] Schema provisioning failed:", err);
    }
  }
}
