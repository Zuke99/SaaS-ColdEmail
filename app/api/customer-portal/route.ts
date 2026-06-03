import { CustomerPortal } from "@dodopayments/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { FEATURES } from "@/config/features";
import { getDodoPaymentsConfig } from "@/lib/payments/config";

function getCustomerPortalHandler() {
  const { apiKey, environment } = getDodoPaymentsConfig();
  return CustomerPortal({
    bearerToken: apiKey,
    environment,
  });
}

export async function GET(req: NextRequest) {
  if (!FEATURES.payments) {
    return NextResponse.json(
      { error: "Payments not enabled" },
      { status: 404 }
    );
  }

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
