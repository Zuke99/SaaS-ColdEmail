import { env } from "@/env";
import { FEATURES } from "@/config/features";
import { appUrl } from "@/lib/app-url";

export function getDodoPaymentsConfig() {
  if (!FEATURES.payments) {
    throw new Error("Payments feature is disabled");
  }

  const apiKey = env.DODO_PAYMENTS_API_KEY;
  const webhookKey = env.DODO_PAYMENTS_WEBHOOK_KEY;
  const environment = env.DODO_PAYMENTS_ENVIRONMENT;
  const returnUrl = env.DODO_PAYMENTS_RETURN_URL ?? appUrl("/checkout/success");
  const productId = env.DODO_PRO_PRODUCT_ID;

  if (!apiKey || !webhookKey || !environment || !productId) {
    throw new Error("Dodo Payments configuration is incomplete");
  }

  return {
    apiKey,
    webhookKey,
    environment,
    returnUrl,
    productId,
  };
}
