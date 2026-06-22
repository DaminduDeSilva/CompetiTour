"use client";
import React, { useState } from "react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import {
  FolderHeart, Search, Filter, Plus, Eye, Play,
  ArrowRight, Clock, CheckCircle, AlertTriangle, TrendingDown
} from "lucide-react";

// TODO(backend): Fetch from GET /packages?tenant_id=<from JWT>
const allPackages = [
  {
    id: 1,
    name: "Classic Sri Lanka Tour",
    duration: "10 Days",
    destination: "Sri Lanka",
    priceLkr: 1250000,
    priceUsd: 4100,
    status: "competitive",
    lastAudit: "June 20, 2026",
    markets: ["DE", "GB", "AU"],
  },
  {
    id: 2,
    name: "Cultural Triangle & Beach",
    duration: "7 Days",
    destination: "Sri Lanka",
    priceLkr: 980000,
    priceUsd: 3200,
    status: "at_risk",
    lastAudit: "June 18, 2026",
    markets: ["DE", "GB"],
  },
  {
    id: 3,
    name: "Adventure & Wildlife Safari",
    duration: "12 Days",
    destination: "Sri Lanka",
    priceLkr: 1850000,
    priceUsd: 6050,
    status: "underpriced",
    lastAudit: "June 21, 2026",
    markets: ["DE", "GB", "AU"],
  },
  {
    id: 4,
    name: "Luxury Boutique Getaway",
    duration: "5 Days",
    destination: "Sri Lanka",
    priceLkr: 1500000,
    priceUsd: 4900,
    status: "competitive",
    lastAudit: "June 17, 2026",
    markets: ["DE", "FR"],
  },
  {
    id: 5,
    name: "Hill Country & Tea Trails",
    duration: "8 Days",
    destination: "Sri Lanka",
    priceLkr: 1100000,
    priceUsd: 3580,
    status: "pending",
    lastAudit: "—",
    markets: ["GB", "AU"],
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  competitive: { label: "Competitive", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  at_risk:     { label: "At Risk",     color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  underpriced: { label: "Leakage",     color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  pending:     { label: "Pending Audit", color: "text-gray-400 bg-zinc-800 border-zinc-700" },
};

export default function PackagesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = allPackages.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderHeart size={20} className="text-sky-400" />
            My Packages
          </h2>
          <p className="text-xs text-gray-300 mt-1">{allPackages.length} packages monitored across {3} source markets</p>
        </div>
        <Link
          href="/packages/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-black transition-colors"
        >
          <Plus size={14} />
          <span>Add Package</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-gray-600 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-300" />
          {["all", "competitive", "at_risk", "underpriced", "pending"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                filter === f
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-400"
                  : "border-zinc-800 text-gray-300 hover:text-white hover:border-zinc-700"
              }`}
            >
              {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Package List */}
      <div className="flex flex-col gap-3">
        {filtered.map((pkg) => {
          const sc = statusConfig[pkg.status];
          return (
            <div
              key={pkg.id}
              className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-800 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <FolderHeart size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">{pkg.name}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">{pkg.duration} · {pkg.destination} · ${pkg.priceUsd.toLocaleString()} USD</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock size={10} /> Last audit: {pkg.lastAudit}
                    </span>
                    <div className="flex gap-1">
                      {pkg.markets.map((m) => (
                        <span key={m} className="text-[10px] font-bold text-gray-300 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/packages/${pkg.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                >
                  <Eye size={13} />
                  <span>View</span>
                </Link>
                <Link
                  href={`/packages/${pkg.id}/analyze`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition-colors"
                >
                  <Play size={13} />
                  <span>Run Audit</span>
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400 text-sm">No packages match your search.</div>
        )}
      </div>
    </PageWrapper>
  );
}
