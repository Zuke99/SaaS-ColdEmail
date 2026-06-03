import Link from "next/link";
import { startCheckout } from "@/lib/actions/payments";
import type { Plan } from "@/config/plans";
import type { PlanId } from "@/config/plans";

type PricingCardProps = {
  plan: Plan;
  currentPlan: PlanId | null;
  isLoggedIn: boolean;
};

export function PricingCard({
  plan,
  currentPlan,
  isLoggedIn,
}: PricingCardProps) {
  const isCurrent = currentPlan === plan.id;

  return (
    <div
      className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sm sm:p-8 ${
        plan.highlighted
          ? "border-gray-900 ring-1 ring-gray-900"
          : "border-gray-200"
      }`}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
          Recommended
        </span>
      ) : null}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          {plan.price}
        </p>
        <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
      </div>

      <ul className="mb-8 flex-1 space-y-3 text-sm text-gray-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <span className="text-gray-900" aria-hidden="true">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <span className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-center text-sm font-medium text-gray-600">
          Current plan
        </span>
      ) : plan.id === "free" ? (
        <Link
          href={isLoggedIn ? "/dashboard" : "/signup"}
          className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 text-center text-sm font-medium text-gray-900 transition hover:bg-gray-50"
        >
          Get started
        </Link>
      ) : isLoggedIn ? (
        <form action={startCheckout.bind(null, plan.id)}>
          <button
            type="submit"
            className={`w-full rounded-lg py-2.5 text-sm font-medium transition ${
              plan.highlighted
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
            }`}
          >
            Upgrade
          </button>
        </form>
      ) : (
        <Link
          href="/login"
          className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition ${
            plan.highlighted
              ? "bg-gray-900 text-white hover:bg-gray-800"
              : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
          }`}
        >
          Log in to upgrade
        </Link>
      )}
    </div>
  );
}
