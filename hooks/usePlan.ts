"use client";

import { useCallback, useEffect, useState } from "react";
import { hasAccess, type PlanId } from "@/config/plans";
import { createClient } from "@/lib/supabase/client";
import { fromAppTable } from "@/lib/supabase/schema";

export function usePlan() {
  const [plan, setPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadPlan() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setPlan("free");
        setLoading(false);
        return;
      }

      const { data: profile } = await fromAppTable(supabase, "profiles")
        .select("plan, subscription_ends_at")
        .eq("id", user.id)
        .maybeSingle();

      let resolvedPlan = (profile?.plan ?? "free") as PlanId;

      if (
        resolvedPlan !== "free" &&
        profile?.subscription_ends_at &&
        new Date(profile.subscription_ends_at) <= new Date()
      ) {
        resolvedPlan = "free";
      }

      setPlan(resolvedPlan);
      setLoading(false);
    }

    loadPlan();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadPlan();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAccess = useCallback(
    (requiredPlan: PlanId) => hasAccess(plan, requiredPlan),
    [plan]
  );

  return { plan, hasAccess: checkAccess, loading };
}
