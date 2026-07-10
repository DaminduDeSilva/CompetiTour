"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon, Save,
  CheckCircle, Building2, Bell, CreditCard, ArrowRight, Zap, KeyRound
} from "lucide-react";
import { useQuota, formatLimit } from "@/lib/quota";
import { fetchCurrentUserProfile, updateUserProfile, changePassword } from "@/app/(dashboard)/dashboard/actions";

export default function SettingsPage() {
  const { usage, plan, limit, usedPct } = useQuota();

  // Profile state
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Notification state (UI only for now)
  const [alertThreshold, setAlertThreshold] = useState(15);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRes = await fetchCurrentUserProfile();
        if (profileRes?.user) {
          if (profileRes.user.company_name) {
            setCompanyName(profileRes.user.company_name);
          }
          if (profileRes.user.email) {
            setContactEmail(profileRes.user.email);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile in settings:", err);
      }
    };
    loadProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError("");
    setProfileSuccess(false);

    try {
      const res = await updateUserProfile({ company_name: companyName });
      if (res.error) {
        setProfileError(res.error);
      } else {
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError("");
    setPasswordSuccess(false);

    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess(true);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3">
            <SettingsIcon size={28} className="text-sky-400" />
            Settings
          </h2>
          <p className="text-sm text-sky-200/60 mt-1 font-medium tracking-wide">Manage your workspace and account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Company Profile */}
          <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 size={16} className="text-sky-400" /> Company Profile
              </h3>
              {profileSuccess && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={12} /> Saved
                </span>
              )}
            </div>
            
            {profileError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Company Name</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Contact Email (Cannot be changed)</label>
                <input type="email" value={contactEmail} disabled
                  className="px-4 py-2.5 rounded-xl border border-zinc-900 bg-zinc-900/50 text-xs text-gray-500 cursor-not-allowed" />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={isSavingProfile}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-xs font-bold text-black transition-colors cursor-pointer">
                <Save size={14} /> {isSavingProfile ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          {/* Password Settings */}
          <form onSubmit={handleSavePassword} className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound size={16} className="text-sky-400" /> Change Password
              </h3>
              {passwordSuccess && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={12} /> Password Updated
                </span>
              )}
            </div>

            {passwordError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                {passwordError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 md:col-span-2 max-w-sm">
                <label className="text-xs font-semibold text-gray-400">Current Password</label>
                <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-sm">
                <label className="text-xs font-semibold text-gray-400">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-sm">
                <label className="text-xs font-semibold text-gray-400">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
              <button type="submit" disabled={isSavingPassword || !oldPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-xs font-bold text-black transition-colors cursor-pointer">
                <Save size={14} /> {isSavingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>

          {/* Notification Preferences */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-sky-400" /> Notification Preferences
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 max-w-xs">
                <label className="text-xs font-semibold text-gray-400">Alert Threshold — Leakage (% gap)</label>
                <p className="text-[10px] text-gray-400">Send alert when a package is underpriced by more than this amount</p>
                <div className="flex items-center gap-3">
                  <input type="number" min={5} max={50} value={alertThreshold}
                    onChange={(e) => setAlertThreshold(Number(e.target.value))}
                    className="w-24 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
                  <span className="text-xs text-gray-300">% gap</span>
                </div>
              </div>
              {[
                { label: "Email Alerts", sub: "Receive alert emails to your contact address", val: emailAlerts, set: setEmailAlerts },
                { label: "In-App Notifications", sub: "Show alerts in the notification bell", val: inAppAlerts, set: setInAppAlerts },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                  <div>
                    <p className="text-xs font-semibold text-white">{pref.label}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{pref.sub}</p>
                  </div>
                  <button type="button" onClick={() => pref.set(!pref.val)}
                    className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${pref.val ? "bg-sky-500" : "bg-zinc-700"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${pref.val ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Plan info */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {(() => {
            const barColor = usedPct >= 95 ? "bg-red-500" : usedPct >= 80 ? "bg-amber-400" : "bg-sky-500";
            const textColor = usedPct >= 95 ? "text-red-400" : usedPct >= 80 ? "text-amber-400" : "text-sky-400";
            return (
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-sky-400" /> Plan & Usage
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                    {plan.name}
                  </span>
                </div>

                {/* Usage meter */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="flex items-center gap-1 text-gray-400"><Zap size={10} className={textColor} /> Audits This Month</span>
                    <span className={`font-black ${textColor}`}>{usage.auditsUsed}/{formatLimit(limit)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: limit === Infinity ? "0%" : `${usedPct}%` }}
                    />
                  </div>
                  {usedPct >= 80 && (
                    <p className={`text-[10px] font-semibold ${textColor}`}>
                      {usedPct >= 95 ? "⚠ Quota almost exhausted — upgrade now" : "⚠ Approaching your monthly limit"}
                    </p>
                  )}
                </div>

                {/* Plan details */}
                <div className="flex flex-col gap-2.5 text-xs border-t border-zinc-900 pt-3">
                  {[
                    { label: "Max Packages",   val: formatLimit(plan.packages) },
                    { label: "Source Markets", val: formatLimit(plan.markets) },
                    { label: "OTA Platforms",  val: `${plan.otas} platforms` },
                    { label: "Renewal",        val: usage.billingPeriodEnd },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-gray-400">{r.label}</span>
                      <span className="font-bold text-white">{r.val}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/billing"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-300 hover:text-white transition-colors"
                >
                  Manage Billing & Plans
                  <ArrowRight size={13} />
                </Link>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
