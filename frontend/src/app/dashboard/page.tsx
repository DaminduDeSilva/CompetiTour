"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import PageWrapper from "@/components/layout/PageWrapper";
import { 
  FolderHeart, 
  Percent, 
  TrendingDown, 
  Radio, 
  Eye, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Trash2,
  Edit3
} from "lucide-react";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { fetchDashboardPackages, runPackageAudit, deletePackage } from "./actions";
import AuditProgressModal from "@/components/ui/AuditProgressModal";

type CompetitivenessReport = {
  id: number;
  package_id: number;
  source_market_id: number;
  dmc_price_usd: number;
  market_assembled_price_usd: number;
  price_delta_pct: number;
  status: string;
  generated_at: string;
};

type Component = {
  id: number;
  matches?: { id: number }[];
};

type Package = {
  id: number;
  name: string;
  destination: string;
  duration_days: number;
  total_price_lkr: number;
  status: string;
  reports?: CompetitivenessReport[];
  components?: Component[];
};

export default function DashboardPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditingId, setAuditingId] = useState<number | null>(null);
  
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activePackageName, setActivePackageName] = useState<string>("");
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  const router = useRouter();

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

  // Check approval status
  useEffect(() => {
    const checkStatus = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/users/by-email/${data.user.email}`);
          if (res.ok) {
            const user = await res.json();
            if (!user.is_active && !user.is_superuser) {
              router.push("/pending");
            }
          }
        } catch (err) {
          console.error("Failed to check status", err);
        }
      }
    };
    checkStatus();
  }, [router]);

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

  const getLatestReportForMarket = (reports: CompetitivenessReport[] | undefined, marketId: number) => {
    if (!reports || reports.length === 0) return null;
    const marketReports = reports.filter(r => r.source_market_id === marketId);
    if (marketReports.length === 0) return null;
    return marketReports.sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0];
  };

  const getLatestReport = (reports: CompetitivenessReport[] | undefined) => {
    if (!reports || reports.length === 0) return null;
    return [...reports].sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())[0];
  };

  const latestReports = packages.map(pkg => getLatestReport(pkg.reports)).filter(Boolean) as CompetitivenessReport[];
  const totalAudited = latestReports.length;
  const competitiveCount = latestReports.filter(r => r.status === 'competitive').length;
  const atRiskCount = latestReports.filter(r => r.status === 'at_risk').length;
  const leakageCount = latestReports.filter(r => r.status === 'underpriced' || r.status === 'margin_leakage').length;
  const competitiveRatio = totalAudited > 0 ? Math.round((competitiveCount / totalAudited) * 1000) / 10 : 0;

  const totalScrapes = packages.reduce((acc, pkg) => {
    return acc + (pkg.components?.reduce((sum, comp) => sum + (comp.matches?.length || 0), 0) || 0);
  }, 0);

  const getStatusBadge = (status: string, delta: number | null) => {
    if (status === "partial") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
          Partial Audit
        </span>
      );
    }
    if (delta === null) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 border border-zinc-700 text-gray-400">
          Pending
        </span>
      );
    }
    
    const formattedDelta = delta > 0 ? `+${delta}%` : `${delta}%`;
    switch (status) {
      case "competitive":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Competitive ({formattedDelta})
          </span>
        );
      case "at_risk":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-medium">
            At Risk ({formattedDelta})
          </span>
        );
      case "underpriced":
      case "margin_leakage":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
            Leakage ({formattedDelta})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-800 border border-zinc-700 text-gray-400">
            Pending
          </span>
        );
    }
  };

  return (
    <PageWrapper>
      {/* Top Banner Message */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-2xl border border-sky-500/20 bg-sky-500/5 backdrop-blur-md">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3">
            <Sparkles size={28} className="text-sky-400" />
            AI Pricing Audit Insights
          </h2>
          <p className="text-sm text-sky-200/60 mt-2 font-medium tracking-wide">
            We detected <strong className="text-sky-400">{atRiskCount} packages</strong> at risk of losing bookings, and <strong className="text-emerald-400">{leakageCount} packages</strong> experiencing severe margin leakage.
          </p>
        </div>
        <Link 
          href="/packages/new" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-black transition-colors"
        >
          <span>Monitor New Package</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0e]/40 backdrop-blur-md hover:bg-[#0a0a0e]/60 hover:border-white/10 transition-all flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Competitive Ratio</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Percent size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{competitiveRatio}%</div>
            <div className="text-xs text-gray-300 mt-1">{competitiveCount} of {totalAudited} packages optimized</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0e]/40 backdrop-blur-md hover:bg-[#0a0a0e]/60 hover:border-white/10 transition-all flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">At Risk Packages</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-yellow-400">{atRiskCount}</div>
            <div className="text-xs text-gray-300 mt-1">Higher priced than OTA assembly</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0e]/40 backdrop-blur-md hover:bg-[#0a0a0e]/60 hover:border-white/10 transition-all flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Margin Leakages</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-400">{leakageCount}</div>
            <div className="text-xs text-gray-300 mt-1">Underpriced by &gt; 20% vs market</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0e]/40 backdrop-blur-md hover:bg-[#0a0a0e]/60 hover:border-white/10 transition-all flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Proxy Scrapes (24h)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">{totalScrapes}</div>
            <div className="text-xs text-gray-300 mt-1">Ready for Torch Labs API</div>
          </div>
        </div>
      </div>

      {/* Main Section Grid: Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-[#0a0a0e]/40 backdrop-blur-md flex flex-col gap-6 relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Market Comparison Trend</h3>
              <p className="text-xs text-gray-300 mt-0.5">Global Market Baseline (USD)</p>
            </div>
            <span className="text-[10px] font-bold tracking-wider px-2 py-1 rounded bg-zinc-900 text-gray-400 border border-zinc-800 uppercase">
              Last 30 Days
            </span>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full h-64 relative flex items-end">
            <svg className="w-full h-full" viewBox="0 0 600 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1"/>
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="600" y2="40" stroke="#18181b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="#18181b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="600" y2="160" stroke="#18181b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="220" x2="600" y2="220" stroke="#18181b" strokeWidth="1" />

              {/* Market Average Line (Orange) */}
              <path 
                d="M 10 120 Q 150 140 300 90 T 590 70 L 590 220 L 10 220 Z" 
                fill="url(#marketGradient)" 
              />
              <path 
                d="M 10 120 Q 150 140 300 90 T 590 70" 
                stroke="#f59e0b" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* DMC Price Line (Sky Blue) */}
              <path 
                d="M 10 160 Q 150 170 300 130 T 590 120 L 590 220 L 10 220 Z" 
                fill="url(#chartGradient)" 
              />
              <path 
                d="M 10 160 Q 150 170 300 130 T 590 120" 
                stroke="#0ea5e9" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />

              {/* Points */}
              <circle cx="300" cy="130" r="5" fill="#0ea5e9" stroke="#000000" strokeWidth="2" />
              <circle cx="300" cy="90" r="5" fill="#f59e0b" stroke="#000000" strokeWidth="2" />
            </svg>

            {/* Legend overlays */}
            <div className="absolute top-2 right-4 flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-sky-500" />
                <span className="text-gray-300">Your DMC Rate Avg</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span className="text-gray-300">OTA Assembly Avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Source list */}
        <div className="p-6 rounded-2xl border border-white/5 bg-[#0a0a0e]/40 backdrop-blur-md flex flex-col justify-between group hover:border-white/10 transition-all">
          <div>
            <h3 className="text-sm font-bold text-white">Monitoring Locations</h3>
            <p className="text-xs text-gray-300 mt-0.5">Proxy exit nodes configured</p>
          </div>

          <div className="flex flex-col gap-4 my-6">
            {/* Market 1 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <span className="text-xl">🇩🇪</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Germany</span>
                  <span className="text-[10px] text-gray-300 font-semibold uppercase">locale: de-DE</span>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Active</span>
            </div>

            {/* Market 2 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <span className="text-xl">🇬🇧</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">United Kingdom</span>
                  <span className="text-[10px] text-gray-300 font-semibold uppercase">locale: en-GB</span>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Active</span>
            </div>

            {/* Market 3 */}
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-900 bg-zinc-900/20">
              <div className="flex items-center gap-3">
                <span className="text-xl">🇦🇺</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Australia</span>
                  <span className="text-[10px] text-gray-300 font-semibold uppercase">locale: en-AU</span>
                </div>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Active</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            ISP Residential Gateways via Torch Labs
          </div>
        </div>
      </div>

      {/* Packages Table Container */}
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a]/90 to-[#0a0a0e]/90 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col gap-6 overflow-hidden">
        <div>
          <h3 className="text-sm font-bold text-white">Monitored Packages</h3>
          <p className="text-xs text-gray-300 mt-0.5">Package competitiveness across key source markets</p>
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-gray-400 text-xs font-bold uppercase tracking-wider">
                <th className="pb-4">Package</th>
                <th className="pb-4">Base Rate (LKR)</th>
                <th className="pb-4">Germany (DE)</th>
                <th className="pb-4">United Kingdom (UK)</th>
                <th className="pb-4">Australia (AU)</th>
                <th className="pb-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">Loading dynamic packages...</td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">No packages found. Add one to start monitoring!</td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-zinc-900/20 transition-all">
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white">{pkg.name}</span>
                        <span className="text-xs text-gray-300 mt-0.5">{pkg.duration_days} Days · {pkg.destination}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300 font-semibold">
                      LKR {pkg.total_price_lkr.toLocaleString()}
                    </td>
                    <td className="py-4">
                      {(() => {
                        const deReport = getLatestReportForMarket(pkg.reports, 1);
                        return deReport ? getStatusBadge(deReport.status, deReport.price_delta_pct) : getStatusBadge("pending", null);
                      })()}
                    </td>
                    <td className="py-4">
                      {(() => {
                        const ukReport = getLatestReportForMarket(pkg.reports, 2);
                        return ukReport ? getStatusBadge(ukReport.status, ukReport.price_delta_pct) : getStatusBadge("pending", null);
                      })()}
                    </td>
                    <td className="py-4">
                      {(() => {
                        const auReport = getLatestReportForMarket(pkg.reports, 3);
                        return auReport ? getStatusBadge(auReport.status, auReport.price_delta_pct) : getStatusBadge("pending", null);
                      })()}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {auditingId === pkg.id ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 rounded-lg select-none animate-pulse">
                            <Radio size={12} className="animate-spin" />
                            <span>Auditing...</span>
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              setAuditingId(pkg.id);
                              try {
                                const res = await runPackageAudit(pkg.id);
                                if (res.success && res.data?.id) {
                                  setActiveJobId(res.data.id);
                                  setActivePackageName(pkg.name);
                                  setIsProgressModalOpen(true);
                                } else {
                                  alert("Error triggering audit: " + (res.error || "No job ID returned"));
                                }
                              } catch (err: any) {
                                alert("Failed to run audit: " + err.message);
                              } finally {
                                setAuditingId(null);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-gray-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Radio size={12} />
                            <span>Run Audit</span>
                          </button>
                        )}
                        <Link 
                          href={`/reports/${pkg.id}/history`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={12} />
                          <span>History</span>
                        </Link>
                        <Link
                          href={`/packages/${pkg.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(pkg.id, pkg.name)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-300 border border-red-950 hover:border-red-800 bg-red-950/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
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
