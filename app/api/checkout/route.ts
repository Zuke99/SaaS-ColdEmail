import { Checkout } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { FEATURES } from "@/config/features";
import { getDodoPaymentsConfig } from "@/lib/payments/config";

function getCheckoutHandler() {
  const { apiKey, returnUrl, environment } = getDodoPaymentsConfig();
  return Checkout({
    bearerToken: apiKey,
    returnUrl,
    environment,
    type: "session",
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
    return await getCheckoutHandler()(req);
  } catch (err) {
    console.error("[Checkout API]", err);
    return NextResponse.json(
      { error: "Checkout handler failed." },
      { status: 500 }
    );
  }
}
