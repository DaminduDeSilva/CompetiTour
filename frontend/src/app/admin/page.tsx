"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Users, Check, Clock, X, LogOut } from "lucide-react";
import { fetchUsersAdmin, approveUserAdmin, deactivateUserAdmin, adminSignOut } from "./actions";

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
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetchUsersAdmin();
      if (res.error) {
        router.push('/admin/login?error=Session expired or unauthorized');
        return;
      }
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await approveUserAdmin(id);
      if (res.success) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: true } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const res = await deactivateUserAdmin(id);
      if (res.success) {
        setUsers(users.map(u => u.id === id ? { ...u, is_active: false } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic metrics from real data — no hardcoding
  const nonAdminUsers = users.filter(u => !u.is_superuser);
  const totalDMCs = nonAdminUsers.length;
  const activeDMCs = nonAdminUsers.filter(u => u.is_active).length;
  const pendingDMCs = nonAdminUsers.filter(u => !u.is_active).length;

  const metrics = [
    { label: "Registered DMCs", value: totalDMCs.toString(), sub: "Total signups (excl. admins)", icon: Users, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20" },
    { label: "Active Tenants", value: activeDMCs.toString(), sub: "Approved for access", icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Pending Approvals", value: pendingDMCs.toString(), sub: "Awaiting verification", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  ];

  return (
    <AdminPageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-white">Admin Control Plane</h2>
            <p className="text-xs text-gray-300 mt-1">Tenant verification and platform management</p>
          </div>
          
          <form action={adminSignOut}>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">
              <LogOut size={12} /> Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{m.label}</span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${m.bg} ${m.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-white">{m.value}</div>
                <div className="text-xs text-gray-300 mt-1">{m.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approvals Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Registered DMCs & Approvals</h3>
          </div>
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-900 text-xs text-gray-500 uppercase tracking-wider font-bold">
                  <th className="pb-3">Company / Email</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Registration Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">Loading user registry...</td>
                  </tr>
                ) : nonAdminUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">No DMC users found.</td>
                  </tr>
                ) : (
                  nonAdminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-900/20 transition-colors group">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{user.company_name || user.full_name || user.email.split('@')[0]}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold text-gray-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          {user.subscription_tier || "Free Trial"}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check size={10} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={10} /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!user.is_active && (
                            <button 
                              onClick={() => handleApprove(user.id)}
                              className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                              title="Approve Tenant"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeactivate(user.id)}
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                            title={user.is_active ? "Deactivate Tenant" : "Reject Tenant"}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white">Pending Queue</h3>
            <p className="text-xs text-gray-400">
              {pendingDMCs > 0 
                ? `There are ${pendingDMCs} DMC accounts waiting for verification. Ensure you verify their organizational legitimacy before allocating proxy limits.`
                : "All DMC accounts have been verified. No pending approvals."
              }
            </p>
          </div>
          <Link href="/admin/tenants" className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-3 hover:border-zinc-700 transition-colors">
            <h3 className="text-sm font-bold text-white">Tenant Management →</h3>
            <p className="text-xs text-gray-400">View detailed tenant profiles, update plans, and manage account settings.</p>
          </Link>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
