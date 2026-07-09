"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { fetchDashboardPackage } from "@/app/dashboard/actions";
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
  Maximize2
} from "lucide-react";

export default function ReportHistoryPage() {
  const params = useParams();
  const router = useRouter();

  const [packageData, setPackageData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

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

  const [markupApplied, setMarkupApplied] = useState(false);

  const EXCHANGE_RATE = (packageData?.reports?.[0]?.dmc_price_usd && packageData?.total_price_lkr)
    ? (packageData.total_price_lkr / packageData.reports[0].dmc_price_usd)
    : 335.00;
  const baseLkr = packageData?.total_price_lkr || 0;
  const baseUsd = baseLkr / EXCHANGE_RATE;

  const matchedComponents = (packageData?.components || []).map((comp: any) => {
    // Find the latest match by sorting matches by ID descending
    const sortedMatches = comp.matches && comp.matches.length > 0 
      ? [...comp.matches].sort((a: any, b: any) => b.id - a.id) 
      : [];
    const match = sortedMatches.length > 0 ? sortedMatches[0] : null;
    const yourCostUsd = comp.base_price_lkr / EXCHANGE_RATE;

    if (match && match.listing) {
      const scrapedCostUsd = match.listing.price_usd || match.listing.price;
      const scrapedCostLocal = match.listing.price;
      const scrapedCurrency = match.listing.currency || "USD";
      const isUnavailable = scrapedCostUsd === null || scrapedCostUsd === undefined || scrapedCostUsd === 0;
      const delta = !isUnavailable && scrapedCostUsd > 0 ? Math.round(((yourCostUsd - scrapedCostUsd) / scrapedCostUsd) * 1000) / 10 : null;

      const platformMap: Record<number, string> = { 1: "Booking.com", 2: "Agoda" };
      const scrapedPlatform = platformMap[match.listing.platform_id] || "Booking.com";

      return {
        id: comp.id,
        type: comp.component_type || "hotel",
        name: comp.name,
        details: comp.nights_or_duration ? `${comp.nights_or_duration}` : "1 Night",
        yourCostUsd: Math.round(yourCostUsd),
        yourCostLkr: Math.round(comp.base_price_lkr),
        scrapedName: match.listing.raw_name,
        scrapedPlatform: scrapedPlatform,
        scrapedCostUsd: isUnavailable ? null : Math.round(scrapedCostUsd),
        scrapedCostLocal: isUnavailable ? null : Math.round(scrapedCostLocal),
        scrapedCurrency: scrapedCurrency,
        delta: delta,
        confidence: match.confidence,
        method: match.match_method === 'llm_verified' ? 'LLM Verified' : match.match_method === 'embedding' ? 'Cosine Similarity' : 'Rule Matched',
        isUnavailable: isUnavailable
      };
    } else {
      return {
        id: comp.id,
        type: comp.component_type || "hotel",
        name: comp.name,
        details: comp.nights_or_duration ? `${comp.nights_or_duration}` : "1 Night",
        yourCostUsd: Math.round(yourCostUsd),
        yourCostLkr: Math.round(comp.base_price_lkr),
        scrapedName: "No Match Found",
        scrapedPlatform: "N/A",
        scrapedCostUsd: null,
        scrapedCostLocal: null,
        scrapedCurrency: null,
        delta: null,
        confidence: 0,
        method: "None",
        isUnavailable: true
      };
    }
  });

  const reportsList = (packageData?.reports || [])
    .map((rep: any) => {
      const marketNames: Record<number, { name: string; flag: string; curr: string }> = {
        1: { name: "Germany (DE)", flag: "🇩🇪", curr: "EUR" },
        2: { name: "United Kingdom (GB)", flag: "🇬🇧", curr: "GBP" },
        3: { name: "Australia (AU)", flag: "🇦🇺", curr: "AUD" },
        4: { name: "France (FR)", flag: "🇫🇷", curr: "EUR" },
        5: { name: "United States (US)", flag: "🇺🇸", curr: "USD" },
        6: { name: "Japan (JP)", flag: "🇯🇵", curr: "JPY" }
      };
      const marketInfo = marketNames[rep.source_market_id] || { name: "Germany (DE)", flag: "🇩🇪", curr: "EUR" };
      const dmcRateUsd = rep.dmc_price_usd;
      const dmcRateLkr = dmcRateUsd * EXCHANGE_RATE;
      const dmcRate = `$${Math.round(dmcRateUsd).toLocaleString()} (LKR ${Math.round(dmcRateLkr).toLocaleString()})`;
      
      const marketPrice = rep.market_assembled_price_usd !== null && rep.market_assembled_price_usd !== undefined
        ? `$${Math.round(rep.market_assembled_price_usd).toLocaleString()} (${marketInfo.curr})`
        : "N/A";
      const variance = rep.price_delta_pct !== null && rep.price_delta_pct !== undefined
        ? `${rep.price_delta_pct > 0 ? "+" : ""}${rep.price_delta_pct}%`
        : "N/A";
      const date = new Date(rep.generated_at).toLocaleString();
      return {
        date,
        market: `${marketInfo.name} ${marketInfo.flag}`,
        dmc: dmcRate,
        marketPrice,
        variance,
        status: rep.status,
        raw_report: rep
      };
    })
    .sort((a: any, b: any) => new Date(b.raw_report.generated_at).getTime() - new Date(a.raw_report.generated_at).getTime());

  const totalDmcUsd = matchedComponents.reduce((acc: number, c: any) => acc + c.yourCostUsd, 0);
  const availableScrapedComponents = matchedComponents.filter((c: any) => !c.isUnavailable);
  const totalScrapedUsd = availableScrapedComponents.reduce((acc: number, c: any) => acc + (c.scrapedCostUsd || 0), 0);
  const totalDmcUsdForAvailable = availableScrapedComponents.reduce((acc: number, c: any) => acc + c.yourCostUsd, 0);
  const totalDeltaPct = totalScrapedUsd > 0 ? Math.round(((totalDmcUsdForAvailable - totalScrapedUsd) / totalScrapedUsd) * 1000) / 10 : 0;
  const hasUnavailableComponents = matchedComponents.some((c: any) => c.isUnavailable);

  const latestReport = selectedReportId
    ? reportsList.find((r: any) => r.raw_report.id === selectedReportId) || reportsList[0]
    : reportsList[0];
  const lastAuditedStr = latestReport ? latestReport.date : "Never";

  // Use the selected report's snapshot data for the top dashboard metrics
  const displayTotalDmcUsd = latestReport?.raw_report?.dmc_price_usd ?? totalDmcUsd;
  const displayTotalScrapedUsd = latestReport?.raw_report?.market_assembled_price_usd ?? totalScrapedUsd;
  const displayTotalDeltaPct = latestReport?.raw_report?.price_delta_pct ?? totalDeltaPct;

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-sky-500 animate-pulse">
            <BrainCircuit size={24} className="animate-spin" />
            <span className="font-bold text-sm">Compiling Report...</span>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Header Back & Action Buttons */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert("PDF report generation complete. Downloading report...")}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 px-3 py-2 rounded-xl transition-all animate-none"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Package Identifier Header (Issue #3) */}
      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded uppercase tracking-wider">
            Audit Result
          </span>
          <h2 className="text-xl font-bold text-white mt-1">{packageData?.name}</h2>
          <p className="text-xs text-gray-300 mt-0.5">DMC Base Price: LKR {baseLkr.toLocaleString()} (approx. ${Math.round(baseUsd).toLocaleString()})</p>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {/* Source Market Card */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Source Market</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white">{latestReport ? latestReport.market : 'N/A'}</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-2 truncate" title={lastAuditedStr}>{lastAuditedStr}</span>
        </div>

        {/* DMC Price Card */}
        <div className="p-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex flex-col justify-center">
          <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-1">Your Price</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">${Math.round(displayTotalDmcUsd).toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-2">DMC Base Price</span>
        </div>

        {/* OTA Sum of Parts Card */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">OTA Sum-of-Parts</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-white">${Math.round(displayTotalScrapedUsd).toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-gray-500 mt-2">Lowest public retail equivalent</span>
        </div>

        {/* Pricing Gap Card */}
        <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-center">
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Pricing Gap</span>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black ${displayTotalDeltaPct > 0 ? "text-yellow-400" : "text-emerald-400"}`}>
              {displayTotalDeltaPct > 0 ? "+" : ""}{displayTotalDeltaPct}%
            </span>
          </div>
          <span className="text-[10px] text-gray-500 mt-2">
            {displayTotalDeltaPct > 0 ? "Premium over OTA market" : "Margin gap under OTA"}
          </span>
        </div>
      </div>

      {hasUnavailableComponents && (
        <div className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center gap-2 mt-4">
          <AlertTriangle size={14} className="shrink-0" />
          <span>Some components are currently Sold Out or unavailable on OTAs. The Market Sum-of-Parts and pricing gap calculations exclude these components.</span>
        </div>
      )}

      {/* Component-level Breakdown */}
      <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6 mt-6">
        <div>
          <h3 className="text-sm font-bold text-white">Component Price Breakdown</h3>
          <p className="text-xs text-gray-300 mt-0.5">Scraped OTA match equivalence details</p>
        </div>

        <div className="flex flex-col gap-4">
          {matchedComponents.map((comp: any) => (
            <div key={comp.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">

              {/* DMC component */}
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border bg-zinc-950/40 border-zinc-800 ${comp.type === "hotel"
                    ? "text-sky-400"
                    : comp.type === "excursion"
                      ? "text-emerald-400"
                      : "text-purple-400"
                  }`}>
                  {comp.type === "hotel" ? <Hotel size={16} /> : comp.type === "excursion" ? <Compass size={16} /> : <Navigation size={16} />}
                </div>

                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">{comp.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-sky-400 font-semibold">${comp.yourCostUsd.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-500 font-medium">LKR {comp.yourCostLkr?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Match Arrow Icon */}
              <div className="hidden md:block text-gray-400">
                <ArrowRight size={16} />
              </div>

              {/* Scraped OTA component */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-zinc-300 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                    {comp.scrapedPlatform}
                  </span>
                  <span className="text-xs text-gray-300 font-medium truncate max-w-[200px]" title={comp.scrapedName}>
                    {comp.scrapedName}
                  </span>
                </div>
                <span className="text-[10px] text-gray-300 mt-0.5">
                  Confidence: <strong className="text-emerald-400">{comp.confidence}%</strong> ({comp.method})
                </span>
                <div className="mt-1">
                  {comp.isUnavailable ? (
                    <span className="text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded text-[10px] uppercase">
                      Sold Out / N/A
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold">
                      <span>${comp.scrapedCostUsd.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-500 font-medium">{comp.scrapedCurrency} {comp.scrapedCostLocal?.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price comparison result */}
              <div className="text-right flex flex-col items-start md:items-end justify-center min-w-[80px]">
                <span className={`text-xs font-bold ${comp.isUnavailable ? "text-gray-400" : "text-emerald-400"}`}>
                  {comp.isUnavailable ? "—" : `${comp.delta > 0 ? "+" : ""}${comp.delta}%`}
                </span>
                <span className="text-[10px] text-gray-300">vs OTA price</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Card: Historical Audit Logs */}
      <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6 mt-8">
        <div>
          <h3 className="text-sm font-bold text-white">Historical Audit Logs</h3>
          <p className="text-xs text-gray-300 mt-0.5">Timeline of past proxy scrapes and pricing snapshots for this package</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="pb-3 pl-3">Audit Date / Time</th>
                <th className="pb-3">Target Market</th>
                <th className="pb-3">DMC Rate</th>
                <th className="pb-3">Market Price</th>
                <th className="pb-3 pr-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
              {reportsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">No audits have been executed yet for this package.</td>
                </tr>
              ) : (
                reportsList.map((run: any, idx: number) => {
                  const isSelected = selectedReportId === run.raw_report.id || (!selectedReportId && idx === 0);
                  return (
                    <tr 
                      key={idx} 
                      onClick={() => setSelectedReportId(run.raw_report.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected 
                          ? 'bg-blue-500/10 border-l-[3px] border-l-blue-500' 
                          : 'hover:bg-zinc-900/50 border-l-[3px] border-l-transparent'
                      }`}
                    >
                      <td className={`py-3.5 pl-3 font-medium ${isSelected ? 'text-blue-400' : 'text-white group-hover:text-sky-300'}`}>
                        {run.date}
                      </td>
                      <td className="py-3.5">{run.market}</td>
                      <td className="py-3.5">{run.dmc}</td>
                      <td className={`py-3.5 font-semibold ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                        {run.marketPrice}
                      </td>
                      <td className="py-3.5 pr-3 text-right">
                        <span className={`font-bold ${run.status === "underpriced" || run.status === "margin_leakage" ? "text-blue-400" : run.status === "at_risk" ? "text-yellow-400" : "text-emerald-400"
                          }`}>
                          {run.variance}
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
    </PageWrapper>
  );
}
