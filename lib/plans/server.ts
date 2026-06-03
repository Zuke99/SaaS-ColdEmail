import { getPlanById, type Plan, type PlanId } from "@/config/plans";
import { getDodoPaymentsConfig } from "@/lib/payments/config";

export function getPlanForCheckout(planId: PlanId): Plan | undefined {
  const plan = getPlanById(planId);
  if (!plan) {
    return undefined;
  }
  if (plan.id === "pro") {
    const { productId } = getDodoPaymentsConfig();
    return { ...plan, dodoProductId: productId };
  }
  return plan;
}
