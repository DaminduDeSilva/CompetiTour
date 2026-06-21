"use client";
import React, { useState } from "react";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Globe, CheckCircle, AlertTriangle, RefreshCw, Save } from "lucide-react";

// TODO(backend): Fetch from GET /admin/ota/platforms
const initialPlatforms = [
  { id: "booking",  name: "Booking.com",  module: "booking_scraper.py",  version: "v2.4.1", status: "operational", lastParsed: "June 21, 2026", botRisk: "High",   enabled: true,  notes: "Cloudflare Enterprise. Use residential proxy only." },
  { id: "agoda",    name: "Agoda",        module: "agoda_scraper.py",    version: "v1.9.3", status: "operational", lastParsed: "June 20, 2026", botRisk: "Medium", enabled: true,  notes: "Akamai bot manager. Stealth mode required." },
  { id: "expedia",  name: "Expedia",      module: "expedia_scraper.py",  version: "v1.7.0", status: "degraded",    lastParsed: "June 19, 2026", botRisk: "High",   enabled: true,  notes: "Schema changed June 19 — parser update in progress." },
  { id: "viator",   name: "Viator",       module: "viator_scraper.py",   version: "v1.2.5", status: "operational", lastParsed: "June 21, 2026", botRisk: "Low",    enabled: true,  notes: "No bot manager. ISP proxy sufficient." },
];

const botRiskColor: Record<string, string> = {
  High:   "text-red-400 bg-red-500/10 border-red-500/20",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Low:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  operational: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle size={11} /> },
  degraded:    { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",    icon: <AlertTriangle size={11} /> },
};

export default function OtaConfigPage() {
  const [platforms, setPlatforms] = useState(initialPlatforms);
  const [saved, setSaved] = useState(false);

  const toggleEnabled = (id: string) => {
    // TODO(backend): PATCH /admin/ota/platforms/{id} { enabled: !current }
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const handleSave = () => {
    // TODO(backend): PUT /admin/ota/platforms — batch update parser versions + enabled flags
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminPageWrapper>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe size={20} className="text-red-400" /> OTA Platform Registry
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage scraper modules, parser versions, and anti-bot flags per platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          <button onClick={handleSave}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-xs font-bold text-white transition-colors cursor-pointer">
            <Save size={14} /> Save Platform Config
          </button>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="flex flex-col gap-4">
        {platforms.map((p) => {
          const sc = statusConfig[p.status];
          return (
            <div key={p.id}
              className={`p-6 rounded-2xl border backdrop-blur-md flex flex-col md:flex-row md:items-start justify-between gap-6 transition-all ${
                p.enabled ? "border-zinc-900 bg-zinc-950/40" : "border-zinc-900/50 bg-zinc-950/20 opacity-60"
              }`}>
              <div className="flex items-start gap-4 flex-1">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${sc.color}`}>
                      {sc.icon} {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${botRiskColor[p.botRisk]}`}>
                      Bot Risk: {p.botRisk}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">{p.notes}</p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-600">
                    <span>Module: <code className="text-sky-400">{p.module}</code></span>
                    <span>Last parsed: {p.lastParsed}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {/* Parser version */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">Parser Version</label>
                  {/* TODO(backend): PATCH /admin/ota/platforms/{id} { version } — triggers worker hot-reload */}
                  <input type="text" defaultValue={p.version}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-white focus:border-red-500 focus:outline-none w-24 text-center" />
                </div>

                {/* Enable/Disable toggle */}
                <div className="flex flex-col gap-1 items-center">
                  <label className="text-[10px] text-gray-500 font-semibold uppercase">Enabled</label>
                  <button
                    onClick={() => toggleEnabled(p.id)}
                    className={`w-10 h-6 rounded-full transition-all cursor-pointer relative ${p.enabled ? "bg-emerald-500" : "bg-zinc-700"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${p.enabled ? "left-5" : "left-1"}`} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 flex items-start gap-3">
        <AlertTriangle size={16} className="text-sky-400 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-white">Parser hot-swap:</strong> Updating a parser version number here triggers a config reload on the next job picked up by a worker. No full redeployment required.
          {/* TODO(backend): Wire version field changes to PUT /admin/ota/platforms/{id} + trigger worker config reload */}
        </p>
      </div>
    </AdminPageWrapper>
  );
}
