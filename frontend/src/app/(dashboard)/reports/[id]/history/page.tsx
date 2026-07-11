"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { fetchDashboardPackage } from "@/app/(dashboard)/dashboard/actions";
import {
  ArrowLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  Hotel,
  Navigation,
  Compass,
  ArrowRight,
  TrendingDown,
  BrainCircuit,
  Maximize2,
  BarChart3,
  ChevronRight
} from "lucide-react";

const marketNames: Record<number, { name: string; flag: string; curr: string; short: string }> = {
  1: { name: "Germany", flag: "🇩🇪", curr: "EUR", short: "DE" },
  2: { name: "United Kingdom", flag: "🇬🇧", curr: "GBP", short: "GB" },
  3: { name: "Australia", flag: "🇦🇺", curr: "AUD", short: "AU" },
  4: { name: "France", flag: "🇫🇷", curr: "EUR", short: "FR" },
  5: { name: "United States", flag: "🇺🇸", curr: "USD", short: "US" },
  6: { name: "Japan", flag: "🇯🇵", curr: "JPY", short: "JP" }
};

export default function ReportHistoryPage() {
  const params = useParams();
  const router = useRouter();

  const [packageData, setPackageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (params.id) {
        setIsLoading(true);
        const { data } = await fetchDashboardPackage(params.id as string);
        if (data) {
          setPackageData(data);
        }
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.id]);



  // Group reports by job_id to create AuditRuns
  const runMap = new Map<string, any>();
  packageData?.reports?.forEach((rep: any) => {
    const key = rep.job_id || `legacy-${rep.id}`;
    if (!runMap.has(key)) {
      runMap.set(key, {
        job_id: key,
        generated_at: rep.generated_at,
        reports: [],
        markets: []
      });
    }
    const run = runMap.get(key);
    run.reports.push(rep);
    if (!run.markets.includes(rep.source_market_id)) {
      run.markets.push(rep.source_market_id);
    }
  });
  const runsList = Array.from(runMap.values()).sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime());
  const selectedRun = selectedJobId ? runsList.find(r => r.job_id === selectedJobId) || runsList[0] : runsList[0];
  
  const EXCHANGE_RATE = (selectedRun?.reports?.[0]?.dmc_price_usd && packageData?.total_price_lkr)
    ? (packageData.total_price_lkr / selectedRun.reports[0].dmc_price_usd)
    : 335.00;
  const baseLkr = packageData?.total_price_lkr || 0;
  const baseUsd = baseLkr / EXCHANGE_RATE;
  
  const lastAuditedStr = selectedRun ? new Date(selectedRun.generated_at).toLocaleString() : "Never";
  
  // Format run markets for display
  const runMarketsStr = selectedRun 
    ? selectedRun.markets.map((m: number) => marketNames[m]?.flag || "🏳️").join(" ")
    : "N/A";

  const runReportIds = selectedRun?.reports.map((r: any) => r.id) || [];

  const matchedComponents = (packageData?.components || []).map((comp: any) => {
    // Filter matches to only those for the currently selected Run
    const filteredMatches = comp.matches
      ? comp.matches.filter((m: any) => runReportIds.includes(m.report_id))
      : [];
      
    const wasAudited = filteredMatches.length > 0;
    const yourCostUsd = comp.base_price_lkr / EXCHANGE_RATE;

    if (!wasAudited) {
      return {
        id: comp.id,
        type: comp.component_type || "hotel",
        name: comp.name,
        details: comp.nights_or_duration ? `${comp.nights_or_duration}` : "1 Night",
        yourCostUsd: Math.round(yourCostUsd),
        yourCostLkr: Math.round(comp.base_price_lkr),
        marketMatches: [],
        notAudited: true,
        bestCostUsd: null,
        isUnavailable: true
      };
    }

    // Process all matches for this component in the run
    const marketMatches = filteredMatches.map((match: any) => {
      const isUnavailable = !match.listing || match.listing.price_usd === null || match.listing.price_usd === undefined || match.listing.price_usd === 0;
      const scrapedCostUsd = match.listing?.price_usd || match.listing?.price || 0;
      const scrapedCostLocal = match.listing?.price || 0;
      const scrapedCurrency = match.listing?.currency || "USD";
      const delta = !isUnavailable && scrapedCostUsd > 0 ? ((yourCostUsd - scrapedCostUsd) / scrapedCostUsd) * 100 : null;
      
      const platformMap: Record<number, string> = { 1: "Booking.com", 2: "Agoda", 3: "Klook", 4: "Viator" };
      const scrapedPlatform = match.listing ? (platformMap[match.listing.platform_id] || "Booking.com") : "N/A";

      // Find which report this match belongs to, so we can display the market
      const parentReport = selectedRun.reports.find((r: any) => r.id === match.report_id);
      const marketId = parentReport?.source_market_id || 1;
      
      return {
        id: match.id,
        marketId: marketId,
        scrapedName: match.listing ? match.listing.raw_name : "No Match Found",
        scrapedPlatform,
        scrapedCostUsd: isUnavailable ? null : Math.round(scrapedCostUsd),
        scrapedCostLocal: isUnavailable ? null : Math.round(scrapedCostLocal),
        scrapedCurrency,
        delta,
        confidence: match.confidence || 0,
        method: match.match_method === 'llm_verified' ? 'LLM Verified' : match.match_method === 'embedding' ? 'Cosine Similarity' : match.match_method === 'reference_match' ? 'Reference Intelligence' : 'Rule Matched',
        matchTier: match.match_tier || "unmatched",
        isUnavailable,
        url: match.listing?.url || null
      };
    });

    // Deduplicate excursion matches by scrapedName to keep distinct reference options
    let displayMatches = marketMatches;
    if (comp.component_type !== 'hotel') {
      const seenNames = new Set();
      displayMatches = marketMatches.filter((m: any) => {
        if (!m.scrapedName || m.scrapedName === "No Match Found") return false;
        if (seenNames.has(m.scrapedName)) return false;
        seenNames.add(m.scrapedName);
        return true;
      });
      if (displayMatches.length === 0 && marketMatches.length > 0) {
        displayMatches = [marketMatches[0]];
      }
    } else {
      // Sort hotel matches by market ID
      displayMatches.sort((a: any, b: any) => a.marketId - b.marketId);
    }

    // Calculate best cost across markets for summary (hotels only)
    const validCosts = displayMatches.filter((m: any) => !m.isUnavailable && m.matchTier !== "alternative").map((m: any) => m.scrapedCostUsd);
    const bestCostUsd = comp.component_type === 'hotel' && validCosts.length > 0 ? Math.min(...validCosts) : null;

    return {
      id: comp.id,
      type: comp.component_type || "hotel",
      name: comp.name,
      details: comp.nights_or_duration ? `${comp.nights_or_duration}` : "1 Night",
      yourCostUsd: Math.round(yourCostUsd),
      yourCostLkr: Math.round(comp.base_price_lkr),
      marketMatches: displayMatches,
      notAudited: false,
      bestCostUsd,
      isUnavailable: bestCostUsd === null
    };
  });

  const totalDmcUsd = matchedComponents.reduce((acc: number, c: any) => acc + c.yourCostUsd, 0);
  const availableScrapedComponents = matchedComponents.filter((c: any) => c.bestCostUsd !== null);
  const totalScrapedUsd = availableScrapedComponents.reduce((acc: number, c: any) => acc + (c.bestCostUsd || 0), 0);
  const totalDmcUsdForAvailable = availableScrapedComponents.reduce((acc: number, c: any) => acc + c.yourCostUsd, 0);
  const totalDeltaPct = totalScrapedUsd > 0 ? ((totalDmcUsdForAvailable - totalScrapedUsd) / totalScrapedUsd) * 100 : 0;
  
  // Checking if there are any unavailable components that WERE audited
  const hasUnavailableComponents = matchedComponents.some((c: any) => !c.notAudited && c.isUnavailable);
  const isExcursionOnlyRun = matchedComponents.every((c: any) => c.notAudited || c.type !== 'hotel');

  const exportPDF = async () => {
    setIsExporting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const payload = {
        package_name: packageData?.name || "Unknown Package",
        report_data: {
          markets: isExcursionOnlyRun 
            ? "Global" 
            : selectedRun.markets.map((m: number) => marketNames[m]?.name || "Unknown").join(", "),
          date: lastAuditedStr,
          audited_components: matchedComponents.filter((c: any) => !c.notAudited).length,
          total_components: matchedComponents.length,
        },
        components: matchedComponents.map((comp: any) => ({
          name: comp.name,
          type: comp.type,
          your_cost_usd: comp.yourCostUsd,
          is_unavailable: comp.isUnavailable,
          markets: comp.marketMatches.map((m: any) => ({
            market: marketNames[m.marketId]?.name || "Unknown",
            platform: m.scrapedPlatform || "N/A",
            ota_price_usd: m.scrapedCostUsd,
            local_price: m.scrapedCostLocal,
            currency: m.scrapedCurrency,
            delta: m.delta !== null ? parseFloat(m.delta.toFixed(1)) : null,
            confidence: m.confidence,
            is_unavailable: m.isUnavailable,
          }))
        }))
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${API_URL}/packages/reports/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `CompetiTour_Audit_${packageData?.name?.replace(/\W+/g, "_") || "Report"}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Failed to export PDF. Please check console for details.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-sky-500 animate-pulse">
            <BrainCircuit size={24} className="animate-spin" />
            <span className="font-bold text-sm">Compiling Report...</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Back Button */}
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        <span>Back to Reports</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3">
            <BarChart3 size={28} className="text-sky-400" />
            {packageData?.name || "Audit Result"}
          </h2>
          <p className="text-sm text-sky-200/60 mt-1 font-medium tracking-wide">
            DMC Base Price: LKR {baseLkr.toLocaleString()} (approx. ${Math.round(baseUsd).toLocaleString()})
          </p>
        </div>
        <button
          onClick={exportPDF}
          disabled={isExporting}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer ${isExporting ? 'opacity-50' : ''}`}
        >
          {isExporting ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-500 border-t-transparent animate-spin" />
          ) : (
            <Download size={14} />
          )}
          <span>{isExporting ? "Generating..." : "Export PDF"}</span>
        </button>
      </div>

      {/* Audit Context Strip */}
      {!isExcursionOnlyRun && selectedRun && (
        <div className="mt-6 flex items-start justify-between w-full">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Audit Date</span>
            <span className="text-sm font-semibold text-white">{lastAuditedStr}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Source Markets</span>
            <span className="text-sm font-semibold text-white leading-relaxed max-w-md">
              {selectedRun.markets.map((m: number) => marketNames[m]?.name || "Unknown").join(" · ")}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Audited Components</span>
            <span className="text-sm font-semibold text-white">{matchedComponents.filter((c: any) => !c.notAudited).length} of {matchedComponents.length}</span>
          </div>
        </div>
      )}


      {/* Component-level Breakdown */}
      <div className="flex flex-col gap-6 mt-8">
        <div>
          <h3 className="text-xl font-black text-white">Component Price Breakdown</h3>
          <p className="text-sm text-gray-400 mt-1">Scraped OTA match equivalence details across selected markets</p>
        </div>

        <div className="flex flex-col gap-4">
          {matchedComponents.map((comp: any) => (
            <div key={comp.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 flex flex-col gap-4">

              {/* DMC component Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border bg-zinc-950/40 border-zinc-800 ${comp.type === "hotel"
                      ? "text-sky-400"
                      : comp.type === "excursion"
                        ? "text-emerald-400"
                        : "text-purple-400"
                    }`}>
                    {comp.type === "hotel" ? <Hotel size={14} /> : comp.type === "excursion" ? <Compass size={14} /> : <Navigation size={14} />}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-white">{comp.name}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Your Cost</span>
                  <span className="text-xl font-black text-white">${comp.yourCostUsd.toLocaleString()}</span>
                </div>
              </div>

              {/* OTA Matches Breakdown */}
              <div className="flex flex-col pl-11 gap-3">
                {comp.notAudited ? (
                   <div className="flex items-center">
                    <span className="text-gray-400 font-bold bg-gray-500/10 border border-gray-500/20 px-2 py-1 rounded text-[10px] uppercase">
                      Not Audited
                    </span>
                   </div>
                ) : comp.type !== "hotel" ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
                        Similar Market Options (Reference Only)
                      </span>
                    </div>
                    {comp.marketMatches.every((m: any) => m.isUnavailable) ? (
                      <div className="py-3 px-4 rounded-xl border border-zinc-900 bg-zinc-950/20 text-center">
                        <span className="text-xs text-gray-500 font-medium">No similar options found in search results</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {comp.marketMatches.filter((m: any) => !m.isUnavailable).map((match: any, idx: number) => (
                          <div key={idx} className="flex flex-col justify-between p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/10 hover:bg-zinc-900/30 hover:border-zinc-700/60 transition-all duration-300 relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            <div className="flex flex-col gap-2 relative z-10">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-bold text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors duration-200" title={match.scrapedName}>
                                  {match.scrapedName}
                                </span>
                                <span className="text-[10px] font-extrabold text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 shrink-0">
                                  {match.scrapedPlatform}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                                <span className="flex items-center gap-1">
                                  Similarity: <strong className="text-emerald-400">{Math.round(match.confidence)}%</strong>
                                </span>
                                <span>•</span>
                                <span className="text-zinc-500 font-medium">{match.method}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-end justify-between border-t border-zinc-800/50 pt-2.5 mt-3 relative z-10">
                              <div className="flex flex-col">
                                <span className="text-sm text-amber-500 font-black">${match.scrapedCostUsd?.toLocaleString()}</span>
                                <span className="text-xs text-zinc-500 font-medium">{match.scrapedCurrency} {match.scrapedCostLocal?.toLocaleString()}</span>
                              </div>
                              
                              {match.url && (
                                <a
                                  href={match.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-bold px-2.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-white hover:text-black text-gray-300 border border-zinc-800 hover:border-white transition-all duration-300 flex items-center gap-1"
                                >
                                  Book Option
                                  <ChevronRight size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  comp.marketMatches.map((match: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 bg-zinc-950/40 px-3 rounded-lg border border-zinc-800/60">
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200" title={marketNames[match.marketId]?.name}>
                            {marketNames[match.marketId]?.flag} {marketNames[match.marketId]?.short}
                          </span>
                          
                          <span className="text-xs font-black text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                            {match.scrapedPlatform}
                          </span>
                          
                          <span className="text-sm font-semibold truncate max-w-[280px] text-gray-200" title={match.scrapedName}>
                            {match.scrapedName}
                          </span>
                          
                          {match.matchTier === "alternative" && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                              Alternative
                            </span>
                          )}
                        </div>
                        
                        <span className="text-xs text-zinc-400 mt-1">
                          Confidence: <strong className="text-emerald-400">{match.confidence}%</strong> ({match.method})
                        </span>
                      </div>

                      <div className="flex items-center gap-4 min-w-[140px] justify-between sm:justify-end">
                        {match.isUnavailable ? (
                          <span className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase">
                            No Match Found
                          </span>
                        ) : (
                          <>
                            <div className="flex flex-col items-start sm:items-end">
                              <div className="flex items-center gap-1.5 text-sm text-amber-500 font-black">
                                <span>${match.scrapedCostUsd?.toLocaleString()}</span>
                              </div>
                              <span className="text-xs text-zinc-500 font-medium">{match.scrapedCurrency} {match.scrapedCostLocal?.toLocaleString()}</span>
                            </div>
                            <div className="text-right flex flex-col items-end justify-center w-12 border-l border-zinc-800 pl-3">
                              <span className={`text-sm font-black ${
                                match.isUnavailable ? "text-zinc-500" : 
                                match.delta < -5.0 ? "text-blue-400" : 
                                match.delta > 5.0 ? "text-yellow-400" : 
                                "text-emerald-400"
                              }`}>
                                {match.delta !== null ? `${match.delta > 0 ? "+" : ""}${match.delta.toFixed(1)}%` : "N/A"}
                              </span>
                            </div>

                          </>
                        )}
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
          
          {hasUnavailableComponents && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-2.5 mt-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>Some hotel components are currently Sold Out, unavailable on OTAs, or matched as Alternatives. The Market Sum-of-Parts and pricing gap calculations exclude these hotel components to maintain accuracy.</span>
            </div>
          )}
        </div>
      </div>


      {/* Previous Audit Runs */}
      <div className="mt-10 pb-4">
        <div className="mb-5">
          <h3 className="text-base font-bold text-white">Previous Audit Runs</h3>
          <p className="text-xs text-gray-500 mt-0.5">Select a run to view its detailed pricing snapshot</p>
        </div>

        <div className="rounded-2xl border border-zinc-900 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/60 border-b border-zinc-900">
                <th className="px-5 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-wider">Run Date &amp; Time</th>
                <th className="px-5 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-wider">Markets Audited</th>
                <th className="px-5 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-wider">Components Selected</th>
                <th className="px-5 py-3 text-[10px] text-gray-500 uppercase font-bold tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {runsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-500 text-sm">
                    No audits have been executed yet for this package.
                  </td>
                </tr>
              ) : (
                runsList.map((run: any, idx: number) => {
                  const isSelected = selectedJobId === run.job_id || (!selectedJobId && idx === 0);
                  const dateStr = new Date(run.generated_at).toLocaleString();
                  const marketShorts = run.markets.map((m: number) => marketNames[m]?.short || "??").join("  ·  ");

                  const leakCount = run.reports.filter((r: any) => r.status === "underpriced" || r.status === "margin_leakage").length;
                  const riskCount = run.reports.filter((r: any) => r.status === "at_risk").length;
                  const compCount = run.reports.length - leakCount - riskCount;
                  const totalMarkets = run.reports.length;

                  const statusLabel = leakCount > 0 ? "Margin Leakage" : riskCount > 0 ? "At Risk" : "Competitive";
                  const statusColor = leakCount > 0
                    ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                    : riskCount > 0
                    ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  const dotColor = leakCount > 0 ? "bg-blue-400" : riskCount > 0 ? "bg-yellow-400" : "bg-emerald-400";

                  return (
                    <tr
                      key={idx}
                      onClick={() => setSelectedJobId(run.job_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-500/[0.07] border-l-[3px] border-l-blue-500"
                          : "hover:bg-zinc-900/40 border-l-[3px] border-l-transparent"
                      }`}
                    >
                      {/* Run Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold block ${isSelected ? "text-blue-400" : "text-white"}`}>{dateStr}</span>
                      </td>

                      {/* Markets Audited — short codes */}
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-300 font-mono tracking-wide">{marketShorts}</span>
                      </td>

                      {/* Components Selected — market result breakdown */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          {leakCount > 0 && <span className="text-blue-400 font-semibold">{leakCount} Leakage</span>}
                          {riskCount > 0 && <span className="text-yellow-400 font-semibold">{riskCount} At Risk</span>}
                          {compCount > 0 && <span className="text-emerald-400 font-semibold">{compCount} Competitive</span>}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${statusColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


    </>
  );
}
