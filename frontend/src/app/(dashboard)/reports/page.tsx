"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BarChart3, Filter, Eye, Download, Search, 
  TrendingDown, AlertTriangle, CheckCircle, 
  Hotel, Compass, Navigation, Package, ChevronRight, LayoutList
} from "lucide-react";
import { fetchDashboardPackages } from "@/app/(dashboard)/dashboard/actions";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; badge: string }> = {
  competitive: { label: "Competitive", icon: <CheckCircle size={14} />, color: "text-emerald-400", badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  at_risk:     { label: "At Risk",     icon: <AlertTriangle size={14} />, color: "text-yellow-400", badge: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" },
  leakage:     { label: "Leakage",     icon: <TrendingDown size={14} />, color: "text-blue-400", badge: "bg-blue-500/10 border-blue-500/20 text-blue-400" },
};

const marketNames: Record<number, { name: string; flag: string }> = {
  1: { name: "Germany", flag: "🇩🇪" },
  2: { name: "United Kingdom", flag: "🇬🇧" },
  3: { name: "Australia", flag: "🇦🇺" },
  4: { name: "France", flag: "🇫🇷" },
  5: { name: "United States", flag: "🇺🇸" },
  6: { name: "Japan", flag: "🇯🇵" }
};

export default function ReportsPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { packages: fetchedPackages } = await fetchDashboardPackages();
        if (fetchedPackages) {
          // Sort packages by latest report date or ID
          const sortedPkgs = fetchedPackages.sort((a: any, b: any) => b.id - a.id);
          setPackages(sortedPkgs);
        }
      } catch (err) {
        console.error("Failed to load packages:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Grouping Logic: Group explicitly by job_id (or fallback for older records)
  const groupReportsIntoRuns = (reports: any[]) => {
    if (!reports || reports.length === 0) return [];
    // Sort oldest first to build sequential Run Numbers
    const sorted = [...reports].sort((a, b) => new Date(a.generated_at).getTime() - new Date(b.generated_at).getTime());
    
    const runMap = new Map();
    let fallbackCounter = 1;
    
    sorted.forEach(rep => {
      // Use job_id if available, else group by 15-minute time window chunks for historical data
      const key = rep.job_id || `legacy-${Math.floor(new Date(rep.generated_at).getTime() / 900000)}`;
      
      if (!runMap.has(key)) {
        runMap.set(key, {
          key: key,
          reports: [],
          timestamp: new Date(rep.generated_at),
          hasLeakage: false,
          hasAtRisk: false
        });
      }
      
      const run = runMap.get(key);
      run.reports.push(rep);
      if (rep.status === "underpriced" || rep.status === "margin_leakage") run.hasLeakage = true;
      if (rep.status === "at_risk") run.hasAtRisk = true;
    });
    
    const runsArray = Array.from(runMap.values());
    runsArray.forEach((r, idx) => { r.displayId = idx + 1; });
    
    // Return newest first
    return runsArray.reverse();
  };

  const filteredPackages = packages.map(pkg => {
    // First, filter reports
    const filteredReports = (pkg.reports || []).filter((rep: any) => {
      const marketInfo = marketNames[rep.source_market_id] || { name: "Germany", flag: "🇩🇪" };
      const statusKey = (rep.status === "underpriced" || rep.status === "margin_leakage") ? "leakage" : 
                        (rep.status === "at_risk" ? "at_risk" : "competitive");
      
      const matchSearch = pkg.name.toLowerCase().includes(search.toLowerCase()) || 
                          marketInfo.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || statusKey === filter;
      
      return matchSearch && matchFilter;
    });

    // Group them into Runs
    const groupedRuns = groupReportsIntoRuns(filteredReports);
    
    return { ...pkg, groupedRuns };
  }).filter(pkg => pkg.groupedRuns.length > 0 || (pkg.name.toLowerCase().includes(search.toLowerCase()) && filter === "all"));

  const totalReports = packages.reduce((acc, pkg) => acc + (pkg.reports?.length || 0), 0);
  const totalLeakage = packages.reduce((acc, pkg) => acc + (pkg.reports || []).filter((r: any) => r.status === 'underpriced' || r.status === 'margin_leakage').length, 0);
  const totalAtRisk = packages.reduce((acc, pkg) => acc + (pkg.reports || []).filter((r: any) => r.status === 'at_risk').length, 0);

  const handleExportCsv = () => {
    const rows: string[][] = [];
    rows.push(["Package Name", "Audit Run", "Date", "Market", "DMC Rate", "Market Price", "Variance", "Status"]);
    
    filteredPackages.forEach(pkg => {
      pkg.groupedRuns.forEach((run: any) => {
        run.reports.forEach((rep: any) => {
          const marketInfo = marketNames[rep.source_market_id] || { name: "Germany" };
          rows.push([
            `"${pkg.name}"`,
            `"Run #${run.displayId}"`,
            `"${new Date(rep.generated_at).toLocaleString()}"`,
            `"${marketInfo.name}"`,
            `"$${Math.round(rep.dmc_price_usd)}"`,
            `"$${Math.round(rep.market_assembled_price_usd)}"`,
            `"${rep.price_delta_pct > 0 ? '+' : ''}${rep.price_delta_pct}%"`,
            `"${rep.status}"`
          ]);
        });
      });
    });

    if (rows.length === 1) return;
    
    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_reports_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3">
            <LayoutList size={28} className="text-sky-400" />
            Audit Reports
          </h2>
          <p className="text-sm text-sky-200/60 mt-1 font-medium tracking-wide">Hierarchical view of competitive intelligence audits</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={filteredPackages.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50 bg-zinc-900/50"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Audit Runs", value: totalReports, color: "text-white", border: "border-zinc-800" },
          { label: "Margin Leakage Alerts", value: totalLeakage, color: "text-blue-400", border: "border-blue-500/20" },
          { label: "At Risk Configurations", value: totalAtRisk, color: "text-yellow-400", border: "border-yellow-500/20" },
        ].map((c) => (
          <div key={c.label} className={`p-6 rounded-2xl border ${c.border} bg-zinc-950/60 backdrop-blur-md relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-colors`} />
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">{c.label}</p>
            <p className={`text-4xl font-black mt-2 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by package name or market..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/50 text-sm text-white placeholder-gray-500 focus:border-sky-500 focus:bg-zinc-900 transition-all outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800">
          <Filter size={14} className="text-gray-400 ml-2" />
          <div className="flex ml-2">
            {["all", "leakage", "at_risk", "competitive"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  filter === f ? "bg-sky-500/20 text-sky-400" : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}>
                {f === "all" ? "All" : f === "at_risk" ? "At Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grouped Reports List */}
      <div className="flex flex-col gap-10 mt-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
            <p className="text-sm text-sky-200 font-medium tracking-wide">Loading audit hierarchy...</p>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="py-20 text-center text-gray-500 font-medium bg-zinc-900/20 rounded-2xl border border-zinc-800 border-dashed">
            No packages or audits found matching your criteria.
          </div>
        ) : (
          filteredPackages.map(pkg => (
            <div key={pkg.id} className="flex flex-col gap-4">
              
              {/* Level 1: Package Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{pkg.name}</h3>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                      {pkg.duration_days} Days • {pkg.destination}
                    </p>
                  </div>
                </div>
              </div>

              {/* Level 2: Audits inside the package */}
              <div className="flex flex-col gap-6">
                {pkg.groupedRuns.length === 0 ? (
                  <div className="px-6 py-4 text-xs text-gray-500 italic border border-white/5 bg-white/[0.02] rounded-xl">
                    No audits match the current filter.
                  </div>
                ) : (
                  pkg.groupedRuns.map((run: any) => {
                    return (
                      <div key={run.key} className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/80 overflow-hidden hover:border-zinc-700 transition-colors">
                        
                        {/* Audit Header Row */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                          <div className="flex flex-col gap-1 text-left">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-500">Audit Run #{run.displayId}</span>
                            <span className="text-sm font-medium text-gray-300">{run.timestamp.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex flex-wrap gap-2">
                              {run.reports.map((rep: any) => {
                                const marketInfo = marketNames[rep.source_market_id] || { name: "Unknown", flag: "🌐" };
                                const statusKey = rep.status === "margin_leakage" ? "leakage" : 
                                                  rep.status === "at_risk" ? "at_risk" : "competitive";
                                const sc = statusConfig[statusKey] || statusConfig.competitive;
                                
                                const countryCodes: Record<number, string> = { 1: "DE", 2: "GB", 3: "AU", 4: "FR", 5: "US", 6: "JP" };
                                const code = countryCodes[rep.source_market_id] || "UN";

                                return (
                                  <div key={rep.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border ${sc.badge}`} title={`${marketInfo.name}: ${sc.label}`}>
                                    <span>{marketInfo.flag}</span>
                                    <span>{code}: {sc.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <Link href={`/reports/${pkg.id}/history`}
                                  className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 transition-all">
                              <Eye size={18} />
                            </Link>
                          </div>
                        </div>


                        {/* Level 3: Component Categories */}
                        <div className="flex flex-col bg-[#0a0a0e]/40 p-5 gap-8">
                          
                          {/* Hotels */}
                          <div className="flex flex-col gap-4">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-400 border-b border-white/10 pb-2">
                              <Hotel size={16} /> Accommodations
                            </h4>
                            {pkg.components?.filter((c: any) => c.component_type === 'hotel').length === 0 ? (
                              <p className="text-xs text-gray-600 italic pl-2">No hotels configured.</p>
                            ) : (
                              <div className="flex flex-col gap-6">
                                {pkg.components?.filter((c: any) => c.component_type === 'hotel').map((hotel: any) => (
                                  <div key={hotel.id} className="flex flex-col pl-3 border-l-2 border-sky-500/20">
                                    <h5 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                      {hotel.name} <span className="text-xs text-gray-500 font-medium">({hotel.nights_or_duration})</span>
                                    </h5>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {run.reports.map((rep: any) => {
                                        const marketInfo = marketNames[rep.source_market_id] || { name: "Unknown", flag: "🌐" };
                                        const match = rep.matches?.find((m: any) => m.package_component_id === hotel.id);
                                        
                                        if (!match) return null;
                                        
                                        // Dynamically derive the exact exchange rate used by ER-API for this specific report
                                        const pkgTotalLKR = pkg.components?.reduce((sum: number, c: any) => sum + (c.base_price_lkr || 0), 0) || 1;
                                        const exchangeRate = pkgTotalLKR / (rep.dmc_price_usd || 1);
                                        const dmcPrice = hotel.base_price_lkr / exchangeRate;
                                        
                                        const otaPrice = match.listing?.price_usd;
                                        let variance = 0;
                                        if (otaPrice && otaPrice > 0) {
                                          variance = ((dmcPrice - otaPrice) / otaPrice) * 100;
                                        }
                                        const varStr = `${variance > 0 ? '+' : ''}${variance.toFixed(2)}%`;
                                        const isLeak = variance < -5;
                                        const isRisk = variance > 5;
                                        const badgeClass = isLeak ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : 
                                                           isRisk ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" : 
                                                           "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                                        
                                        return (
                                          <div key={`${hotel.id}-${rep.id}`} className="flex flex-col p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 gap-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                                <span>{marketInfo.flag}</span> {marketInfo.name}
                                              </span>
                                              {otaPrice ? (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                                                  {varStr}
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 text-red-400 bg-red-500/10">N/A</span>
                                              )}
                                            </div>
                                            {otaPrice && (
                                              <div className="flex items-center justify-between mt-1">
                                                <div className="flex flex-col">
                                                  <span className="text-[9px] font-bold uppercase text-gray-500">DMC Rate</span>
                                                  <span className="text-xs font-medium text-white">${Math.round(dmcPrice)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                  <span className="text-[9px] font-bold uppercase text-gray-500">Market Price</span>
                                                  <span className="text-xs font-medium text-white">${Math.round(otaPrice)}</span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Excursions */}
                          <div className="flex flex-col gap-4 mt-2">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 border-b border-white/10 pb-2">
                              <Compass size={16} /> Activities & Tours
                            </h4>
                            {pkg.components?.filter((c: any) => c.component_type === 'excursion').length === 0 ? (
                              <p className="text-xs text-gray-600 italic pl-2">No activities configured.</p>
                            ) : (
                              <div className="flex flex-col gap-3 pl-3 border-l-2 border-emerald-500/20">
                                {pkg.components?.filter((c: any) => c.component_type === 'excursion').map((exc: any) => {
                                  // For excursions, prices don't vary significantly by market natively since Viator is global
                                  // Just grab the match from the first available report
                                  const rep = run.reports[0];
                                  const match = rep?.matches?.find((m: any) => m.package_component_id === exc.id);
                                  const otaPrice = match?.listing?.price_usd;
                                  
                                  return (
                                    <div key={exc.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                      <h5 className="text-sm font-bold text-white">{exc.name}</h5>
                                      <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                          <span className="text-[9px] font-bold uppercase text-gray-500">Market Price</span>
                                          <span className="text-sm font-bold text-white">
                                            {otaPrice ? `$${Math.round(otaPrice)}` : <span className="text-red-400 text-xs">N/A</span>}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Transfers */}
                          <div className="flex flex-col gap-4 mt-2">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400 border-b border-white/10 pb-2">
                              <Navigation size={16} /> Logistics & Transfers
                            </h4>
                            {pkg.components?.filter((c: any) => c.component_type === 'transfer').length === 0 ? (
                              <p className="text-xs text-gray-600 italic pl-2">No transfers configured.</p>
                            ) : (
                              <div className="flex flex-col gap-3 pl-3 border-l-2 border-purple-500/20">
                                {pkg.components?.filter((c: any) => c.component_type === 'transfer').map((trans: any) => {
                                  const rep = run.reports[0];
                                  const match = rep?.matches?.find((m: any) => m.package_component_id === trans.id);
                                  const otaPrice = match?.listing?.price_usd;
                                  
                                  return (
                                    <div key={trans.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
                                      <h5 className="text-sm font-bold text-white">{trans.name}</h5>
                                      <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-end">
                                          <span className="text-[9px] font-bold uppercase text-gray-500">Market Price</span>
                                          <span className="text-sm font-bold text-white">
                                            {otaPrice ? `$${Math.round(otaPrice)}` : <span className="text-red-400 text-xs">N/A</span>}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
