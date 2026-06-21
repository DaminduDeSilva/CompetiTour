"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "../../../../components/layout/PageWrapper";
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
      yourCostEur: 1350,
      scrapedName: "Cinnamon Wild (Yala Park) - Superior Room",
      scrapedPlatform: "Agoda",
      scrapedCostEur: 1420,
      delta: -4.9,
      confidence: 98.4,
      method: "LLM Verified"
    },
    {
      id: 2,
      type: "excursion",
      name: "Yala National Park Safari",
      details: "Half-Day Private Jeep Tour",
      yourCostEur: 360,
      scrapedName: "Yala National Park Jeep Excursion (Private)",
      scrapedPlatform: "Viator",
      scrapedCostEur: 410,
      delta: -12.2,
      confidence: 94.1,
      method: "Cosine Similarity"
    },
    {
      id: 3,
      type: "hotel",
      name: "Cape Weligama",
      details: "4 Nights - Ocean Villa",
      yourCostEur: 2050,
      scrapedName: "Cape Weligama Resort - Premier Ocean Villa",
      scrapedPlatform: "Booking.com",
      scrapedCostEur: 2900,
      delta: -29.3,
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
      scrapedPlatform: "Local Agency",
      scrapedCostEur: 380,
      delta: -21.0,
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
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 px-3 py-2 rounded-xl transition-all"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Alert Card: Optimization recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Section: Match Breakdown */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card: Recommendations */}
          <div className="p-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <BrainCircuit size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">AI Margin Optimization Recommendation</h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Your DMC package is currently underpriced by <strong className="text-blue-400">{Math.abs(totalDeltaPct)}%</strong> compared to the lowest public price on Booking.com and Agoda in Germany. You can increase your price to capture more margin while remaining competitive.
                </p>
              </div>
            </div>

            <span className="h-px bg-zinc-800" />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Your Price</span>
                  <span className="text-sm font-black text-white">€{totalDmcEur.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Market Sum-of-Parts</span>
                  <span className="text-sm font-black text-white">€{totalScrapedEur.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 uppercase font-semibold">Target Price Margin Opportunity</span>
                  <span className="text-sm font-black text-emerald-400">+€{Math.round((totalScrapedEur * 0.9 - totalDmcEur))} (at 10% discount)</span>
                </div>
              </div>

              {!markupApplied ? (
                <button 
                  onClick={() => setMarkupApplied(true)}
                  className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-sky-400 text-xs font-bold text-black transition-all cursor-pointer"
                >
                  Apply Optimized Markup
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                  <CheckCircle size={14} /> Markup Applied
                </span>
              )}
            </div>
          </div>

          {/* Component-level Breakdown */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-bold text-white">Component Price Breakdown</h3>
              <p className="text-xs text-gray-500 mt-0.5">Scraped OTA match equivalence details</p>
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
                      <span className="text-[10px] text-gray-500 mt-0.5">{comp.details}</span>
                      <span className="text-xs text-sky-400 font-semibold mt-1">€{comp.yourCostEur.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Match Arrow Icon */}
                  <div className="hidden md:block text-gray-600">
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
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      Confidence: <strong className="text-emerald-400">{comp.confidence}%</strong> ({comp.method})
                    </span>
                    <span className="text-xs text-amber-500 font-semibold mt-1">€{comp.scrapedCostEur.toLocaleString()}</span>
                  </div>

                  {/* Price comparison result */}
                  <div className="text-right flex flex-col items-start md:items-end justify-center min-w-[80px]">
                    <span className="text-xs font-bold text-emerald-400">
                      {comp.delta}%
                    </span>
                    <span className="text-[10px] text-gray-500">vs OTA price</span>
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
            <p className="text-[10px] text-gray-500 leading-relaxed">
              We leverage Torch Labs residential proxies to bypass OTA geofencing and anti-bot systems, ensuring the German market rates are identical to what travelers see from their browsers in Frankfurt.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
