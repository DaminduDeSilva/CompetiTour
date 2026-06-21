"use client";
import React, { useState, useEffect } from "react";
import AdminPageWrapper from "@/components/layout/AdminPageWrapper";
import { Cpu, RefreshCw, XCircle, CheckCircle, Clock, Radio } from "lucide-react";

// TODO(backend): Fetch from GET /admin/workers + GET /admin/jobs with polling (ws or 5s interval)
const initialWorkers = [
  { id: "w-001", hostname: "scraper-worker-01", status: "busy", job: "Adventure & Wildlife Safari (DE)", tenant: "Horizon DMC", cpu: 72, mem: 58, uptime: "4h 22m" },
  { id: "w-002", hostname: "scraper-worker-02", status: "busy", job: "Jetwing Surf Experience (DE)", tenant: "Jetwing Travels", cpu: 64, mem: 51, uptime: "4h 22m" },
  { id: "w-003", hostname: "scraper-worker-03", status: "idle", job: "—", tenant: "—", cpu: 3, mem: 22, uptime: "4h 22m" },
  { id: "w-004", hostname: "scraper-worker-04", status: "busy", job: "Japan & Sri Lanka Twin (JP)", tenant: "Walkers Tours", cpu: 81, mem: 63, uptime: "4h 22m" },
  { id: "w-005", hostname: "scraper-worker-05", status: "idle", job: "—", tenant: "—", cpu: 2, mem: 21, uptime: "2h 11m" },
  { id: "w-006", hostname: "scraper-worker-06", status: "error", job: "Cultural Triangle & Beach (GB)", tenant: "Horizon DMC", cpu: 0, mem: 45, uptime: "0m (crashed)" },
];

const jobQueue = [
  { runId: "audit-0041", pkg: "Hill Country & Tea Trails", tenant: "Horizon DMC", market: "🇬🇧 UK", status: "queued", queued: "30s ago" },
  { runId: "audit-0042", pkg: "Cultural Heritage Tour", tenant: "Jetwing Travels", market: "🇫🇷 France", status: "queued", queued: "1m ago" },
  { runId: "audit-0040", pkg: "Cultural Triangle & Beach", tenant: "Horizon DMC", market: "🇬🇧 UK", status: "running", queued: "3m ago" },
];

const workerStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  busy:  { label: "Busy",  color: "text-amber-400 bg-amber-500/10 border-amber-500/20",   dot: "bg-amber-400" },
  idle:  { label: "Idle",  color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  error: { label: "Error", color: "text-red-400 bg-red-500/10 border-red-500/20",          dot: "bg-red-400 animate-pulse" },
};

export default function WorkersPage() {
  const [workers, setWorkers] = useState(initialWorkers);
  const [refreshed, setRefreshed] = useState(false);

  const refresh = () => {
    // TODO(backend): re-fetch GET /admin/workers and GET /admin/jobs
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 1500);
  };

  // Simulate live CPU jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkers((prev) =>
        prev.map((w) => ({
          ...w,
          cpu: w.status === "busy" ? Math.min(95, Math.max(40, w.cpu + Math.round((Math.random() - 0.5) * 8))) : w.cpu,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AdminPageWrapper>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu size={20} className="text-red-400" /> Scraper Workers
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {workers.filter(w => w.status === "busy").length} busy · {workers.filter(w => w.status === "idle").length} idle · {workers.filter(w => w.status === "error").length} error
          </p>
        </div>
        <button onClick={refresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">
          <RefreshCw size={12} className={refreshed ? "animate-spin" : ""} />
          {refreshed ? "Refreshed" : "Refresh"}
        </button>
      </div>

      {/* Worker Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workers.map((w) => {
          const sc = workerStatusConfig[w.status];
          return (
            <div key={w.id} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{w.hostname}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{w.id}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                  {sc.label}
                </span>
              </div>

              {w.status !== "idle" && (
                <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  <p className="text-[10px] text-gray-500">Current job</p>
                  <p className="text-xs font-semibold text-white mt-0.5 truncate">{w.job}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{w.tenant}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {[
                  { label: "CPU", value: w.cpu, color: w.cpu > 80 ? "bg-red-500" : w.cpu > 50 ? "bg-amber-500" : "bg-emerald-500" },
                  { label: "MEM", value: w.mem, color: "bg-sky-500" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 w-8">{b.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-900">
                      <div className={`h-1.5 rounded-full transition-all duration-700 ${b.color}`} style={{ width: `${b.value}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400 w-8 text-right">{b.value}%</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-600 pt-1 border-t border-zinc-900">
                <span>Uptime: {w.uptime}</span>
                {w.status === "error" && (
                  <button onClick={() => alert(`Restarting ${w.hostname}...`)}
                    className="text-red-400 hover:text-red-300 font-bold transition-colors cursor-pointer">
                    Restart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Job Queue */}
      <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Radio size={14} className="text-sky-400 animate-pulse" /> Job Queue
          {/* TODO(backend): Fetch from GET /admin/jobs?status=queued,running */}
        </h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-900 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              {["Run ID", "Package", "Tenant", "Market", "Status", "Queued", ""].map(h => (
                <th key={h} className="pb-3 px-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
            {jobQueue.map((j) => (
              <tr key={j.runId} className="hover:bg-zinc-900/20 transition-colors">
                <td className="py-3 px-2 font-mono text-sky-400 text-[10px]">{j.runId}</td>
                <td className="py-3 px-2 font-semibold text-white">{j.pkg}</td>
                <td className="py-3 px-2 text-gray-500">{j.tenant}</td>
                <td className="py-3 px-2">{j.market}</td>
                <td className="py-3 px-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    j.status === "running" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-gray-400 bg-zinc-900 border-zinc-800"
                  }`}>{j.status}</span>
                </td>
                <td className="py-3 px-2 text-gray-600">{j.queued}</td>
                <td className="py-3 px-2">
                  {/* TODO(backend): DELETE /admin/jobs/{runId} to cancel */}
                  <button onClick={() => alert(`Cancelled job ${j.runId}`)}
                    className="text-[10px] font-bold text-gray-600 hover:text-red-400 transition-colors cursor-pointer">
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminPageWrapper>
  );
}
