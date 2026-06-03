import { Checkout } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

function getCheckoutHandler() {
  return Checkout({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    returnUrl: env.DODO_PAYMENTS_RETURN_URL,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
    type: "session",
  });
}

export async function POST(req: NextRequest) {
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
