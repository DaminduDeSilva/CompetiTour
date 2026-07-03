"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  ChevronRight,
  Hotel,
  Navigation,
  Compass
} from "lucide-react";
import { createDashboardPackage } from "@/app/dashboard/actions";

export default function NewPackagePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // Basic Details
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(1);
  const [totalPriceLkr, setTotalPriceLkr] = useState(0);

  // Components List
  const [components, setComponents] = useState<{ id: number; type: string; name: string; details: string; cost: number }[]>([]);

  const removeComponent = (id: number) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  const addComponent = (type: string) => {
    const newId = components.length > 0 ? Math.max(...components.map((c) => c.id)) + 1 : 1;
    setComponents([...components, { id: newId, type, name: "", details: "", cost: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        destination,
        duration_days: duration,
        total_price_lkr: totalPriceLkr,
        components: components.map(c => ({
          component_type: c.type,
          name: c.name,
          nights_or_duration: c.details,
          base_price_lkr: c.cost,
        }))
      };

      const res = await createDashboardPackage(payload);

      if (res.success) {
        // Route back to dashboard since audit feature is pending backend implementation
        router.push(`/dashboard`);
      } else {
        alert("Failed to save package");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Create New Package</h2>
        <p className="text-xs text-gray-300 mt-1">Configure itinerary components for vertical price intelligence analysis</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Details & Components */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card 1: Basic Details */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin size={16} className="text-sky-400" />
              Itinerary Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Package Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Package Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>

              {/* Destination */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Destination</label>
                <input 
                  type="text" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>

              {/* Duration (Days) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Duration (Days)</label>
                <input 
                  type="number" 
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>

              {/* Total Cost LKR */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Target Base Price (LKR)</label>
                <input 
                  type="number" 
                  value={totalPriceLkr} 
                  onChange={(e) => setTotalPriceLkr(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-sm focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Components Config */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass size={16} className="text-emerald-400" />
                Itinerary Component Stack
              </h3>
              
              {/* Component Adds */}
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => addComponent("hotel")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 border border-sky-400/20 bg-sky-400/5 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Hotel size={12} />
                  <span>+ Hotel</span>
                </button>
                <button 
                  type="button"
                  onClick={() => addComponent("excursion")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Compass size={12} />
                  <span>+ Activity</span>
                </button>
                <button 
                  type="button"
                  onClick={() => addComponent("transfer")}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 border border-purple-400/20 bg-purple-400/5 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Navigation size={12} />
                  <span>+ Transfer</span>
                </button>
              </div>
            </div>

            {/* List of Components */}
            <div className="flex flex-col gap-3 mt-2">
              {components.map((comp, idx) => (
                <div key={comp.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/10 flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon indicator */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                      comp.type === "hotel" 
                        ? "bg-sky-500/10 border-sky-500/20 text-sky-400" 
                        : comp.type === "excursion"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                    }`}>
                      {comp.type === "hotel" ? <Hotel size={16} /> : comp.type === "excursion" ? <Compass size={16} /> : <Navigation size={16} />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      {/* Name */}
                      <input 
                        type="text" 
                        value={comp.name} 
                        placeholder="Component name..."
                        onChange={(e) => {
                          const updated = [...components];
                          updated[idx].name = e.target.value;
                          setComponents(updated);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-black text-xs text-white focus:outline-none"
                      />
                      {/* Details */}
                      <input 
                        type="text" 
                        value={comp.details} 
                        placeholder="Details (nights, description)..."
                        onChange={(e) => {
                          const updated = [...components];
                          updated[idx].details = e.target.value;
                          setComponents(updated);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-black text-xs text-white focus:outline-none"
                      />
                      {/* Cost */}
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[10px] text-gray-300 font-bold uppercase">LKR</span>
                        <input 
                          type="number" 
                          value={comp.cost} 
                          placeholder="Cost LKR..."
                          onChange={(e) => {
                            const updated = [...components];
                            updated[idx].cost = Number(e.target.value);
                            setComponents(updated);
                          }}
                          className="w-full pl-10 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-black text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => removeComponent(comp.id)}
                    className="p-2 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-500/5 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Summary: Review & Run */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
            <h3 className="text-sm font-bold text-white">Itinerary Summary</h3>

            {/* Calculations */}
            <div className="flex flex-col gap-3.5 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="text-white font-bold">{duration} Days</span>
              </div>
              <div className="flex justify-between">
                <span>Stack Count</span>
                <span className="text-white font-bold">{components.length} Components</span>
              </div>
              <span className="h-px bg-zinc-800" />
              <div className="flex justify-between text-sm">
                <span className="text-white font-bold">Sum of Parts</span>
                <span className="text-white font-black">
                  LKR {components.reduce((acc, curr) => acc + curr.cost, 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* CTA */}
            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-bold text-white shadow-xl shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>{loading ? "Saving..." : "Save & Proceed to Audit"}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
