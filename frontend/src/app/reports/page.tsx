"use client";
import React, { useState } from "react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import { BarChart3, Filter, Eye, Download, Search, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

// TODO(backend): Fetch from GET /reports?tenant_id=<jwt> with pagination + filters
const allReports = [
  { runId: "r-001", packageId: 3, packageName: "Adventure & Wildlife Safari - 12 Days", market: "Germany", marketFlag: "🇩🇪", dmc: "€5,660", marketPrice: "€7,120", variance: "-20.5%", status: "leakage", date: "June 21, 2026 09:31", confidence: 98.4 },
  { runId: "r-002", packageId: 2, packageName: "Cultural Triangle & Beach - 7 Days", market: "Germany", marketFlag: "🇩🇪", dmc: "€3,200", marketPrice: "€3,302", variance: "+3.2%", status: "at_risk", date: "June 20, 2026 14:12", confidence: 91.2 },
  { runId: "r-003", packageId: 1, packageName: "Classic Sri Lanka Tour - 10 Days", market: "United Kingdom", marketFlag: "🇬🇧", dmc: "€3,800", marketPrice: "€3,686", variance: "+3.0%", status: "at_risk", date: "June 20, 2026 11:45", confidence: 94.7 },
  { runId: "r-004", packageId: 3, packageName: "Adventure & Wildlife Safari - 12 Days", market: "United Kingdom", marketFlag: "🇬🇧", dmc: "€5,660", marketPrice: "€7,290", variance: "-22.4%", status: "leakage", date: "June 19, 2026 16:30", confidence: 96.1 },
  { runId: "r-005", packageId: 4, packageName: "Luxury Boutique Getaway - 5 Days", market: "Germany", marketFlag: "🇩🇪", dmc: "€4,500", marketPrice: "€4,959", variance: "-9.2%", status: "competitive", date: "June 18, 2026 10:00", confidence: 97.8 },
  { runId: "r-006", packageId: 1, packageName: "Classic Sri Lanka Tour - 10 Days", market: "Germany", marketFlag: "🇩🇪", dmc: "€3,800", marketPrice: "€4,092", variance: "-7.2%", status: "competitive", date: "June 17, 2026 09:00", confidence: 95.3 },
  { runId: "r-007", packageId: 3, packageName: "Adventure & Wildlife Safari - 12 Days", market: "Australia", marketFlag: "🇦🇺", dmc: "€5,660", marketPrice: "€7,670", variance: "-26.2%", status: "leakage", date: "June 16, 2026 13:22", confidence: 93.6 },
];

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  competitive: { label: "Competitive", icon: <CheckCircle size={12} />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  at_risk:     { label: "At Risk",     icon: <AlertTriangle size={12} />, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  leakage:     { label: "Leakage",     icon: <TrendingDown size={12} />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = allReports.filter((r) => {
    const matchSearch = r.packageName.toLowerCase().includes(search.toLowerCase()) || r.market.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-sky-400" />
            Audit Reports
          </h2>
          <p className="text-xs text-gray-500 mt-1">{allReports.length} completed audit runs across all packages</p>
        </div>
        <button
          onClick={() => alert("Exporting all reports as CSV...")}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Runs", value: allReports.length, color: "text-white" },
          { label: "Leakage Alerts", value: allReports.filter(r => r.status === "leakage").length, color: "text-blue-400" },
          { label: "At Risk", value: allReports.filter(r => r.status === "at_risk").length, color: "text-yellow-400" },
        ].map((c) => (
          <div key={c.label} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{c.label}</p>
            <p className={`text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by package or market..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-gray-600 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-500" />
          {["all", "leakage", "at_risk", "competitive"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${filter === f ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "border-zinc-800 text-gray-500 hover:text-white"}`}>
              {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-900 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
              {["Date / Time", "Package", "Market", "DMC Rate", "Market Price", "Variance", "Confidence", ""].map((h) => (
                <th key={h} className="px-5 py-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
            {filtered.map((r) => {
              const sc = statusConfig[r.status];
              return (
                <tr key={r.runId} className="hover:bg-zinc-900/20 transition-colors">
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">{r.date}</td>
                  <td className="px-5 py-4 font-medium text-white max-w-[200px] truncate">{r.packageName}</td>
                  <td className="px-5 py-4 whitespace-nowrap">{r.marketFlag} {r.market}</td>
                  <td className="px-5 py-4 font-semibold text-white">{r.dmc}</td>
                  <td className="px-5 py-4 font-semibold">{r.marketPrice}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${sc.color}`}>
                      {sc.icon} {r.variance}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-emerald-400 font-bold">{r.confidence}%</td>
                  <td className="px-5 py-4">
                    <Link href={`/reports/${r.packageId}/history`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-colors text-[10px] font-bold">
                      <Eye size={11} /> View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-600">No reports match your filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
