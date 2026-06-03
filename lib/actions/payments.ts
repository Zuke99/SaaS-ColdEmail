"use server";

import { redirect } from "next/navigation";
import type { PlanId } from "@/config/plans";
import { createAppCheckoutSession } from "@/lib/dodo/checkout";
import { getPlanForCheckout } from "@/lib/plans/server";
import { createClient } from "@/lib/supabase/server";
import { fromAppTable } from "@/lib/supabase/schema";

function sanitizeCheckoutError(message: string): string {
  const trimmed = message.trim();
  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.includes("<html")
  ) {
    return "Checkout service unavailable. Verify Dodo Payments configuration.";
  }
  return trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
}

export async function createCheckoutSession(
  planId: PlanId
): Promise<{ checkout_url?: string; error?: string }> {
  const plan = getPlanForCheckout(planId);

  if (!plan?.dodoProductId) {
    return { error: "This plan is not available for checkout." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { data: profile } = await fromAppTable(supabase, "profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const customerName =
    profile?.full_name ??
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : user.email);

  try {
    const session = await createAppCheckoutSession({
      productId: plan.dodoProductId,
      customerEmail: user.email,
      customerName,
      userId: user.id,
    });

    if (!session.checkout_url) {
      return { error: "No checkout URL returned from Dodo Payments." };
    }

    return { checkout_url: session.checkout_url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create checkout session.";
    console.error("[Checkout]", message);
    return { error: sanitizeCheckoutError(message) };
  }
}

export async function startCheckout(planId: PlanId): Promise<void> {
  const result = await createCheckoutSession(planId);

  if (result.error) {
    redirect(
      `/pricing?error=${encodeURIComponent(sanitizeCheckoutError(result.error))}`
    );
  }

  if (result.checkout_url) {
    redirect(result.checkout_url);
  }

  redirect("/pricing?error=Checkout%20failed");
}

export async function redirectToCustomerPortal(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await fromAppTable(supabase, "profiles")
    .select("dodo_customer_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.dodo_customer_id) {
    redirect(
      "/pricing?error=" +
        encodeURIComponent(
          "No billing account found. Subscribe to a paid plan first."
        )
    );
  }

  redirect(
    `/api/customer-portal?customer_id=${encodeURIComponent(profile.dodo_customer_id)}`
  );
}
