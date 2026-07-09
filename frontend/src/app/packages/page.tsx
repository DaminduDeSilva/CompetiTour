"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import {
  FolderHeart, Search, Filter, Plus, Eye, Play,
  ArrowRight, Clock, CheckCircle, AlertTriangle, TrendingDown, Trash2, Edit3
} from "lucide-react";
import { fetchDashboardPackages, runPackageAudit, deletePackage } from "@/app/dashboard/actions";
import AuditProgressModal from "@/components/ui/AuditProgressModal";

type Package = {
  id: number;
  name: string;
  duration_days: number;
  destination: string;
  total_price_lkr: number;
  status: string;
};

const statusConfig: Record<string, { label: string; color: string }> = {
  competitive: { label: "Competitive", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  at_risk:     { label: "At Risk",     color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  underpriced: { label: "Leakage",     color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  margin_leakage: { label: "Leakage",  color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  pending:     { label: "Pending Audit", color: "text-gray-400 bg-zinc-800 border-zinc-700" },
  active:      { label: "Pending Audit", color: "text-gray-400 bg-zinc-800 border-zinc-700" },
  partial:     { label: "Partial Audit", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [auditingId, setAuditingId] = useState<number | null>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activePackageName, setActivePackageName] = useState<string>("");
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const handleDelete = async (pkgId: number, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This will delete all its component matches and reports.`)) {
      try {
        const res = await deletePackage(pkgId);
        if (res.success) {
          setPackages((prev) => prev.filter((p) => p.id !== pkgId));
          alert("Package successfully deleted!");
        } else {
          alert("Error deleting package: " + res.error);
        }
      } catch (err: any) {
        alert("Failed to delete package: " + err.message);
      }
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetchDashboardPackages();
      if (res.packages) {
        setPackages(res.packages);
      }
    } catch (err) {
      console.error("Failed to fetch packages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const filtered = packages.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter || (filter === "pending" && p.status === "active");
    return matchSearch && matchFilter;
  });

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3">
            <FolderHeart size={28} className="text-sky-400" />
            My Packages
          </h2>
          <p className="text-sm text-sky-200/60 mt-1 font-medium tracking-wide">{packages.length} packages monitored across 3 source markets</p>
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
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
      <div className="flex flex-col gap-3 mt-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading packages...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No packages match your search.</div>
        ) : (
          filtered.map((pkg) => {
            const sc = statusConfig[pkg.status] || statusConfig.pending;
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
                    <p className="text-xs text-gray-300 mt-0.5">{pkg.duration_days} Days · {pkg.destination} · {pkg.total_price_lkr.toLocaleString()} LKR</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Clock size={10} /> Last audit: Not Run
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/packages/${pkg.id}/analyze`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                    >
                      <Play size={13} />
                      <span>Run Audit</span>
                    </Link>
                  {pkg.status !== "active" && pkg.status !== "pending" && (
                    <Link
                      href={`/reports/${pkg.id}/history`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-sky-500/30 hover:border-sky-400 bg-sky-500/10 hover:bg-sky-500/20 text-xs font-bold text-sky-400 hover:text-sky-300 transition-all"
                    >
                      <Eye size={13} />
                      <span>View Report</span>
                    </Link>
                  )}
                  <Link
                    href={`/packages/${pkg.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(pkg.id, pkg.name)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-950 hover:border-red-800 bg-red-950/20 hover:bg-red-500/20 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AuditProgressModal
        isOpen={isProgressModalOpen}
        jobId={activeJobId}
        packageName={activePackageName}
        onClose={() => {
          setIsProgressModalOpen(false);
          setActiveJobId(null);
        }}
        onComplete={async () => {
          // Trigger refresh of packages data
          await fetchPackages();
        }}
      />
    </PageWrapper>
  );
}
