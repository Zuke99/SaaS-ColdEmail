import { Webhooks } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { FEATURES } from "@/config/features";
import { getDodoPaymentsConfig } from "@/lib/payments/config";
import { handleDodoWebhookPayload } from "@/lib/dodo/webhook-handlers";

function getWebhookHandler() {
  const { webhookKey } = getDodoPaymentsConfig();
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
  if (!FEATURES.payments) {
    return NextResponse.json(
      { error: "Payments not enabled" },
      { status: 404 }
    );
  }

  try {
    return await getWebhookHandler()(req);
  } catch (error) {
    console.error("[Dodo Webhook] Handler error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
