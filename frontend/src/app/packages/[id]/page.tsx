"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import {
  FolderHeart, ArrowLeft, Edit3, Play, Trash2,
  Hotel, Map, Car, Save, CheckCircle, AlertTriangle
} from "lucide-react";

// TODO(backend): Fetch from GET /packages/{id}
const packageData: Record<string, {
  id: number; name: string; duration: string; priceLkr: number; priceUsd: number;
  status: string; description: string; markets: string[]; platforms: string[];
  proxyType: string;
  itinerary: { type: string; name: string; details: string; costEur: number }[];
}> = {
  "1": {
    id: 1, name: "Classic Sri Lanka Tour", duration: "10 Days", priceLkr: 1250000, priceUsd: 4100,
    status: "competitive", description: "A comprehensive tour covering Sigiriya, Kandy, Nuwara Eliya, and Galle Fort.",
    markets: ["DE", "GB", "AU"], platforms: ["Booking.com", "Agoda"], proxyType: "residential",
    itinerary: [
      { type: "hotel", name: "Heritance Kandalama", details: "3 Nights - Superior Room", costEur: 780 },
      { type: "hotel", name: "Ceylon Tea Trails", details: "2 Nights - Bungalow Suite", costEur: 920 },
      { type: "excursion", name: "Sigiriya Rock Fortress", details: "Full Day Private Tour", costEur: 180 },
      { type: "transfer", name: "Airport & Inter-city Transfers", details: "Private Premium Van", costEur: 220 },
    ],
  },
  "2": {
    id: 2, name: "Cultural Triangle & Beach", duration: "7 Days", priceLkr: 980000, priceUsd: 3200,
    status: "at_risk", description: "Polonnaruwa, Dambulla cave temples, and Mirissa beach.",
    markets: ["DE", "GB"], platforms: ["Booking.com", "Expedia"], proxyType: "isp",
    itinerary: [
      { type: "hotel", name: "Amaya Lake", details: "3 Nights - Deluxe Room", costEur: 640 },
      { type: "hotel", name: "Mirissa Hills", details: "2 Nights - Pool Villa", costEur: 780 },
      { type: "excursion", name: "Whale Watching Mirissa", details: "Half Day Tour", costEur: 120 },
      { type: "transfer", name: "Colombo – Dambulla – Mirissa", details: "Private Van", costEur: 160 },
    ],
  },
  "3": {
    id: 3, name: "Adventure & Wildlife Safari", duration: "12 Days", priceLkr: 1850000, priceUsd: 6050,
    status: "underpriced", description: "Yala, Udawalawe, and Knuckles mountain range adventure.",
    markets: ["DE", "GB", "AU"], platforms: ["Booking.com", "Agoda", "Viator"], proxyType: "residential",
    itinerary: [
      { type: "hotel", name: "Cinnamon Wild Yala", details: "3 Nights - Deluxe Room", costEur: 1850 },
      { type: "hotel", name: "Cape Weligama", details: "4 Nights - Ocean Villa", costEur: 3100 },
      { type: "excursion", name: "Yala National Park Safari", details: "Half-Day Private Jeep Tour", costEur: 410 },
      { type: "transfer", name: "Southern Transfers Package", details: "Private Premium Van", costEur: 300 },
    ],
  },
  "4": {
    id: 4, name: "Luxury Boutique Getaway", duration: "5 Days", priceLkr: 1500000, priceUsd: 4900,
    status: "competitive", description: "Ultra-premium boutique experience at Amanwella and Cape Weligama.",
    markets: ["DE", "FR"], platforms: ["Booking.com", "Agoda"], proxyType: "residential",
    itinerary: [
      { type: "hotel", name: "Amanwella", details: "3 Nights - Pool Terrace Suite", costEur: 2800 },
      { type: "excursion", name: "Private Whale Watching Charter", details: "Full Day", costEur: 480 },
      { type: "transfer", name: "Luxury Chauffeur Service", details: "Mercedes V-Class", costEur: 380 },
    ],
  },
  "5": {
    id: 5, name: "Hill Country & Tea Trails", duration: "8 Days", priceLkr: 1100000, priceUsd: 3580,
    status: "pending", description: "Nuwara Eliya, Ella, and tea plantation experiences.",
    markets: ["GB", "AU"], platforms: ["Booking.com"], proxyType: "isp",
    itinerary: [
      { type: "hotel", name: "Ceylon Tea Trails", details: "2 Nights - Bungalow", costEur: 920 },
      { type: "hotel", name: "98 Acres Resort Ella", details: "2 Nights - Garden Suite", costEur: 480 },
      { type: "excursion", name: "Scenic Train Ella to Kandy", details: "First Class", costEur: 90 },
      { type: "transfer", name: "Hill Country Circuit Transfers", costEur: 200, details: "Private Van" },
    ],
  },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  competitive: { label: "Competitive", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  at_risk:     { label: "At Risk",     color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  underpriced: { label: "Leakage",     color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  pending:     { label: "Pending",     color: "text-gray-400 bg-zinc-800 border-zinc-700" },
};

const typeIcon: Record<string, React.ReactNode> = {
  hotel: <Hotel size={14} />,
  excursion: <Map size={14} />,
  transfer: <Car size={14} />,
};

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "1";
  const pkg = packageData[id] ?? packageData["1"];

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pkg.name);
  const [desc, setDesc] = useState(pkg.description);
  const [saved, setSaved] = useState(false);
  const sc = statusConfig[pkg.status];

  // TODO(backend): PUT /packages/{id} with updated fields
  const handleSave = () => {
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const totalEur = pkg.itinerary.reduce((a, c) => a + c.costEur, 0);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <Link href="/packages" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span>Back to Packages</span>
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
              <CheckCircle size={13} /> Saved
            </span>
          )}
          {editing ? (
            <button onClick={handleSave} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-black transition-colors cursor-pointer">
              <Save size={13} /> Save Changes
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">
              <Edit3 size={13} /> Edit Package
            </button>
          )}
          <Link href={`/packages/${id}/analyze`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition-colors">
            <Play size={13} /> Run Audit
          </Link>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
          <FolderHeart size={22} />
        </div>
        <div className="flex-1">
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full text-xl font-bold text-white bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 focus:border-sky-500 focus:outline-none" />
          ) : (
            <h2 className="text-xl font-bold text-white">{name}</h2>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${sc.color}`}>{sc.label}</span>
            <span className="text-xs text-gray-500">{pkg.duration} · ${pkg.priceUsd.toLocaleString()} USD · LKR {pkg.priceLkr.toLocaleString()}</span>
          </div>
          {editing ? (
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className="w-full mt-2 text-sm text-gray-400 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 focus:border-sky-500 focus:outline-none resize-none" />
          ) : (
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white">Package Components</h3>
          <div className="flex flex-col gap-3">
            {pkg.itinerary.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                    {typeIcon[item.type]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-[11px] text-gray-500">{item.details}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-white">€{item.costEur.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total DMC Cost</span>
            <span className="text-lg font-black text-white">€{totalEur.toLocaleString()}</span>
          </div>
        </div>

        {/* Audit Config */}
        <div className="flex flex-col gap-4">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Audit Configuration</h3>
            <div className="flex flex-col gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-1.5 font-semibold uppercase tracking-wider text-[10px]">Target Markets</p>
                <div className="flex gap-2 flex-wrap">
                  {pkg.markets.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-bold text-[11px]">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-gray-500 mb-1.5 font-semibold uppercase tracking-wider text-[10px]">OTA Platforms</p>
                <div className="flex gap-2 flex-wrap">
                  {pkg.platforms.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-gray-300">{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Proxy Type</span>
                <span className="font-semibold text-white capitalize">{pkg.proxyType === "residential" ? "Premium Residential" : "ISP Sticky"}</span>
              </div>
            </div>
          </div>

          {pkg.status === "underpriced" && (
            <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-3">
              <AlertTriangle size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Margin Leakage Detected</p>
                <p className="text-[10px] text-gray-500 mt-0.5">This package is significantly underpriced vs. OTA market rates. Run an audit to see the full breakdown.</p>
              </div>
            </div>
          )}

          {/* TODO(backend): DELETE /packages/{id} — soft delete */}
          <button
            onClick={() => { if(confirm("Archive this package?")) router.push("/packages"); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 hover:border-red-500/30 text-xs font-bold text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Archive Package</span>
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
