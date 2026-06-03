export type PlanId = "free" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  description: string;
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
    dodoProductId: process.env.DODO_PRO_PRODUCT_ID ?? "",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "Custom domains",
    ],
    highlighted: true,
  },
];

export function planFromProductId(productId: string): PlanId {
  const match = PLANS.find((p) => p.dodoProductId === productId);
  return match?.id ?? "pro";
}

export function hasAccess(userPlan: PlanId, requiredPlan: PlanId): boolean {
  const order: PlanId[] = ["free", "pro", "enterprise"];
  return order.indexOf(userPlan) >= order.indexOf(requiredPlan);
}

export function getPlanById(planId: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === planId);
}
