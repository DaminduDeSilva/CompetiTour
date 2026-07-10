// This file provides a reactive hook for quota/plan state connected to the backend.
import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";

export type PlanId = "free_trial" | "starter" | "professional" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;          // display string e.g. "$0", "$49/mo"
  auditsPerMonth: number; // use Infinity for unlimited
  packages: number;
  markets: number;
  otas: number;
  badge?: string;         // optional highlight label
  color: string;          // tailwind ring/accent colour token
}

export const PLANS: Plan[] = [
  {
    id: "free_trial",
    name: "Free Trial",
    price: "$0",
    auditsPerMonth: 3,
    packages: 2,
    markets: 1,
    otas: 2,
    color: "zinc",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49/mo",
    auditsPerMonth: 10,
    packages: 5,
    markets: 2,
    otas: 3,
    color: "sky",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$149/mo",
    auditsPerMonth: 50,
    packages: 25,
    markets: 5,
    otas: 4,
    badge: "Most Popular",
    color: "indigo",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    auditsPerMonth: Infinity,
    packages: Infinity,
    markets: Infinity,
    otas: 4,
    badge: "Contact Us",
    color: "purple",
  },
];

export interface CurrentUsage {
  planId: PlanId;
  auditsUsed: number;
  packagesCreated: number;
  billingPeriodEnd: string; // ISO date string
}

export function formatLimit(val: number): string {
  return val === Infinity ? "Unlimited" : val.toString();
}

export function useQuota() {
  const [usage, setUsage] = useState<CurrentUsage>({
    planId: "free_trial",
    auditsUsed: 0,
    packagesCreated: 0,
    billingPeriodEnd: "",
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
            const res = await fetch(`${API_URL}/users/by-email/${data.session.user.email}`, {
                headers: { Authorization: `Bearer ${data.session.access_token}` }
            });
            if (res.ok) {
              const dbUser = await res.json();
              if (dbUser && dbUser.subscription_tier) {
                  let mappedId = dbUser.subscription_tier.toLowerCase().replace(" ", "_") as PlanId;
                  // fallback to starter if missing
                  if (!PLANS.find(p => p.id === mappedId)) mappedId = "starter";
                  
                  setUsage(prev => ({
                      ...prev,
                      planId: mappedId,
                      auditsUsed: dbUser.audits_used || 0
                  }));
              }
            }
        } catch(e) { console.error("Failed to load user quota", e); }
        finally { setLoading(false); }
      } else {
        setLoading(false);
      }
    }
    load();
  }, []);

  const plan = PLANS.find((p) => p.id === usage.planId) ?? PLANS[1];
  const limit = plan.auditsPerMonth;
  const usedPct = limit === Infinity ? 0 : Math.min(100, Math.round((usage.auditsUsed / limit) * 100));
  const exhausted = usage.auditsUsed >= limit;

  return { usage, plan, limit, usedPct, exhausted, loading };
}
