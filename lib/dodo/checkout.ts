import { createCheckoutSession as dodoCreateCheckoutSession } from "@dodopayments/core/checkout";
import { getDodoEnvironment } from "@/lib/dodo/env";

type CreateAppCheckoutParams = {
  productId: string;
  customerEmail: string;
  customerName: string;
  userId: string;
};

export async function createAppCheckoutSession(params: CreateAppCheckoutParams) {
  const bearerToken = process.env.DODO_PAYMENTS_API_KEY;

  if (!bearerToken) {
    throw new Error("DODO_PAYMENTS_API_KEY is not configured.");
  }

  const returnUrl = process.env.DODO_PAYMENTS_RETURN_URL;
  if (!returnUrl) {
    throw new Error("DODO_PAYMENTS_RETURN_URL is not configured.");
  }

  return dodoCreateCheckoutSession(
    {
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      return_url: returnUrl,
      metadata: {
        user_id: params.userId,
      },
    },
    {
      bearerToken,
      environment: getDodoEnvironment(),
    }
  );
}
