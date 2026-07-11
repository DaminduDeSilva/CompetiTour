"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Users, Eye, ShieldCheck, Clock, Search } from "lucide-react";
import { fetchUsersAdmin } from "../actions";

type User = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  subscription_tier: string | null;
  audits_used: number | null;
  created_at: string;
  updated_at: string | null;
};

const planColor: Record<string, string> = {
  Enterprise:    "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Professional:  "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  Starter:       "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

export default function TenantsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetchUsersAdmin();
      if (res.error) {
        router.push('/admin/login?error=Session expired');
        return;
      }
      setUsers(res.users || []);
      setLoading(false);
    }
    load();
  }, []);

  // Filter out superusers — tenants only
  const tenants = users.filter(u => !u.is_superuser);
  const filtered = tenants.filter(t =>
    (t.company_name || t.full_name || t.email).toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPageWrapper>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Users size={20} className="text-red-400" /> Tenant Management</h2>
          <p className="text-xs text-gray-300 mt-1">{tenants.length} registered DMC organisations</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
        <input type="text" placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-900 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              {["Organisation", "Plan", "Status", "Audits Used", "Registered", ""].map(h => (
                <th key={h} className="px-5 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-500">Loading tenants...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                  {search ? "No tenants match your search." : "No tenants registered yet."}
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const tier = t.subscription_tier || "Free Trial";
                const pc = planColor[tier] || "text-gray-400 bg-zinc-900 border-zinc-800";
                return (
                  <tr key={t.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-bold text-white">{t.company_name || t.full_name || t.email.split("@")[0]}</p>
                        <p className="text-[10px] text-gray-300">{t.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${pc}`}>{tier}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                        t.is_active ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      }`}>
                        {t.is_active ? <ShieldCheck size={10} /> : <Clock size={10} />}
                        {t.is_active ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-white">{t.audits_used ?? 0}</td>
                    <td className="px-5 py-4 text-gray-300 whitespace-nowrap">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/tenants/${t.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-gray-400 hover:text-white transition-colors">
                        <Eye size={11} /> Manage
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminPageWrapper>
  );
}
