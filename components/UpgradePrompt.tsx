import Link from "next/link";
import { getPlanById, type PlanId } from "@/config/plans";
import { startCheckout } from "@/lib/actions/payments";

type UpgradePromptProps = {
  requiredPlan?: PlanId;
  title?: string;
};

export function UpgradePrompt({
  requiredPlan = "pro",
  title = "Upgrade required",
}: UpgradePromptProps) {
  const plan = getPlanById(requiredPlan);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">
        This feature requires the{" "}
        <span className="font-medium text-gray-900">{plan?.name ?? requiredPlan}</span>{" "}
        plan.
      </p>
      {plan?.features.length ? (
        <ul className="mt-4 space-y-2 text-sm text-gray-700">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-600" aria-hidden="true">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form action={startCheckout.bind(null, requiredPlan)}>
          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 sm:w-auto"
          >
            Upgrade now
          </button>
        </form>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          View all plans
        </Link>
      </div>
    </div>
  );
}
