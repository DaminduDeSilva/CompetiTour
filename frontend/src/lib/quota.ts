// TODO(backend): Replace with a real API call to GET /settings/plan
// This file is the single source of truth for quota/plan state in the frontend.

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

// Mock: simulating a Professional plan user mid-cycle
export const CURRENT_USAGE: CurrentUsage = {
  planId: "professional",
  auditsUsed: 7,
  packagesCreated: 5,
  billingPeriodEnd: "2026-08-01",
};

export function getCurrentPlan(): Plan {
  return PLANS.find((p) => p.id === CURRENT_USAGE.planId) ?? PLANS[1];
}

export function getAuditLimit(): number {
  return getCurrentPlan().auditsPerMonth;
}

export function isQuotaExhausted(): boolean {
  const limit = getAuditLimit();
  return CURRENT_USAGE.auditsUsed >= limit;
}

export function getUsagePercent(): number {
  const limit = getAuditLimit();
  if (limit === Infinity) return 0;
  return Math.min(100, Math.round((CURRENT_USAGE.auditsUsed / limit) * 100));
}

export function formatLimit(val: number): string {
  return val === Infinity ? "Unlimited" : val.toString();
}
