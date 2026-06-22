"use client";
import React, { useState } from "react";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Network, Save, CheckCircle, RefreshCw, Shield, Radio, AlertTriangle } from "lucide-react";

// TODO(backend): Fetch from GET /admin/proxy/config — master Torch Labs credentials
// TODO(backend): Fetch sub-user pool from GET /admin/proxy/pool
const initialConfig = {
  gatewayHost: "geox.torchproxies.com",
  gatewayPort: "6011",
  masterUser: "zerotrace_master",
  masterPass: "••••••••••••••••",
  residentialPoolSize: 500,
  ispPoolSize: 200,
  rotationIntervalResidential: 15,
  rotationIntervalIsp: 30,
};

// Mock sub-user pool
const subUserPool = [
  { subuser: "zt-sub-horizondmc",   tenant: "Horizon DMC",       zone: "EU West",   type: "Residential", ip: "46.112.88.24",  status: "active",   successRate: 98.4, requests: 342 },
  { subuser: "zt-sub-horizondmc-2", tenant: "Horizon DMC",       zone: "EU West",   type: "ISP",         ip: "109.250.4.12",  status: "active",   successRate: 99.1, requests: 187 },
  { subuser: "zt-sub-jetwing",      tenant: "Jetwing Travels",   zone: "EU + APAC", type: "Residential", ip: "81.210.22.55",  status: "active",   successRate: 97.8, requests: 621 },
  { subuser: "zt-sub-jetwing-2",    tenant: "Jetwing Travels",   zone: "EU + APAC", type: "ISP",         ip: "194.50.16.88",  status: "active",   successRate: 98.9, requests: 445 },
  { subuser: "zt-sub-walkers",      tenant: "Walkers Tours",     zone: "EU + APAC", type: "Residential", ip: "89.187.42.10",  status: "active",   successRate: 96.2, requests: 289 },
  { subuser: "zt-sub-cinnamon",     tenant: "Cinnamon Holidays", zone: "EU West",   type: "Residential", ip: "—",             status: "suspended",successRate: 0,    requests: 0 },
];

export default function ProxyManagementPage() {
  const [config, setConfig] = useState(initialConfig);
  const [showPass, setShowPass] = useState(false);
  const [saved, setSaved] = useState(false);

  // TODO(backend): PUT /admin/proxy/config — writes to proxy_config table; workers read on next job start
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminPageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Network size={20} className="text-red-400" /> Proxy Pool Management
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Master Torch Labs credentials, sub-user pool, and rotation policy — admin only
          </p>
        </div>
        {saved && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <CheckCircle size={13} /> Config Saved — Workers will pick up on next job
          </span>
        )}
      </div>

      {/* Master Credentials */}
      <form onSubmit={handleSave}>
        <div className="p-6 rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-red-400" />
              <h3 className="text-sm font-bold text-white">Master Torch Labs Gateway Credentials</h3>
            </div>
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
              Admin Only — Not Visible to DMC Subscribers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Gateway Host</label>
              {/* TODO(backend): this value comes from proxy_config table, row 1 */}
              <input type="text" value={config.gatewayHost} onChange={(e) => setConfig({...config, gatewayHost: e.target.value})}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Gateway Port</label>
              <input type="text" value={config.gatewayPort} onChange={(e) => setConfig({...config, gatewayPort: e.target.value})}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Master Account User</label>
              <input type="text" value={config.masterUser} onChange={(e) => setConfig({...config, masterUser: e.target.value})}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-w-sm">
            <label className="text-xs font-semibold text-gray-400">Master Auth Password</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={config.masterPass}
                onChange={(e) => setConfig({...config, masterPass: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none pr-20" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 hover:text-white font-bold transition-colors cursor-pointer">
                {showPass ? "HIDE" : "REVEAL"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Residential Pool Size", key: "residentialPoolSize" as const, unit: "IPs" },
              { label: "ISP Pool Size", key: "ispPoolSize" as const, unit: "IPs" },
              { label: "Residential Rotation Interval", key: "rotationIntervalResidential" as const, unit: "req" },
              { label: "ISP Rotation Interval", key: "rotationIntervalIsp" as const, unit: "req" },
            ].map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">{f.label}</label>
                <div className="relative">
                  <input type="number" value={config[f.key]} onChange={(e) => setConfig({...config, [f.key]: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none pr-10" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-xs font-bold text-white transition-colors cursor-pointer">
              <Save size={14} /> Save Proxy Config
            </button>
            <p className="text-[10px] text-gray-400">Workers read this config at the start of each new audit job.</p>
          </div>
        </div>
      </form>

      {/* Sub-user Pool */}
      <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio size={14} className="text-emerald-400 animate-pulse" /> Sub-user Session Pool
            </h3>
            <p className="text-xs text-gray-300 mt-0.5">
              One Residential + one ISP sub-user per tenant market zone
              {/* TODO(backend): Fetch live from GET /admin/proxy/pool with 30s polling */}
            </p>
          </div>
          <button onClick={() => alert("Pool refreshed.")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                {["Sub-user ID", "Tenant", "Zone", "Type", "Exit IP", "Status", "Success Rate", "Requests (24h)"].map(h => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
              {subUserPool.map((s) => (
                <tr key={s.subuser} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-sky-400 text-[10px]">{s.subuser}</td>
                  <td className="px-4 py-3 font-semibold text-white">{s.tenant}</td>
                  <td className="px-4 py-3 text-gray-300">{s.zone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.type === "Residential" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    }`}>{s.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-gray-400">{s.ip}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      s.status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-red-400 bg-red-500/10 border-red-500/20"
                    }`}>{s.status}</span>
                  </td>
                  <td className={`px-4 py-3 font-bold ${s.successRate >= 97 ? "text-emerald-400" : s.successRate > 0 ? "text-yellow-400" : "text-gray-400"}`}>
                    {s.successRate > 0 ? `${s.successRate}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400">{s.requests > 0 ? s.requests.toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-300 leading-relaxed">
          <strong className="text-white">Dual-proxy architecture:</strong> Residential proxies handle initial search queries to bypass Cloudflare/Akamai bot detection. ISP proxies maintain sticky sessions for multi-step room-detail and checkout scraping. This separation is defined in the scraper worker config and cannot be changed per-DMC subscriber.
        </p>
      </div>
    </AdminPageWrapper>
  );
}
