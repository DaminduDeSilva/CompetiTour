"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Filter, Eye, Download, Search, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { fetchDashboardPackages } from "@/app/(dashboard)/dashboard/actions";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  competitive: { label: "Competitive", icon: <CheckCircle size={12} />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  at_risk:     { label: "At Risk",     icon: <AlertTriangle size={12} />, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  leakage:     { label: "Leakage",     icon: <TrendingDown size={12} />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const { packages } = await fetchDashboardPackages();
        if (packages) {
          const extractedReports = packages.flatMap((pkg: any) => {
            let totalConfidence = 0;
            let matchCount = 0;
            if (pkg.components) {
              pkg.components.forEach((comp: any) => {
                if (comp.matches && comp.matches.length > 0) {
                  totalConfidence += comp.matches[0].confidence;
                  matchCount++;
                }
              });
            }
            const avgConfidence = matchCount > 0 ? Math.round((totalConfidence / matchCount) * 10) / 10 : 95.0;

            return (pkg.reports || []).map((rep: any) => {
              const marketNames: Record<number, { name: string; flag: string }> = {
                1: { name: "Germany", flag: "🇩🇪" },
                2: { name: "United Kingdom", flag: "🇬🇧" },
                3: { name: "Australia", flag: "🇦🇺" },
                4: { name: "France", flag: "🇫🇷" },
                5: { name: "United States", flag: "🇺🇸" },
                6: { name: "Japan", flag: "🇯🇵" }
              };
              const marketInfo = marketNames[rep.source_market_id] || { name: "Germany", flag: "🇩🇪" };
              const varianceVal = rep.price_delta_pct;
              const varianceStr = `${varianceVal > 0 ? "+" : ""}${varianceVal}%`;
              
              let status = "competitive";
              if (rep.status === "at_risk") status = "at_risk";
              else if (rep.status === "underpriced" || rep.status === "margin_leakage") status = "leakage";

              return {
                runId: `r-${rep.id}`,
                packageId: pkg.id,
                packageName: pkg.name,
                market: marketInfo.name,
                marketFlag: marketInfo.flag,
                dmc: `$${Math.round(rep.dmc_price_usd).toLocaleString()}`,
                marketPrice: `$${Math.round(rep.market_assembled_price_usd).toLocaleString()}`,
                variance: varianceStr,
                status: status,
                date: new Date(rep.generated_at).toLocaleString(),
                confidence: avgConfidence
              };
            });
          });
          extractedReports.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setReports(extractedReports);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    const matchSearch = r.packageName.toLowerCase().includes(search.toLowerCase()) || r.market.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const handleExportCsv = () => {
    if (filtered.length === 0) return;
    
    const headers = ["Date / Time", "Package", "Market", "DMC Rate", "Market Price", "Variance", "Confidence", "Status"];
    const rows = filtered.map(r => [
      `"${r.date}"`,
      `"${r.packageName}"`,
      `"${r.market}"`,
      `"${r.dmc}"`,
      `"${r.marketPrice}"`,
      `"${r.variance}"`,
      `"${r.confidence}%"`,
      `"${r.status}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
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
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3">
            <BarChart3 size={28} className="text-sky-400" />
            Audit Reports
          </h2>
          <p className="text-sm text-sky-200/60 mt-1 font-medium tracking-wide">{reports.length} completed audit runs across all packages</p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Runs", value: reports.length, color: "text-white" },
          { label: "Leakage Alerts", value: reports.filter(r => r.status === "leakage").length, color: "text-blue-400" },
          { label: "At Risk", value: reports.filter(r => r.status === "at_risk").length, color: "text-yellow-400" },
        ].map((c) => (
          <div key={c.label} className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md">
            <p className="text-xs text-gray-300 font-semibold uppercase tracking-wider">{c.label}</p>
            <p className={`text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
          <input
            type="text"
            placeholder="Search by package or market..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white placeholder-gray-600 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-300" />
          {["all", "leakage", "at_risk", "competitive"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${filter === f ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "border-zinc-800 text-gray-300 hover:text-white"}`}>
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
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">Loading audit reports...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-gray-400">No reports found.</td>
              </tr>
            ) : (
              filtered.map((r: any) => {
                const sc = statusConfig[r.status] || statusConfig.competitive;
                return (
                  <tr key={r.runId} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="px-5 py-4 text-gray-300 whitespace-nowrap">{r.date}</td>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

