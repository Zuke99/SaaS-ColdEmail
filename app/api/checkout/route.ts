import { Checkout } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getDodoEnvironment } from "@/lib/dodo/env";

function getCheckoutHandler() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    return null;
  }

  return Checkout({
    bearerToken,
    returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
    environment: getDodoEnvironment(),
    type: "session",
  });
}

export async function POST(req: NextRequest) {
  const handler = getCheckoutHandler();

  if (!handler) {
    return NextResponse.json(
      { error: "Dodo Payments is not configured." },
      { status: 503 }
    );
  }

  return handler(req);
}
