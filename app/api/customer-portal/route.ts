import { CustomerPortal } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/env";

function getCustomerPortalHandler() {
  return CustomerPortal({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: env.DODO_PAYMENTS_ENVIRONMENT,
  });
}

export async function GET(req: NextRequest) {
  try {
    return await getCustomerPortalHandler()(req);
  } catch (err) {
    console.error("[Customer Portal API]", err);
    return NextResponse.json(
      { error: "Customer portal handler failed." },
      { status: 500 }
    );
  }
}
