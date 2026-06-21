"use client";
import React, { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import {
  ShieldAlert, Cpu, Settings as SettingsIcon, Save,
  CheckCircle, KeyRound, Network, Building2, Bell, CreditCard
} from "lucide-react";

const TABS = ["Workspace", "AI Matcher", "Proxy Status"] as const;
type Tab = typeof TABS[number];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Workspace");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Workspace state
  // TODO(backend): Fetch from GET /settings/workspace; save to PUT /settings/workspace
  const [companyName, setCompanyName] = useState("Horizon DMC");
  const [contactEmail, setContactEmail] = useState("ops@horizondmc.lk");
  const [alertThreshold, setAlertThreshold] = useState(15);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);

  // AI Matcher state
  // TODO(backend): Fetch from GET /settings/matcher; save to PUT /settings/matcher
  const [model, setModel] = useState("claude-haiku");
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO(backend): PUT /settings/{workspace|matcher} with updated payload
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon size={20} className="text-sky-400" />
            Settings
          </h2>
          <p className="text-xs text-gray-500 mt-1">Manage your workspace, AI matcher, and proxy connection status</p>
        </div>
        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle size={14} /> Saved Successfully
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-900 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                : "text-gray-500 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {/* ── TAB 1: Workspace ── */}
        {activeTab === "Workspace" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">

              {/* Company Profile */}
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 size={16} className="text-sky-400" /> Company Profile
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Company Name</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Contact Email</label>
                    <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell size={16} className="text-sky-400" /> Notification Preferences
                </h3>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5 max-w-xs">
                    <label className="text-xs font-semibold text-gray-400">Alert Threshold — Leakage (% gap)</label>
                    <p className="text-[10px] text-gray-600">Send alert when a package is underpriced by more than this amount</p>
                    <div className="flex items-center gap-3">
                      <input type="number" min={5} max={50} value={alertThreshold}
                        onChange={(e) => setAlertThreshold(Number(e.target.value))}
                        className="w-24 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
                      <span className="text-xs text-gray-500">% gap</span>
                    </div>
                  </div>
                  {[
                    { label: "Email Alerts", sub: "Receive alert emails to your contact address", val: emailAlerts, set: setEmailAlerts },
                    { label: "In-App Notifications", sub: "Show alerts in the notification bell", val: inAppAlerts, set: setInAppAlerts },
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                      <div>
                        <p className="text-xs font-semibold text-white">{pref.label}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{pref.sub}</p>
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
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard size={16} className="text-sky-400" /> Plan & Limits
                </h3>
                {/* TODO(backend): Fetch plan details from GET /settings/plan */}
                <div className="flex flex-col gap-3 text-xs">
                  {[
                    { label: "Plan Tier",       val: "Standard",           highlight: true },
                    { label: "Max Packages",    val: "10 packages" },
                    { label: "Audits / Month",  val: "50 runs" },
                    { label: "Source Markets",  val: "3 markets" },
                    { label: "Renewal",         val: "August 1, 2026" },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center">
                      <span className="text-gray-500">{r.label}</span>
                      <span className={`font-bold ${r.highlight ? "text-sky-400" : "text-white"}`}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600">Plan changes are managed by ZeroTrace. Contact your account manager to upgrade.</p>
              </div>

              <button type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-sm font-bold text-black transition-colors cursor-pointer">
                <Save size={16} /> Save Workspace Settings
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 2: AI Matcher ── */}
        {activeTab === "AI Matcher" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu size={16} className="text-emerald-400" /> AI Matching Engine
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">LLM Verification Model</label>
                    {/* TODO(backend): Choices come from GET /admin/llm/models; save to PUT /settings/matcher */}
                    <select value={model} onChange={(e) => setModel(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none appearance-none">
                      <option value="claude-haiku">Claude Haiku — Fast, cost-effective</option>
                      <option value="claude-sonnet">Claude Sonnet — High accuracy</option>
                      <option value="bge-m3-only">BGE-M3 Embedding Only — No LLM</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-400">Minimum Confidence Threshold (%)</label>
                    <input type="number" min={60} max={99} value={confidenceThreshold}
                      onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                      className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-sky-500 focus:outline-none" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 leading-relaxed">
                  Items below the confidence threshold are flagged as unverified and excluded from margin calculations. BGE-M3 cosine similarity always runs first; LLM verification is only invoked for matches above the embedding threshold.
                </p>
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex flex-col gap-2">
                <p className="text-xs font-bold text-white flex items-center gap-2"><ShieldAlert size={14} className="text-amber-400" /> Usage Note</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">Claude Haiku is recommended for most audits. Use Sonnet only for high-value packages where accuracy is critical. BGE-M3 only mode consumes no API tokens.</p>
              </div>
              <button type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-sm font-bold text-black transition-colors cursor-pointer">
                <Save size={16} /> Save Matcher Config
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: Proxy Status ── */}
        {activeTab === "Proxy Status" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8">
              <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Network size={16} className="text-sky-400" />
                    Global Proxy Network (Torch Labs Integration)
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                    <KeyRound size={10} /> Managed by ZeroTrace
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Proxy gateway credentials and rotation policy are managed by ZeroTrace at the platform level. Your account is automatically assigned geotargeted exit nodes for each selected source market.
                </p>
                {/* TODO(backend): Fetch current proxy health from GET /admin/proxy/status (public endpoint, no credentials exposed) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-70">
                  {[
                    { label: "Gateway Host", val: "geox.torchproxies.com" },
                    { label: "Gateway Port", val: "6011" },
                    { label: "Assigned Sub-user", val: "zt-sub-horizondmc" },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-500">{f.label}</label>
                      <input type="text" value={f.val} disabled
                        className="px-4 py-2.5 rounded-xl border border-zinc-900 bg-zinc-950 text-xs text-gray-400 cursor-not-allowed" />
                    </div>
                  ))}
                </div>

                {/* Live session status */}
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-900">
                  <p className="text-xs font-semibold text-gray-400">Active Sessions</p>
                  {[
                    { type: "Premium Residential", ip: "46.112.88.24", zone: "Frankfurt, DE", success: "98.4%" },
                    { type: "ISP Sticky",          ip: "109.250.4.12", zone: "Frankfurt, DE", success: "99.1%" },
                  ].map((s) => (
                    <div key={s.type} className="flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-white">{s.type}</span>
                        <span className="text-gray-500">· {s.zone}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px]">
                        <span className="font-mono text-gray-500">{s.ip}</span>
                        <span className="font-bold text-emerald-400">{s.success} success</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 flex flex-col gap-2">
                <p className="text-xs font-bold text-white">Need a different proxy zone?</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">Source market zones are configured when you set up a package audit. Contact ZeroTrace to request additional market coverage not listed in your plan.</p>
              </div>
            </div>
          </div>
        )}
      </form>
    </PageWrapper>
  );
}
