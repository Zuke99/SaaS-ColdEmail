import { createCheckoutSession as dodoCreateCheckoutSession } from "@dodopayments/core/checkout";
import { env } from "@/env";

type CreateAppCheckoutParams = {
  productId: string;
  customerEmail: string;
  customerName: string;
  userId: string;
};

export async function createAppCheckoutSession(params: CreateAppCheckoutParams) {
  return dodoCreateCheckoutSession(
    {
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      return_url: env.DODO_PAYMENTS_RETURN_URL,
      metadata: {
        user_id: params.userId,
      },
    },
    {
      bearerToken: env.DODO_PAYMENTS_API_KEY,
      environment: env.DODO_PAYMENTS_ENVIRONMENT,
    }
  );
}
