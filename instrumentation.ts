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

    const cron = await import("node-cron");
    const { runScheduleFollowups } = await import("./lib/cron/schedule-followups");
    const { runSendEmails } = await import("./lib/cron/send-emails");

    // Daily at 8 AM UTC — queues follow-up emails that are due
    cron.schedule("0 8 * * *", () => {
      console.log("[Cron] schedule-followups: tick fired");
      runScheduleFollowups()
        .then((result) => console.log("[Cron] schedule-followups: done", result))
        .catch((err) => console.error("[Cron] schedule-followups: unhandled error", err));
    });

    // Every 5 minutes — sends up to 3 pending emails per campaign
    cron.schedule("*/5 * * * *", () => {
      console.log("[Cron] send-emails: tick fired");
      runSendEmails()
        .then((result) => console.log("[Cron] send-emails: done", result))
        .catch((err) => console.error("[Cron] send-emails: unhandled error", err));
    });

    console.log("[Cron] Scheduled: schedule-followups (daily 8 AM UTC), send-emails (every 5 min)");
  }
}
