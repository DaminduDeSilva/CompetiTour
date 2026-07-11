"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Plus, Trash2, MapPin, Calendar, DollarSign, 
  ChevronRight, Hotel, Navigation, Compass,
  CheckCircle2, AlertCircle, Sparkles, FolderHeart, ArrowLeft,
  CheckCircle, Play
} from "lucide-react";
import { fetchDashboardPackage, updateDashboardPackage } from "@/app/(dashboard)/dashboard/actions";
import Link from "next/link";

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? "1";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Basic Details
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(1);
  const [targetDate, setTargetDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [rooms, setRooms] = useState(1);

  // Live Exchange Rate
  const [exchangeRate, setExchangeRate] = useState(333);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.LKR) {
          setExchangeRate(data.rates.LKR);
        }
      })
      .catch(err => console.error("Failed to fetch live exchange rate", err));
  }, []);

  // Components List
  interface PackageComponent {
  uid: number;
  id?: number;
  type: string;
  name: string;
  price: number;
  currency: 'USD' | 'LKR';
  meta_data: any;
}
  const [components, setComponents] = useState<PackageComponent[]>([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetchDashboardPackage(id);
      if (res.data) {
        setName(res.data.name);
        setDestination(res.data.destination || "");
        setDuration(res.data.duration_days);
        setAdults(res.data.adults || 2);
        setChildrenCount(res.data.children || 0);
        setRooms(res.data.rooms || 1);
        
        if (res.data.target_date) {
          setTargetDate(res.data.target_date.split('T')[0]);
        }
        
        setComponents((res.data.components || []).map((c: any, i: number) => {
          let meta = c.meta_data || {};
          if (c.component_type === "hotel") {
            meta = {
              pricing_basis: "Per Room",
              room_type: "",
              nights: 1,
              meal_plan: "Bed & Breakfast",
              adults: res.data.adults || 2,
              children: res.data.children || 0,
              rooms: res.data.rooms || 1,
              ...meta
            };
          } else if (c.component_type === "excursion") {
            meta = {
              pricing_basis: "Per Pax",
              format: "Private",
              duration: "Half-Day",
              guide_language: "English",
              inclusions: { entrance_fees: false, meals_included: false, hotel_pickup: false },
              notes: "",
              ...meta
            };
          } else if (c.component_type === "transfer") {
            meta = {
              pricing_basis: "Per Vehicle",
              format: "Private",
              vehicle_type: "Minivan",
              route: "",
              ...meta
            };
          }
          return {
            uid: i + 1,
            id: c.id,
            type: c.component_type,
            name: c.name,
            price: c.base_price_lkr,
            currency: 'LKR',
            meta_data: meta
          };
        }));
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const removeComponent = (uid: number) => {
    setComponents(components.filter((c) => c.uid !== uid));
  };

  const addComponent = (type: string) => {
    const newUid = components.length > 0 ? Math.max(...components.map((c) => c.uid)) + 1 : 1;
    let initialMeta = {};
    if (type === "hotel") {
      initialMeta = { 
        pricing_basis: "Per Room", 
        room_type: "", 
        nights: 1, 
        meal_plan: "Bed & Breakfast",
        adults: 2,
        children: 0,
        rooms: 1
      };
    } else if (type === "excursion") {
      initialMeta = { pricing_basis: "Per Pax", format: "Private", duration: "Half-Day", guide_language: "English", inclusions: { entrance_fees: false, meals_included: false, hotel_pickup: false }, notes: "" };
    } else if (type === "transfer") {
      initialMeta = { pricing_basis: "Per Vehicle", format: "Private", vehicle_type: "Minivan", route: "" };
    }
    setComponents([...components, { uid: newUid, type, name: "", price: 0, currency: 'USD', meta_data: initialMeta }]);
  };

  // Derive total cost
  const totalUsd = components.reduce((acc, curr) => {
    if (curr.currency === 'LKR') return acc + ((curr.price || 0) / exchangeRate);
    return acc + (curr.price || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const firstHotel = components.find(c => c.type === "hotel");
      const payloadAdults = firstHotel?.meta_data?.adults ?? adults;
      const payloadChildren = firstHotel?.meta_data?.children ?? childrenCount;
      const payloadRooms = firstHotel?.meta_data?.rooms ?? rooms;

      const payload = {
        name,
        destination,
        target_date: targetDate ? new Date(targetDate).toISOString() : null,
        duration_days: duration,
        adults: payloadAdults,
        children: payloadChildren,
        rooms: payloadRooms,
        total_price_lkr: totalUsd * exchangeRate,
        components: components.map(c => ({
          ...(c.id ? { id: c.id } : {}),
          component_type: c.type,
          name: c.name,
          nights_or_duration: null,
          notes: null,
          meta_data: c.meta_data,
          base_price_lkr: c.currency === 'LKR' ? c.price : (c.price * exchangeRate),
        }))
      };

      const res = await updateDashboardPackage(id, payload);

      if (res.success && res.data) {
        setComponents((res.data.components || []).map((c: any, i: number) => {
          let meta = c.meta_data || {};
          if (c.component_type === "hotel") {
            meta = {
              pricing_basis: "Per Room",
              room_type: "",
              nights: 1,
              meal_plan: "Bed & Breakfast",
              adults: res.data.adults || 2,
              children: res.data.children || 0,
              rooms: res.data.rooms || 1,
              ...meta
            };
          } else if (c.component_type === "excursion") {
            meta = {
              pricing_basis: "Per Pax",
              format: "Private",
              duration: "Half-Day",
              guide_language: "English",
              inclusions: { entrance_fees: false, meals_included: false, hotel_pickup: false },
              notes: "",
              ...meta
            };
          } else if (c.component_type === "transfer") {
            meta = {
              pricing_basis: "Per Vehicle",
              format: "Private",
              vehicle_type: "Minivan",
              route: "",
              ...meta
            };
          }
          return {
            uid: i + 1,
            id: c.id,
            type: c.component_type,
            name: c.name,
            price: c.base_price_lkr,
            currency: 'LKR',
            meta_data: meta
          };
        }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert("Failed to save package: " + res.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving package");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64 text-gray-400">Loading package...</div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-6">
        <Link href="/packages" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={16} />
          <span>Back to Packages</span>
        </Link>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl transition-all">
              <CheckCircle size={13} /> Saved successfully
            </span>
          )}
          <Link href={`/packages/${id}/analyze`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-400 hover:bg-sky-500/20 transition-colors">
            <Play size={13} /> Run Audit
          </Link>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-indigo-400 flex items-center gap-3 ml-4 border-l border-white/10 pl-4">
            <FolderHeart size={22} className="text-sky-400" />
            Editing Package
          </h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left: Form Sections */}
        <div className="xl:col-span-8 flex flex-col gap-12">
          
          {/* Section 1: Basic Details */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
              <MapPin size={24} className="text-sky-400" />
              Package Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
              {/* Package Name */}
              <div className="flex flex-col gap-2 relative group col-span-1 md:col-span-2">
                <label className="text-[11px] font-bold text-sky-200/70 uppercase tracking-widest transition-colors group-focus-within:text-sky-400">Package Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Luxury Alpine Escape"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 outline-none transition-all"
                />
              </div>

              {/* Destination */}
              <div className="flex flex-col gap-2 relative group">
                <label className="text-[11px] font-bold text-sky-200/70 uppercase tracking-widest transition-colors group-focus-within:text-sky-400">Destination</label>
                <input 
                  type="text" 
                  value={destination} 
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Swiss Alps"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 outline-none transition-all"
                />
              </div>

              {/* Target Date */}
              <div className="flex flex-col gap-2 relative group">
                <label className="text-[11px] font-bold text-sky-200/70 uppercase tracking-widest transition-colors group-focus-within:text-sky-400">Target Check-In Date (Optional)</label>
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:bg-white/10 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 outline-none transition-all [color-scheme:dark]"
                />
              </div>

              {/* Duration (Days) */}
              <div className="flex flex-col gap-2 relative group">
                <label className="text-[11px] font-bold text-sky-200/70 uppercase tracking-widest transition-colors group-focus-within:text-sky-400">Duration (Days)</label>
                <input 
                  type="number" 
                  min="1"
                  value={duration} 
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-600 focus:bg-white/10 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Components Config */}
          <div className="flex flex-col gap-6 mt-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <Compass size={24} className="text-indigo-400" />
                Package Inclusions
              </h3>
            </div>

            {/* Component Adds (Premium Inline Action) */}
            <div className="flex flex-wrap gap-4 mt-4">
              <button 
                type="button"
                onClick={() => addComponent("hotel")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Hotel size={16} /> Add Hotel
              </button>
              <button 
                type="button"
                onClick={() => addComponent("excursion")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Compass size={16} /> Add Activity
              </button>
              <button 
                type="button"
                onClick={() => addComponent("transfer")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <Navigation size={16} /> Add Transfer
              </button>
            </div>

            {/* List of Components - Fluid Rows instead of Boxes */}
            <div className="flex flex-col mt-4 min-h-[300px]">
              {components.length === 0 && (
                <div className="py-8 flex flex-col items-start opacity-40">
                  <p className="text-sm font-bold text-white tracking-wide">No inclusions added</p>
                  <p className="text-xs text-zinc-500 mt-1">Select an option above to build your package inclusions.</p>
                </div>
              )}
              {components.map((comp, idx) => (
                <div key={comp.uid} className="p-6 rounded-2xl bg-[#0a0a0e]/40 border border-white/5 flex flex-col gap-6 group relative overflow-hidden transition-all hover:bg-[#0a0a0e]/60 hover:border-white/10 mb-4">
                  
                  {/* Accent Color Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    comp.type === "hotel" ? "bg-sky-500" :
                    comp.type === "excursion" ? "bg-emerald-500" :
                    "bg-purple-500"
                  }`} />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        comp.type === "hotel" 
                          ? "bg-sky-500/10 border-sky-500/20 text-sky-400" 
                          : comp.type === "excursion"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      }`}>
                        {comp.type === "hotel" ? <Hotel size={14} /> : comp.type === "excursion" ? <Compass size={14} /> : <Navigation size={14} />}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-300">
                        {comp.type}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeComponent(comp.uid)}
                      className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col gap-6">
                                          {/* HOTEL COMPONENT */}
                                          {comp.type === "hotel" && (
                                            <>
                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-8 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Hotel Name</label>
                                                  <input type="text" value={comp.name} placeholder="e.g. Marino Beach" onChange={(e) => {
                                                    const updated = [...components]; updated[idx].name = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none" />
                                                </div>
                                                
                                                {/* Base Price (Row 1) */}
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">
                                                    Price ({comp.meta_data.pricing_basis})
                                                  </label>
                                                  <div className="relative">
                                                    <button type="button" onClick={() => {
                                                       const updated = [...components]; updated[idx].currency = comp.currency === 'USD' ? 'LKR' : 'USD'; setComponents(updated);
                                                    }} className="absolute left-1 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-xs font-black text-white/80 transition-colors z-10">
                                                      {comp.currency === 'USD' ? '$' : 'Rs'} <span className="text-[8px] opacity-50">▾</span>
                                                    </button>
                                                    <input type="number" min="0" value={comp.price || ""} placeholder="0.00" onChange={(e) => {
                                                      const updated = [...components]; updated[idx].price = Number(e.target.value); setComponents(updated);
                                                    }} className="w-full pl-10 pr-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none transition-all" />
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Room Type</label>
                                                  <input type="text" value={comp.meta_data.room_type} placeholder="e.g. Deluxe Double" onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.room_type = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none" />
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Nights</label>
                                                  <input type="number" min="1" value={comp.meta_data.nights} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.nights = Number(e.target.value); setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none" />
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Meal Plan</label>
                                                  <select value={comp.meta_data.meal_plan} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.meal_plan = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none appearance-none">
                                                    <option value="Room Only" className="bg-[#0a0a0e]">Room Only</option>
                                                    <option value="Bed & Breakfast" className="bg-[#0a0a0e]">Bed & Breakfast</option>
                                                    <option value="Half Board" className="bg-[#0a0a0e]">Half Board</option>
                                                    <option value="Full Board" className="bg-[#0a0a0e]">Full Board</option>
                                                    <option value="All Inclusive" className="bg-[#0a0a0e]">All Inclusive</option>
                                                  </select>
                                                </div>
                                              </div>

                                              {/* Occupancy (Row 3) */}
                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-2">
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Adults</label>
                                                  <input type="number" min="1" value={comp.meta_data.adults || 2} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data = { ...updated[idx].meta_data, adults: Number(e.target.value) }; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none" />
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Children</label>
                                                  <input type="number" min="0" value={comp.meta_data.children || 0} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data = { ...updated[idx].meta_data, children: Number(e.target.value) }; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none" />
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-sky-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-sky-400">Rooms</label>
                                                  <input type="number" min="1" value={comp.meta_data.rooms || 1} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data = { ...updated[idx].meta_data, rooms: Number(e.target.value) }; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-sky-400 outline-none" />
                                                </div>
                                              </div>
                                            </>
                                          )}

                                          {/* TRANSFER COMPONENT */}
                                          {comp.type === "transfer" && (
                                            <>
                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-8 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-purple-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-purple-400">Transfer Name</label>
                                                  <input type="text" value={comp.name} placeholder="e.g. Airport Pickup" onChange={(e) => {
                                                    const updated = [...components]; updated[idx].name = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-400 outline-none" />
                                                </div>

                                                {/* Base Price (Row 1) */}
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-purple-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-purple-400">
                                                    Price ({comp.meta_data.pricing_basis})
                                                  </label>
                                                  <div className="relative">
                                                    <button type="button" onClick={() => {
                                                       const updated = [...components]; updated[idx].currency = comp.currency === 'USD' ? 'LKR' : 'USD'; setComponents(updated);
                                                    }} className="absolute left-1 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-xs font-black text-white/80 transition-colors z-10">
                                                      {comp.currency === 'USD' ? '$' : 'Rs'} <span className="text-[8px] opacity-50">▾</span>
                                                    </button>
                                                    <input type="number" min="0" value={comp.price || ""} placeholder="0.00" onChange={(e) => {
                                                      const updated = [...components]; updated[idx].price = Number(e.target.value); setComponents(updated);
                                                    }} className="w-full pl-10 pr-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-400 outline-none transition-all" />
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-purple-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-purple-400">Route</label>
                                                  <input type="text" value={comp.meta_data.route} placeholder="e.g. CMB to Colombo" onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.route = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-400 outline-none" />
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-purple-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-purple-400">Vehicle Type</label>
                                                  <select value={comp.meta_data.vehicle_type} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.vehicle_type = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-400 outline-none appearance-none">
                                                    <option value="Car" className="bg-[#0a0a0e]">Car</option>
                                                    <option value="Minivan" className="bg-[#0a0a0e]">Minivan</option>
                                                    <option value="SUV" className="bg-[#0a0a0e]">SUV</option>
                                                    <option value="Coach Bus" className="bg-[#0a0a0e]">Coach Bus</option>
                                                    <option value="Tuk-Tuk" className="bg-[#0a0a0e]">Tuk-Tuk</option>
                                                  </select>
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-purple-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-purple-400">Format</label>
                                                  <select value={comp.meta_data.format} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.format = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-purple-400 outline-none appearance-none">
                                                    <option value="Private" className="bg-[#0a0a0e]">Private</option>
                                                    <option value="SIC (Shared)" className="bg-[#0a0a0e]">SIC (Shared)</option>
                                                  </select>
                                                </div>
                                              </div>
                                            </>
                                          )}

                                          {/* EXCURSION COMPONENT */}
                                          {comp.type === "excursion" && (
                                            <>
                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-8 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-emerald-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-emerald-400">Activity Name</label>
                                                  <input type="text" value={comp.name} placeholder="e.g. City Tour" onChange={(e) => {
                                                    const updated = [...components]; updated[idx].name = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-400 outline-none" />
                                                </div>

                                                {/* Base Price (Row 1) */}
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-emerald-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-emerald-400">
                                                    Price ({comp.meta_data.pricing_basis})
                                                  </label>
                                                  <div className="relative">
                                                    <button type="button" onClick={() => {
                                                       const updated = [...components]; updated[idx].currency = comp.currency === 'USD' ? 'LKR' : 'USD'; setComponents(updated);
                                                    }} className="absolute left-1 top-1/2 -translate-y-1/2 px-2 py-1.5 rounded-lg hover:bg-white/10 text-xs font-black text-white/80 transition-colors z-10">
                                                      {comp.currency === 'USD' ? '$' : 'Rs'} <span className="text-[8px] opacity-50">▾</span>
                                                    </button>
                                                    <input type="number" min="0" value={comp.price || ""} placeholder="0.00" onChange={(e) => {
                                                      const updated = [...components]; updated[idx].price = Number(e.target.value); setComponents(updated);
                                                    }} className="w-full pl-10 pr-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-400 outline-none transition-all" />
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-emerald-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-emerald-400">Format</label>
                                                  <select value={comp.meta_data.format} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.format = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-400 outline-none appearance-none">
                                                    <option value="Private" className="bg-[#0a0a0e]">Private</option>
                                                    <option value="SIC (Shared)" className="bg-[#0a0a0e]">SIC (Shared)</option>
                                                  </select>
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-emerald-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-emerald-400">Duration</label>
                                                  <select value={comp.meta_data.duration} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.duration = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-400 outline-none appearance-none">
                                                    <option value="< 2 Hours" className="bg-[#0a0a0e]">&lt; 2 Hours</option>
                                                    <option value="Half-Day" className="bg-[#0a0a0e]">Half-Day</option>
                                                    <option value="Full-Day" className="bg-[#0a0a0e]">Full-Day</option>
                                                    <option value="Multi-Day" className="bg-[#0a0a0e]">Multi-Day</option>
                                                  </select>
                                                </div>
                                                <div className="md:col-span-4 flex flex-col gap-2 relative group">
                                                  <label className="text-[11px] text-emerald-200/70 uppercase font-bold tracking-widest transition-colors group-focus-within:text-emerald-400">Guide</label>
                                                  <select value={comp.meta_data.guide_language} onChange={(e) => {
                                                    const updated = [...components]; updated[idx].meta_data.guide_language = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-emerald-400 outline-none appearance-none">
                                                    <option value="None" className="bg-[#0a0a0e]">None</option>
                                                    <option value="Driver-Guide" className="bg-[#0a0a0e]">Driver-Guide</option>
                                                    <option value="English" className="bg-[#0a0a0e]">English Guide</option>
                                                    <option value="German" className="bg-[#0a0a0e]">German Guide</option>
                                                    <option value="Russian" className="bg-[#0a0a0e]">Russian Guide</option>
                                                    <option value="French" className="bg-[#0a0a0e]">French Guide</option>
                                                    <option value="Other" className="bg-[#0a0a0e]">Other</option>
                                                  </select>
                                                </div>

                                                {/* Excursion Toggles & Notes */}
                                                <div className="md:col-span-12 flex flex-col gap-4 bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
                                                  <div className="flex items-center gap-6">
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-emerald-100">
                                                      <input type="checkbox" checked={comp.meta_data.inclusions?.entrance_fees || false} onChange={(e) => {
                                                        const updated = [...components]; updated[idx].meta_data.inclusions = {...updated[idx].meta_data.inclusions, entrance_fees: e.target.checked}; setComponents(updated);
                                                      }} className="w-4 h-4 rounded accent-emerald-500 bg-white/10 border-white/20" />
                                                      Entrance Fees Included
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-emerald-100">
                                                      <input type="checkbox" checked={comp.meta_data.inclusions?.meals_included || false} onChange={(e) => {
                                                        const updated = [...components]; updated[idx].meta_data.inclusions = {...updated[idx].meta_data.inclusions, meals_included: e.target.checked}; setComponents(updated);
                                                      }} className="w-4 h-4 rounded accent-emerald-500 bg-white/10 border-white/20" />
                                                      Meals/Snacks Included
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-emerald-100">
                                                      <input type="checkbox" checked={comp.meta_data.inclusions?.hotel_pickup || false} onChange={(e) => {
                                                        const updated = [...components]; updated[idx].meta_data.inclusions = {...updated[idx].meta_data.inclusions, hotel_pickup: e.target.checked}; setComponents(updated);
                                                      }} className="w-4 h-4 rounded accent-emerald-500 bg-white/10 border-white/20" />
                                                      Hotel Pickup/Drop-off
                                                    </label>
                                                  </div>
                                                  <input type="text" value={comp.meta_data.notes || ''} placeholder="Additional notes (e.g. Sigiriya ticket excluded)..." onChange={(e) => {
                                                     const updated = [...components]; updated[idx].meta_data.notes = e.target.value; setComponents(updated);
                                                  }} className="w-full px-4 py-2.5 rounded-lg bg-[#0a0a0e]/50 border border-white/10 text-sm text-white focus:border-emerald-400 outline-none" />
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Floating Glass Summary Card */}
        <div className="xl:col-span-4 flex flex-col gap-6 sticky top-24">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-[#0f172a]/90 to-[#0a0a0e]/90 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
            {/* Internal glowing orb */}
            <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-sky-500/20 rounded-full blur-[50px] pointer-events-none" />
            
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-black text-white">Package Summary</h3>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                1 USD = {exchangeRate.toFixed(2)} LKR
              </div>
            </div>
            <p className="text-xs text-sky-200/70 font-medium mb-6 line-clamp-1">{name || "Untitled Package"}</p>

            <div className="flex flex-col gap-4 text-sm text-gray-300 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Duration</span>
                <span className="font-bold text-white">{duration} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Destination</span>
                <span className="font-bold text-white text-right truncate max-w-[120px]">{destination || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Inclusions</span>
                <span className="font-bold text-white">{components.length}</span>
              </div>
            </div>

            {/* Massive Total Price Display */}
            <div className="flex flex-col gap-1 mb-8 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400">Total Price</span>
              <div className="flex flex-col">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 drop-shadow-[0_0_10px_rgba(125,211,252,0.3)] tabular-nums tracking-tight">
                  ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xl text-sky-200/50">USD</span>
                </span>
                <span className="text-xs font-bold text-sky-300/40 mt-1">
                  ≈ {(totalUsd * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })} LKR
                </span>
              </div>
            </div>

            {/* Subtotals (Optional breakdown for premium feel) */}
            {components.length > 0 && (
              <div className="flex flex-col gap-2 mb-8 pt-6 border-t border-white/5 text-xs">
                {components.filter(c => c.type === 'hotel').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Accommodation</span>
                    <span className="text-white">${components.filter(c => c.type === 'hotel').reduce((a, b) => a + (b.currency === 'LKR' ? (b.price||0)/exchangeRate : (b.price||0)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                {components.filter(c => c.type === 'excursion').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Activities</span>
                    <span className="text-white">${components.filter(c => c.type === 'excursion').reduce((a, b) => a + (b.currency === 'LKR' ? (b.price||0)/exchangeRate : (b.price||0)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                {components.filter(c => c.type === 'transfer').length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transfers</span>
                    <span className="text-white">${components.filter(c => c.type === 'transfer').reduce((a, b) => a + (b.currency === 'LKR' ? (b.price||0)/exchangeRate : (b.price||0)), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button 
              type="submit"
              disabled={saving || components.length === 0 || !name}
              className="relative w-full group overflow-hidden rounded-xl bg-indigo-600 p-[1px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 bg-zinc-950 rounded-xl group-hover:bg-opacity-0 transition-all duration-300">
                <span className="text-sm font-bold text-white tracking-wide">
                  {saving ? "Saving Changes..." : "Save Changes"}
                </span>
                <ChevronRight size={16} className="text-sky-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
