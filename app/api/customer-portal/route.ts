import { CustomerPortal } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { getDodoEnvironment } from "@/lib/dodo/env";

function getCustomerPortalHandler() {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;
  if (!bearerToken) {
    return null;
  }

  return CustomerPortal({
    bearerToken,
    environment: getDodoEnvironment(),
  });
}

export async function GET(req: NextRequest) {
  const handler = getCustomerPortalHandler();

  if (!handler) {
    return NextResponse.json(
      { error: "Dodo Payments is not configured." },
      { status: 503 }
    );
  }

  return handler(req);
}
