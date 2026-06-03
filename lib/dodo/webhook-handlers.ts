import type { WebhookPayload } from "@dodopayments/core";
import { planFromProductId, type PlanId } from "@/config/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { fromAppTable, getTable } from "@/lib/supabase/schema";

type ProfileUpdate = {
  plan?: PlanId;
  dodo_customer_id?: string;
  dodo_subscription_id?: string | null;
  subscription_ends_at?: string | null;
  cancelled_at?: string | null;
  dodo_payment_id?: string | null;
};

async function updateProfileById(
  userId: string,
  update: ProfileUpdate
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await fromAppTable(admin, "profiles")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    throw new Error(
      `Failed to update ${getTable("profiles")} for ${userId}: ${error.message}`
    );
  }
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await fromAppTable(admin, "profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  return data?.id ?? null;
}

function resolveUserId(
  email: string,
  metadata: Record<string, unknown> | undefined
): Promise<string | null> {
  if (metadata?.user_id && typeof metadata.user_id === "string") {
    return Promise.resolve(metadata.user_id);
  }
  return findUserIdByEmail(email);
}

function getSubscriptionProductId(data: {
  product_id: string;
}): string {
  return data.product_id;
}

export async function handleDodoWebhookPayload(
  payload: WebhookPayload
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[Dodo Webhook]", payload.type);
  }

  switch (payload.type) {
    case "subscription.active": {
      const { data } = payload;
      const userId = await resolveUserId(
        data.customer.email,
        data.metadata as Record<string, unknown> | undefined
      );
      if (!userId) {
        console.error(
          "[Dodo Webhook] subscription.active: no profile for",
          data.customer.email
        );
        return;
      }

      const plan = planFromProductId(getSubscriptionProductId(data));

      await updateProfileById(userId, {
        plan,
        dodo_customer_id: data.customer.customer_id,
        dodo_subscription_id: data.subscription_id,
        subscription_ends_at: data.next_billing_date.toISOString(),
        cancelled_at: null,
      });
      break;
    }

    case "subscription.renewed": {
      const { data } = payload;
      const userId = await resolveUserId(
        data.customer.email,
        data.metadata as Record<string, unknown> | undefined
      );
      if (!userId) {
        console.error(
          "[Dodo Webhook] subscription.renewed: no profile for",
          data.customer.email
        );
        return;
      }

      const plan = planFromProductId(getSubscriptionProductId(data));

      await updateProfileById(userId, {
        plan,
        dodo_customer_id: data.customer.customer_id,
        dodo_subscription_id: data.subscription_id,
        subscription_ends_at: data.next_billing_date.toISOString(),
      });
      break;
    }

    case "subscription.cancelled": {
      const { data } = payload;
      const userId = await resolveUserId(
        data.customer.email,
        data.metadata as Record<string, unknown> | undefined
      );
      if (!userId) {
        console.error(
          "[Dodo Webhook] subscription.cancelled: no profile for",
          data.customer.email
        );
        return;
      }

      const periodEnd =
        data.next_billing_date ?? data.expires_at ?? data.cancelled_at;

      await updateProfileById(userId, {
        subscription_ends_at: periodEnd
          ? periodEnd.toISOString()
          : null,
        cancelled_at: new Date().toISOString(),
      });
      break;
    }

    case "payment.succeeded": {
      const payment = payload.data;
      if (payment.subscription_id) {
        break;
      }

      const userId = await resolveUserId(
        payment.customer.email,
        payment.metadata as Record<string, unknown> | undefined
      );
      if (!userId) {
        console.error(
          "[Dodo Webhook] payment.succeeded: no profile for",
          payment.customer.email
        );
        return;
      }

      const productId = payment.product_cart?.[0]?.product_id ?? null;
      const plan = productId
        ? planFromProductId(productId)
        : ("pro" as PlanId);

      await updateProfileById(userId, {
        plan,
        dodo_customer_id: payment.customer.customer_id,
        dodo_payment_id: payment.payment_id,
      });
      break;
    }

    default:
      break;
  }
}
