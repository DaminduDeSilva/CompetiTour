"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
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

  // Mock details
  const [markupApplied, setMarkupApplied] = useState(false);

  const matchedComponents = [
    {
      id: 1,
      type: "hotel",
      name: "Cinnamon Wild Yala",
      details: "3 Nights - Deluxe Room",
      yourCostEur: 1850,
      scrapedName: "Cinnamon Wild (Yala Park) - Superior Room",
      scrapedPlatform: "Agoda",
      scrapedCostEur: 2100,
      delta: -11.9,
      confidence: 98.4,
      method: "LLM Verified"
    },
    {
      id: 2,
      type: "excursion",
      name: "Yala National Park Safari",
      details: "Half-Day Private Jeep Tour",
      yourCostEur: 410,
      scrapedName: "Yala National Park Jeep Excursion (Private)",
      scrapedPlatform: "Viator",
      scrapedCostEur: 510,
      delta: -19.6,
      confidence: 94.1,
      method: "Cosine Similarity"
    },
    {
      id: 3,
      type: "hotel",
      name: "Cape Weligama",
      details: "4 Nights - Ocean Villa",
      yourCostEur: 3100,
      scrapedName: "Cape Weligama Resort - Premier Ocean Villa",
      scrapedPlatform: "Booking.com",
      scrapedCostEur: 4120,
      delta: -24.8,
      confidence: 97.2,
      method: "LLM Verified"
    },
    {
      id: 4,
      type: "transfer",
      name: "Southern Transfers Package",
      details: "Private Premium Van",
      yourCostEur: 300,
      scrapedName: "Colombo/Yala/Weligama Private Luxury Chauffeur",
      scrapedPlatform: "Expedia",
      scrapedCostEur: 390,
      delta: -23.1,
      confidence: 88.5,
      method: "Rule Matched"
    }
  ];

  const totalDmcEur = matchedComponents.reduce((acc, c) => acc + c.yourCostEur, 0);
  const totalScrapedEur = matchedComponents.reduce((acc, c) => acc + c.scrapedCostEur, 0);
  const totalDeltaPct = Math.round(((totalDmcEur - totalScrapedEur) / totalScrapedEur) * 1000) / 10;

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
          <h2 className="text-xl font-bold text-white mt-1">Adventure & Wildlife Safari - 12 Days</h2>
          <p className="text-xs text-gray-300 mt-0.5">DMC Base Price: LKR 1,850,000 (approx. €5,660)</p>
        </div>
      </div>

      {/* Main Alert Card: Optimization recommendations reframed (Issue #1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
        
        {/* Left Section: Match Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card: Pricing Gap & Margin Simulation */}
          <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <BrainCircuit size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">AI Pricing Gap & Margin Analysis</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Your DMC package is currently priced at a <strong className="text-blue-400">{Math.abs(totalDeltaPct)}% gap</strong> under the lowest public price on Booking.com and Agoda in Germany. This analysis identifies margins that can be adjusted manually while remaining below public retail aggregates.
                </p>
              </div>
            </div>

            <span className="h-px bg-zinc-800" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-300 uppercase font-semibold">Your Price</span>
                  <span className="text-sm font-black text-white">€{totalDmcEur.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-300 uppercase font-semibold">Market Sum-of-Parts</span>
                  <span className="text-sm font-black text-white">€{totalScrapedEur.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-300 uppercase font-semibold">Pricing Gap Opportunity</span>
                  <span className="text-sm font-black text-emerald-400">+€{Math.round((totalScrapedEur * 0.9 - totalDmcEur))} (at 10% discount)</span>
                </div>
              </div>

              {!markupApplied ? (
                <button 
                  onClick={() => setMarkupApplied(true)}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-sky-400 text-xs font-bold text-black transition-all cursor-pointer"
                >
                  Simulate Target Price Adjustment
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <CheckCircle size={14} /> Target Price Simulated
                </span>
              )}
            </div>
          </div>

          {/* Component-level Breakdown */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-white">Component Price Breakdown</h3>
              <p className="text-xs text-gray-300 mt-0.5">Scraped OTA match equivalence details</p>
            </div>

            <div className="flex flex-col gap-4">
              {matchedComponents.map((comp) => (
                <div key={comp.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  {/* DMC component */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border bg-zinc-950/40 border-zinc-800 ${
                      comp.type === "hotel" 
                        ? "text-sky-400" 
                        : comp.type === "excursion" 
                        ? "text-emerald-400" 
                        : "text-purple-400"
                    }`}>
                      {comp.type === "hotel" ? <Hotel size={16} /> : comp.type === "excursion" ? <Compass size={16} /> : <Navigation size={16} />}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{comp.name}</span>
                      <span className="text-[10px] text-gray-300 mt-0.5">{comp.details}</span>
                      <span className="text-xs text-sky-400 font-semibold mt-1">€{comp.yourCostEur.toLocaleString()}</span>
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
                    <span className="text-xs text-amber-500 font-semibold mt-1">€{comp.scrapedCostEur.toLocaleString()}</span>
                  </div>

                  {/* Price comparison result */}
                  <div className="text-right flex flex-col items-start md:items-end justify-center min-w-[80px]">
                    <span className="text-xs font-bold text-emerald-400">
                      {comp.delta}%
                    </span>
                    <span className="text-[10px] text-gray-300">vs OTA price</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section: Overview Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card: Info & Market details */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Market Audit Snapshot</h3>
            
            <div className="flex flex-col gap-3 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>DMC Price (USD equivalent)</span>
                <span className="text-white font-bold">${(totalDmcEur * 1.08).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between">
                <span>Market Price (USD equivalent)</span>
                <span className="text-white font-bold">${(totalScrapedEur * 1.08).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
              </div>
              <div className="flex justify-between">
                <span>Source Market</span>
                <span className="text-white font-bold flex items-center gap-1">🇩🇪 Germany</span>
              </div>
              <div className="flex justify-between">
                <span>Last Audited</span>
                <span className="text-white font-bold">Just now (June 21, 2026)</span>
              </div>
              <span className="h-px bg-zinc-800" />
              <div className="flex justify-between text-sm">
                <span className="text-white font-bold">Overall Competitiveness</span>
                <span className="text-blue-400 font-black">Leakage ({totalDeltaPct}%)</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              Why this matching is reliable
            </h4>
            <p className="text-[10px] text-gray-300 leading-relaxed">
              We leverage Torch Labs residential proxies to bypass OTA geofencing and anti-bot systems, ensuring the German market rates are identical to what travelers see from their browsers in Frankfurt.
            </p>
          </div>
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
                <th className="pb-3">Audit Date / Time</th>
                <th className="pb-3">Target Market</th>
                <th className="pb-3">DMC Rate</th>
                <th className="pb-3">Market Price</th>
                <th className="pb-3">Variance</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-gray-300">
              {[
                { date: "June 20, 2026 14:32", market: "Germany (DE) 🇩🇪", dmc: "€5,660", marketPrice: "€7,120", variance: "-20.5%", status: "leakage" },
                { date: "June 12, 2026 09:15", market: "United Kingdom (GB) 🇬🇧", dmc: "€5,660", marketPrice: "€7,290", variance: "-22.4%", status: "leakage" },
                { date: "May 28, 2026 16:45", market: "Australia (AU) 🇦🇺", dmc: "€5,660", marketPrice: "€7,670", variance: "-26.2%", status: "leakage" },
              ].map((run, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/10 transition-colors">
                  <td className="py-3.5 font-medium text-white">{run.date}</td>
                  <td className="py-3.5">{run.market}</td>
                  <td className="py-3.5">{run.dmc}</td>
                  <td className="py-3.5 font-semibold text-white">{run.marketPrice}</td>
                  <td className="py-3.5">
                    <span className={`font-bold ${
                      run.status === "leakage" ? "text-blue-400" : run.status === "at_risk" ? "text-yellow-400" : "text-emerald-400"
                    }`}>
                      {run.variance}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button 
                      onClick={() => alert(`Restored audit snapshot from ${run.date} for comparison.`)}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      View Snapshot
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
