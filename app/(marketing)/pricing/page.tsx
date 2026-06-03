import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURES } from "@/config/features";
import { PLANS } from "@/config/plans";
import { PricingCard } from "@/components/pricing/PricingCard";
import { redirectToCustomerPortal } from "@/lib/actions/payments";
import { createClient } from "@/lib/supabase/server";
import { fromAppTable } from "@/lib/supabase/schema";
import { getPlan } from "@/lib/supabase/getPlan";
import type { PlanId } from "@/config/plans";

type PricingPageProps = {
  searchParams: { error?: string };
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  if (!FEATURES.payments) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: PlanId | null = null;
  let hasBillingAccount = false;

  if (user) {
    currentPlan = await getPlan(user.id);
    const { data: profile } = await fromAppTable(supabase, "profiles")
      .select("dodo_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    hasBillingAccount = Boolean(profile?.dodo_customer_id);
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-gray-600">
            Choose the plan that fits your SaaS. Upgrade or manage billing anytime.
          </p>
        </div>

        {searchParams.error ? (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {searchParams.error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              isLoggedIn={Boolean(user)}
            />
          ))}
        </div>

        {user && hasBillingAccount ? (
          <div className="mt-10 text-center">
            <form action={redirectToCustomerPortal}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-700 underline hover:text-gray-900"
              >
                Manage billing & subscription
              </button>
            </form>
          </div>
        ) : null}

        <p className="mt-10 text-center text-sm text-gray-500">
          <Link href="/" className="font-medium text-gray-700 hover:text-gray-900">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
