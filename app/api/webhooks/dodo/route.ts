import { Webhooks } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { handleDodoWebhookPayload } from "@/lib/dodo/webhook-handlers";

function getWebhookHandler() {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!webhookKey) {
    return null;
  }

  return Webhooks({
    webhookKey,
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
  const handler = getWebhookHandler();

  if (!handler) {
    console.error("[Dodo Webhook] DODO_PAYMENTS_WEBHOOK_KEY is not configured");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  return handler(req);
}
