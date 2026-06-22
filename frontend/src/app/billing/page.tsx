"use client";
import React from "react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import {
  CreditCard, CheckCircle2, Zap, Globe, FolderOpen,
  Building2, ArrowRight, Mail
} from "lucide-react";
import {
  PLANS,
  CURRENT_USAGE,
  getCurrentPlan,
  getUsagePercent,
  formatLimit,
  type Plan,
} from "@/lib/quota";

const FEATURES: { label: string; free: string; starter: string; professional: string; enterprise: string }[] = [
  { label: "Audits / Month",      free: "3",          starter: "10",         professional: "50",        enterprise: "Unlimited" },
  { label: "Packages",            free: "2",          starter: "5",          professional: "25",        enterprise: "Unlimited" },
  { label: "Source Markets",      free: "1",          starter: "2",          professional: "5",         enterprise: "Unlimited" },
  { label: "OTA Platforms",       free: "2",          starter: "3",          professional: "All 4",     enterprise: "All 4" },
  { label: "AI Matching (LLM)",   free: "BGE-M3 only",starter: "Claude Haiku",professional: "Claude Sonnet", enterprise: "Custom Model" },
  { label: "Proxy Type",          free: "Shared",     starter: "Residential", professional: "Dual-Proxy", enterprise: "Dedicated" },
  { label: "PDF Reports",         free: "—",          starter: "✓",          professional: "✓",         enterprise: "✓ + White-label" },
  { label: "Support",             free: "Community",  starter: "Email",      professional: "Priority",  enterprise: "Dedicated CSM" },
];

const colorMap: Record<string, { ring: string; badge: string; btn: string; accent: string; bar: string }> = {
  zinc:    { ring: "border-zinc-700",           badge: "text-gray-400 bg-zinc-800 border-zinc-700",      btn: "bg-zinc-800 hover:bg-zinc-700 text-white",                    accent: "text-gray-300", bar: "bg-zinc-600" },
  sky:     { ring: "border-sky-500/40",         badge: "text-sky-400 bg-sky-500/10 border-sky-500/30",   btn: "bg-sky-500 hover:bg-sky-400 text-black",                      accent: "text-sky-400",  bar: "bg-sky-500" },
  indigo:  { ring: "border-indigo-500/50 shadow-lg shadow-indigo-500/10", badge: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30", btn: "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white", accent: "text-indigo-300", bar: "bg-indigo-500" },
  purple:  { ring: "border-purple-500/40",      badge: "text-purple-300 bg-purple-500/10 border-purple-500/30", btn: "bg-purple-600 hover:bg-purple-500 text-white",           accent: "text-purple-300", bar: "bg-purple-500" },
};

function PlanCard({ plan, isCurrent }: { plan: Plan; isCurrent: boolean }) {
  const c = colorMap[plan.color];
  const usedPct = isCurrent ? getUsagePercent() : 0;
  const limit = plan.auditsPerMonth;

  return (
    <div className={`relative p-6 rounded-2xl border bg-zinc-950/60 backdrop-blur-md flex flex-col gap-5 transition-all duration-200 ${c.ring} ${isCurrent ? "ring-1 ring-offset-1 ring-offset-black " + c.ring : "border-zinc-900 hover:border-zinc-700"}`}>
      {/* Current / Popular Badge */}
      {isCurrent && (
        <span className="absolute -top-3 left-6 text-[10px] font-black px-3 py-0.5 rounded-full border bg-black text-emerald-400 border-emerald-500/40">
          ✦ Current Plan
        </span>
      )}
      {!isCurrent && plan.badge && (
        <span className={`absolute -top-3 left-6 text-[10px] font-black px-3 py-0.5 rounded-full border bg-black ${c.badge}`}>
          {plan.badge}
        </span>
      )}

      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-white">{plan.name}</h3>
        <p className={`text-2xl font-black mt-1 ${c.accent}`}>{plan.price}</p>
      </div>

      {/* Quota summary */}
      <div className="flex flex-col gap-2 text-xs">
        {[
          { icon: <Zap size={12} />, label: `${formatLimit(limit)} audits/month` },
          { icon: <FolderOpen size={12} />, label: `${formatLimit(plan.packages)} packages` },
          { icon: <Globe size={12} />, label: `${formatLimit(plan.markets)} source markets` },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-gray-300">
            <span className={c.accent}>{f.icon}</span>
            {f.label}
          </div>
        ))}
      </div>

      {/* Usage bar if current */}
      {isCurrent && limit !== Infinity && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-400">Usage this month</span>
            <span className={`font-bold ${c.accent}`}>{CURRENT_USAGE.auditsUsed}/{limit}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      )}

      {/* CTA */}
      {isCurrent ? (
        <button disabled className="w-full py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-zinc-900 border border-zinc-800 cursor-not-allowed">
          Active Plan
        </button>
      ) : plan.id === "enterprise" ? (
        <a
          href="mailto:hello@zerotrace.io"
          className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${c.btn}`}
        >
          <Mail size={13} />
          Contact ZeroTrace
        </a>
      ) : (
        <button className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${c.btn}`}>
          Upgrade to {plan.name}
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

export default function BillingPage() {
  const currentPlan = getCurrentPlan();
  const usedPct = getUsagePercent();

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard size={20} className="text-sky-400" />
            Billing & Plans
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Subscription tiers aligned to your proxy data consumption. Upgrade to unlock more source markets and audit runs.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs">
          <Building2 size={13} className="text-gray-400" />
          <span className="text-gray-300">Horizon DMC</span>
          <span className="h-3 w-px bg-zinc-700" />
          <span className="font-bold text-white">{currentPlan.name}</span>
        </div>
      </div>

      {/* Current cycle summary */}
      <div className="p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-white">Current Billing Cycle</p>
          <p className="text-[10px] text-gray-400">Renews on <strong className="text-gray-200">{CURRENT_USAGE.billingPeriodEnd}</strong> · Managed by ZeroTrace</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-400">Audits Used</p>
            <p className="text-lg font-black text-white">{CURRENT_USAGE.auditsUsed}<span className="text-gray-500 text-sm font-medium">/{formatLimit(currentPlan.auditsPerMonth)}</span></p>
          </div>
          <div className="w-32">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Usage</span>
              <span className={usedPct >= 80 ? "text-amber-400 font-bold" : ""}>{usedPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usedPct >= 95 ? "bg-red-500" : usedPct >= 80 ? "bg-amber-400" : "bg-indigo-500"}`}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} isCurrent={plan.id === CURRENT_USAGE.planId} />
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white">Feature Comparison</h3>
        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-5 px-6 py-3 border-b border-zinc-900 bg-zinc-950/60 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>Feature</span>
            {PLANS.map((p) => (
              <span key={p.id} className={`text-center ${p.id === CURRENT_USAGE.planId ? "text-indigo-300" : ""}`}>{p.name}</span>
            ))}
          </div>
          {FEATURES.map((row, idx) => (
            <div
              key={row.label}
              className={`grid grid-cols-5 px-6 py-3 text-xs ${idx % 2 === 0 ? "bg-zinc-950/20" : ""} border-b border-zinc-900/50 last:border-0`}
            >
              <span className="text-gray-300 font-medium">{row.label}</span>
              {[row.free, row.starter, row.professional, row.enterprise].map((val, i) => {
                const planId = PLANS[i].id;
                const isCurrent = planId === CURRENT_USAGE.planId;
                return (
                  <span
                    key={i}
                    className={`text-center font-medium ${
                      val === "—" ? "text-zinc-700" :
                      val === "✓" || val.startsWith("✓") ? "text-emerald-400" :
                      isCurrent ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {val}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Contact footer */}
      <div className="flex items-center justify-between p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60">
        <div>
          <p className="text-xs font-bold text-white">Need a custom plan?</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Enterprise pricing and dedicated infrastructure. Contact your ZeroTrace account manager.</p>
        </div>
        <a
          href="mailto:hello@zerotrace.io"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white transition-colors"
        >
          <Mail size={13} />
          hello@zerotrace.io
        </a>
      </div>
    </PageWrapper>
  );
}
