export type PlanId = "free" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  description: string;
  /** null for paid plans — product ID is resolved server-side from env */
  dodoProductId: string | null;
  features: string[];
  highlighted: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Get started at no cost",
    dodoProductId: null,
    features: [
      "Up to 5 projects",
      "Basic analytics",
      "Community support",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19/mo",
    description: "For growing teams",
    dodoProductId: null,
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "Custom domains",
    ],
    highlighted: true,
  },
];

export function planFromProductId(
  productId: string,
  proProductId: string
): PlanId {
  if (productId === proProductId) {
    return "pro";
  }
  return "pro";
}

export function hasAccess(userPlan: PlanId, requiredPlan: PlanId): boolean {
  const order: PlanId[] = ["free", "pro", "enterprise"];
  return order.indexOf(userPlan) >= order.indexOf(requiredPlan);
}

export function getPlanById(planId: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === planId);
}

export function getPlanDisplayName(planId: PlanId): string {
  return getPlanById(planId)?.name ?? planId;
}
