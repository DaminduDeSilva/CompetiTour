"use client";
import React, { useState } from "react";
import Link from "next/link";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Users, Plus, Eye, ShieldOff, ShieldCheck, Search, ArrowRight } from "lucide-react";

// TODO(backend): Fetch from GET /admin/tenants with pagination
const tenants = [
  { id: "t-001", name: "Horizon DMC", email: "ops@horizondmc.lk", plan: "Standard", status: "active", packages: 5, lastActive: "Just now", audits: 23, markets: ["DE","GB","AU"] },
  { id: "t-002", name: "Jetwing Travels", email: "tech@jetwing.net", plan: "Enterprise", status: "active", packages: 12, lastActive: "2h ago", audits: 87, markets: ["DE","GB","FR","AU"] },
  { id: "t-003", name: "Walkers Tours", email: "pricing@walkers.lk", plan: "Enterprise", status: "active", packages: 8, lastActive: "1d ago", audits: 41, markets: ["DE","JP"] },
  { id: "t-004", name: "Cinnamon Holidays", email: "ops@cinnamonholidays.com", plan: "Standard", status: "suspended", packages: 3, lastActive: "7d ago", audits: 6, markets: ["GB"] },
];

const planColor: Record<string, string> = {
  Enterprise: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Standard:   "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

export default function TenantsPage() {
  const [search, setSearch] = useState("");
  const filtered = tenants.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminPageWrapper>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-red-400" /> Tenant Management</h2>
          <p className="text-xs text-gray-500 mt-1">{tenants.length} registered DMC organisations</p>
        </div>
        {/* TODO(backend): POST /admin/tenants — create tenant + send invite email */}
        <button onClick={() => alert("Invite flow: Enter email → system sends signed onboarding link.\n[TODO: wire to POST /admin/tenants]")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-xs font-bold text-white transition-colors cursor-pointer">
          <Plus size={14} /> Onboard New DMC
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-900 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              {["Organisation", "Plan", "Status", "Packages", "Audit Runs", "Markets", "Last Active", ""].map(h => (
                <th key={h} className="px-5 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-900/20 transition-colors">
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-white">{t.name}</p>
                    <p className="text-[10px] text-gray-500">{t.email}</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${planColor[t.plan]}`}>{t.plan}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                    t.status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
                  }`}>
                    {t.status === "active" ? <ShieldCheck size={10} /> : <ShieldOff size={10} />}
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-white">{t.packages}</td>
                <td className="px-5 py-4 text-gray-400">{t.audits}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {t.markets.map(m => <span key={m} className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-gray-400">{m}</span>)}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{t.lastActive}</td>
                <td className="px-5 py-4">
                  <Link href={`/admin/tenants/${t.id}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-gray-400 hover:text-white transition-colors">
                    <Eye size={11} /> Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageWrapper>
  );
}
