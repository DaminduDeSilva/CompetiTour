"use client";

import React, { useState } from "react";
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
  TrendingUp
} from "lucide-react";

// Mock packages data
const initialPackages = [
  {
    id: 1,
    name: "Classic Sri Lanka Tour - 10 Days",
    destination: "Sri Lanka",
    priceLkr: 1250000,
    priceUsd: 4100,
    status: "competitive",
    markets: {
      de: { price: 4420, delta: -7.2, status: "competitive" },
      gb: { price: 3980, delta: 3.0, status: "at_risk" },
      au: { price: 5410, delta: -24.2, status: "underpriced" }
    }
  },
  {
    id: 2,
    name: "Cultural Triangle & Beach - 7 Days",
    destination: "Sri Lanka",
    priceLkr: 980000,
    priceUsd: 3200,
    status: "at_risk",
    markets: {
      de: { price: 3100, delta: 3.2, status: "at_risk" },
      gb: { price: 3480, delta: -8.0, status: "competitive" },
      au: { price: 4200, delta: -23.8, status: "underpriced" }
    }
  },
  {
    id: 3,
    name: "Adventure & Wildlife Safari - 12 Days",
    destination: "Sri Lanka",
    priceLkr: 1850000,
    priceUsd: 6050,
    status: "underpriced",
    markets: {
      de: { price: 7120, delta: -20.5, status: "underpriced" },
      gb: { price: 7800, delta: -22.4, status: "underpriced" },
      au: { price: 8200, delta: -26.2, status: "underpriced" }
    }
  },
  {
    id: 4,
    name: "Luxury Boutique Getaway - 5 Days",
    destination: "Sri Lanka",
    priceLkr: 1500000,
    priceUsd: 4900,
    status: "competitive",
    markets: {
      de: { price: 5400, delta: -9.2, status: "competitive" },
      gb: { price: 5350, delta: -8.4, status: "competitive" },
      au: { price: 6100, delta: -19.6, status: "competitive" }
    }
  }
];

export default function DashboardPage() {
  const [packages, setPackages] = useState(initialPackages);

  const getStatusBadge = (status: string, delta: number) => {
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
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-sky-400" />
            AI Pricing Audit Insights
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            We detected <strong className="text-sky-400">1 package</strong> at risk of losing bookings in Germany, and <strong className="text-emerald-400">1 package</strong> experiencing severe margin leakage.
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
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Competitive Ratio</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Percent size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">50.0%</div>
            <div className="text-xs text-gray-300 mt-1">2 of 4 packages optimized in Germany</div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">At Risk Packages</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-yellow-400">1</div>
            <div className="text-xs text-gray-300 mt-1">Higher priced than OTA assembly</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Margin Leakages</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <TrendingDown size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-400">1</div>
            <div className="text-xs text-gray-300 mt-1">Underpriced by &gt; 20% vs market</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Proxy Scrapes (24h)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Radio size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-emerald-400">1,420</div>
            <div className="text-xs text-gray-300 mt-1">98.4% success (Torch Labs ISP)</div>
          </div>
        </div>
      </div>

      {/* Main Section Grid: Chart & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Market Comparison Trend</h3>
              <p className="text-xs text-gray-300 mt-0.5">Classic Sri Lanka Tour - Germany Market (EUR)</p>
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
                <span className="text-gray-300">Your DMC Rate (€3,850 avg)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span className="text-gray-300">Booking.com / Agoda (€4,150 avg)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Source list */}
        <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col justify-between">
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
      <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
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
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-zinc-900/20 transition-all">
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{pkg.name}</span>
                      <span className="text-xs text-gray-300 mt-0.5">{pkg.destination}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-300 font-semibold">
                    LKR {pkg.priceLkr.toLocaleString()}
                  </td>
                  <td className="py-4">
                    {getStatusBadge(pkg.markets.de.status, pkg.markets.de.delta)}
                  </td>
                  <td className="py-4">
                    {getStatusBadge(pkg.markets.gb.status, pkg.markets.gb.delta)}
                  </td>
                  <td className="py-4">
                    {getStatusBadge(pkg.markets.au.status, pkg.markets.au.delta)}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link 
                        href={`/packages/${pkg.id}/analyze`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-sky-300 border border-sky-400/20 bg-sky-400/5 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Radio size={12} className="animate-pulse" />
                        <span>Run Audit</span>
                      </Link>
                      <Link 
                        href={`/reports/${pkg.id}/history`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Eye size={12} />
                        <span>History</span>
                      </Link>
                    </div>
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
