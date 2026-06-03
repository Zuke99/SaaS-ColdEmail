import { Webhooks } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";
import { handleDodoWebhookPayload } from "@/lib/dodo/webhook-handlers";

function getWebhookHandler() {
  return Webhooks({
    webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    onPayload: async (payload) => {
      try {
        await handleDodoWebhookPayload(payload);
      } catch (error) {
        console.error("[Dodo Webhook] Processing error:", error);
      }
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    return await getWebhookHandler()(req);
  } catch (error) {
    console.error("[Dodo Webhook] Handler error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
