"use client";
import React from "react";
import Link from "next/link";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Users, Network, Cpu, Globe, TrendingUp, Activity, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

// TODO(backend): Fetch from GET /admin/usage (platform-wide metrics)
const metrics = [
  { label: "Active Tenants", value: "4", sub: "2 Enterprise, 2 Standard", icon: Users, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
  { label: "Proxy Sessions (24h)", value: "5,842", sub: "98.4% success rate", icon: Network, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { label: "Scraper Workers", value: "8", sub: "6 active, 2 idle", icon: Cpu, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { label: "Audit Runs (24h)", value: "23", sub: "Across 3 target markets", icon: Globe, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
];

const recentActivity = [
  { tenant: "Horizon DMC", event: "Audit completed — Adventure & Wildlife Safari (DE)", time: "2 mins ago", status: "leakage" },
  { tenant: "Jetwing Travels", event: "New package submitted — Jaffna Heritage Circuit", time: "14 mins ago", status: "pending" },
  { tenant: "Walkers Tours", event: "Audit completed — Beach & Culture Combo (GB)", time: "31 mins ago", status: "competitive" },
  { tenant: "Horizon DMC", event: "Audit completed — Cultural Triangle & Beach (DE)", time: "1h ago", status: "at_risk" },
  { tenant: "Cinnamon Holidays", event: "New account onboarded", time: "3h ago", status: "info" },
];

const statusDot: Record<string, string> = {
  leakage: "bg-blue-400",
  competitive: "bg-emerald-400",
  at_risk: "bg-yellow-400",
  pending: "bg-gray-500",
  info: "bg-sky-400",
};

export default function AdminDashboardPage() {
  return (
    <AdminPageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Platform Overview</h2>
          <p className="text-xs text-gray-500 mt-1">ZeroTrace CompetiTour — Real-time platform health & tenant activity</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
          <Activity size={12} className="animate-pulse" /> All Systems Operational
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{m.label}</span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${m.bg} ${m.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">{m.value}</div>
                <div className="text-xs text-gray-500 mt-1">{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Platform Activity</h3>
            <Link href="/admin/tenants" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-zinc-900">
            {recentActivity.map((a, i) => (
              <div key={i} className="py-3.5 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusDot[a.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white">{a.tenant}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{a.event}</p>
                </div>
                <span className="text-[10px] text-gray-600 shrink-0 whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
            {[
              { label: "Manage Tenants", href: "/admin/tenants", icon: Users },
              { label: "Proxy Pool Health", href: "/admin/proxy", icon: Network },
              { label: "Worker Queue", href: "/admin/workers", icon: Cpu },
              { label: "OTA Platforms", href: "/admin/ota", icon: Globe },
            ].map((l) => {
              const Icon = l.icon;
              return (
                <Link key={l.label} href={l.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all group">
                  <Icon size={15} className="text-gray-500 group-hover:text-white transition-colors" />
                  <span className="text-xs font-semibold text-gray-400 group-hover:text-white transition-colors">{l.label}</span>
                  <ArrowRight size={12} className="ml-auto text-gray-700 group-hover:text-gray-400 transition-colors" />
                </Link>
              );
            })}
          </div>

          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">3 Leakage Alerts</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Horizon DMC has packages underpriced by {">"} 20% in DE & AU markets.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
