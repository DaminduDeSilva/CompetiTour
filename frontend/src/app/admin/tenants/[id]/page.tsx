"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { ArrowLeft, ShieldCheck, ShieldOff, Users, FolderHeart, BarChart3, Save, CheckCircle } from "lucide-react";

// TODO(backend): Fetch from GET /admin/tenants/{id}
const tenantData: Record<string, {
  id: string; name: string; email: string; plan: string; status: string;
  contactName: string; phone: string; joined: string;
  packages: number; audits: number; markets: string[]; lastActive: string;
  proxySubuser: string; marketZone: string; monthlyAudits: number; maxAudits: number;
  recentAudits: { pkg: string; market: string; variance: string; status: string; date: string }[];
}> = {
  "t-001": {
    id: "t-001", name: "Horizon DMC", email: "ops@horizondmc.lk", plan: "Standard",
    status: "active", contactName: "Tharanga De Silva", phone: "+94 77 234 5678",
    joined: "March 15, 2026", packages: 5, audits: 23, markets: ["DE","GB","AU"],
    lastActive: "Just now", proxySubuser: "zt-sub-horizondmc", marketZone: "EU West",
    monthlyAudits: 23, maxAudits: 50,
    recentAudits: [
      { pkg: "Adventure & Wildlife Safari", market: "🇩🇪 Germany", variance: "-20.5%", status: "leakage", date: "June 21" },
      { pkg: "Cultural Triangle & Beach", market: "🇩🇪 Germany", variance: "+3.2%", status: "at_risk", date: "June 20" },
      { pkg: "Classic Sri Lanka Tour", market: "🇬🇧 UK", variance: "+3.0%", status: "at_risk", date: "June 20" },
    ],
  },
  "t-002": {
    id: "t-002", name: "Jetwing Travels", email: "tech@jetwing.net", plan: "Enterprise",
    status: "active", contactName: "Suresh Wickramanayake", phone: "+94 11 234 5678",
    joined: "January 10, 2026", packages: 12, audits: 87, markets: ["DE","GB","FR","AU"],
    lastActive: "2h ago", proxySubuser: "zt-sub-jetwing", marketZone: "EU + APAC",
    monthlyAudits: 87, maxAudits: 200,
    recentAudits: [
      { pkg: "Jetwing Surf Experience", market: "🇩🇪 Germany", variance: "-8.1%", status: "competitive", date: "June 21" },
      { pkg: "Cultural Heritage Tour", market: "🇫🇷 France", variance: "-14.2%", status: "leakage", date: "June 19" },
    ],
  },
  "t-003": {
    id: "t-003", name: "Walkers Tours", email: "pricing@walkers.lk", plan: "Enterprise",
    status: "active", contactName: "Kavinda Edirisinghe", phone: "+94 11 345 6789",
    joined: "February 5, 2026", packages: 8, audits: 41, markets: ["DE","JP"],
    lastActive: "1d ago", proxySubuser: "zt-sub-walkers", marketZone: "EU + APAC",
    monthlyAudits: 41, maxAudits: 200,
    recentAudits: [
      { pkg: "Japan & Sri Lanka Twin", market: "🇯🇵 Japan", variance: "-11.3%", status: "leakage", date: "June 20" },
    ],
  },
  "t-004": {
    id: "t-004", name: "Cinnamon Holidays", email: "ops@cinnamonholidays.com", plan: "Standard",
    status: "suspended", contactName: "Priya Jayasinghe", phone: "+94 77 890 1234",
    joined: "May 1, 2026", packages: 3, audits: 6, markets: ["GB"],
    lastActive: "7d ago", proxySubuser: "zt-sub-cinnamon", marketZone: "EU West",
    monthlyAudits: 6, maxAudits: 50,
    recentAudits: [],
  },
};

const statusVariantColor: Record<string, string> = {
  leakage: "text-blue-400",
  at_risk: "text-yellow-400",
  competitive: "text-emerald-400",
};

export default function TenantDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "t-001";
  const t = tenantData[id] ?? tenantData["t-001"];

  const [plan, setPlan] = useState(t.plan);
  const [status, setStatus] = useState(t.status);
  const [saved, setSaved] = useState(false);

  // TODO(backend): PATCH /admin/tenants/{id} — update plan/status
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const usagePct = Math.round((t.monthlyAudits / t.maxAudits) * 100);

  return (
    <AdminPageWrapper>
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <Link href="/admin/tenants" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to Tenants
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          <button onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-xs font-bold text-white transition-colors cursor-pointer">
            <Save size={13} /> Save Changes
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Users size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{t.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{t.email} · {t.contactName} · {t.phone}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">Joined {t.joined}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Edit controls */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Account Settings</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Plan Tier</label>
                {/* TODO(backend): changing plan updates tenant billing limits */}
                <select value={plan} onChange={(e) => setPlan(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none appearance-none">
                  <option value="Standard">Standard (50 audits/mo)</option>
                  <option value="Enterprise">Enterprise (200 audits/mo)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Account Status</label>
                {/* TODO(backend): suspend/reactivate writes to tenants.status in DB */}
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none appearance-none">
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Proxy Sub-user (read-only)</label>
                <input type="text" value={t.proxySubuser} disabled
                  className="px-4 py-2.5 rounded-xl border border-zinc-900 bg-zinc-950 text-xs text-gray-500 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Monthly Usage</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Audits this month</span>
                <span className="text-white font-bold">{t.monthlyAudits} / {t.maxAudits}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-900">
                <div className={`h-2 rounded-full transition-all ${usagePct > 80 ? "bg-red-500" : "bg-sky-500"}`}
                  style={{ width: `${usagePct}%` }} />
              </div>
              <p className="text-[10px] text-gray-600">{usagePct}% of plan limit used</p>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {[
                { label: "Packages", value: t.packages, icon: <FolderHeart size={12} /> },
                { label: "Total Audit Runs", value: t.audits, icon: <BarChart3 size={12} /> },
              ].map((s) => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-gray-500">{s.icon}{s.label}</span>
                  <span className="font-bold text-white">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Recent audits */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white">Recent Audit Runs</h3>
          {t.recentAudits.length > 0 ? (
            <div className="flex flex-col divide-y divide-zinc-900">
              {t.recentAudits.map((a, i) => (
                <div key={i} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{a.pkg}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.market} · {a.date}</p>
                  </div>
                  <span className={`text-sm font-black ${statusVariantColor[a.status]}`}>{a.variance}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-12 text-gray-600 text-sm">
              No audit runs yet for this tenant.
            </div>
          )}

          {/* Markets */}
          <div className="pt-4 border-t border-zinc-900">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Active Source Markets</p>
            <div className="flex gap-2">
              {t.markets.map((m) => (
                <span key={m} className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
