import { createCheckoutSession as dodoCreateCheckoutSession } from "@dodopayments/core/checkout";
import { getDodoPaymentsConfig } from "@/lib/payments/config";

type CreateAppCheckoutParams = {
  productId: string;
  customerEmail: string;
  customerName: string;
  userId: string;
};

export async function createAppCheckoutSession(params: CreateAppCheckoutParams) {
  const { apiKey, environment, returnUrl } = getDodoPaymentsConfig();

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
      bearerToken: apiKey,
      environment,
    }
  );
}
