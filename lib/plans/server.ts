import { env } from "@/env";
import { getPlanById, type Plan, type PlanId } from "@/config/plans";

/** Resolves server-only Dodo product IDs for checkout (not for client bundles). */
export function getPlanForCheckout(planId: PlanId): Plan | undefined {
  const plan = getPlanById(planId);
  if (!plan) {
    return undefined;
  }
  if (plan.id === "pro") {
    return { ...plan, dodoProductId: env.DODO_PRO_PRODUCT_ID };
  }
  return plan;
}
