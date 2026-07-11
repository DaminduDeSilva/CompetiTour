"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { ArrowLeft, Users, Save, CheckCircle, BarChart3 } from "lucide-react";
import { fetchUserAdmin, updateUserAdmin } from "../../actions";

type UserDetail = {
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

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "";

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetchUserAdmin(id);
      if (res.error || !res.user) {
        router.push('/admin/tenants');
        return;
      }
      setUser(res.user);
      setPlan(res.user.subscription_tier || "Free Trial");
      setStatus(res.user.is_active ? "active" : "pending");
      setLoading(false);
    }
    load();
  }, [id]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const res = await updateUserAdmin(user.id, {
      subscription_tier: plan,
      is_active: status === "active",
    });
    if (res.success && res.user) {
      setUser(res.user);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading || !user) {
    return (
      <AdminPageWrapper>
        <div className="flex items-center justify-center py-20 text-gray-500 text-sm">Loading tenant details...</div>
      </AdminPageWrapper>
    );
  }

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
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50">
            <Save size={13} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <Users size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user.company_name || user.full_name || user.email.split("@")[0]}</h2>
          <p className="text-xs text-gray-300 mt-0.5">{user.email}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Joined {new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
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
                <select value={plan} onChange={(e) => setPlan(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none appearance-none">
                  <option value="Free Trial">Free Trial (3 audits/mo)</option>
                  <option value="Starter">Starter (10 audits/mo)</option>
                  <option value="Professional">Professional (50 audits/mo)</option>
                  <option value="Enterprise">Enterprise (Unlimited)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Account Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none appearance-none">
                  <option value="active">Active</option>
                  <option value="pending">Pending / Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Usage Summary</h3>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-gray-300"><BarChart3 size={12} /> Audits Used</span>
                <span className="font-bold text-white">{user.audits_used ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Current Plan</span>
                <span className="font-bold text-white">{user.subscription_tier || "Free Trial"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Account Status</span>
                <span className={`font-bold ${user.is_active ? "text-emerald-400" : "text-amber-400"}`}>
                  {user.is_active ? "Active" : "Pending"}
                </span>
              </div>
              {user.updated_at && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Last Updated</span>
                  <span className="text-gray-400">{new Date(user.updated_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Account info */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Email</label>
              <p className="text-sm text-white">{user.email}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Full Name</label>
              <p className="text-sm text-white">{user.full_name || "—"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Company</label>
              <p className="text-sm text-white">{user.company_name || "—"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">User ID</label>
              <p className="text-sm text-gray-400 font-mono text-[11px]">{user.id}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900">
            <p className="text-xs text-gray-400">
              Changes to plan tier and account status will take effect immediately. The user&apos;s billing page and quota enforcement will reflect the updated plan on their next page load.
            </p>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
