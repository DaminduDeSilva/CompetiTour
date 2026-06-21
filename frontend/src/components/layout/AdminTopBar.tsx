"use client";
import React from "react";
import { Bell, Activity, Shield } from "lucide-react";

export default function AdminTopBar() {
  return (
    <header className="h-20 border-b border-red-900/30 bg-black flex items-center justify-between px-8">
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-white tracking-tight">Platform Administration</h1>
        <div className="hidden md:flex items-center gap-4">
          <span className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span>Platform: <strong className="text-white">Operational</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Shield size={14} className="text-red-400" />
            <span>Role: <strong className="text-red-400">Admin</strong></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2.5 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors text-gray-400 hover:text-white">
          <Bell size={16} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white">ZeroTrace Admin</span>
            <span className="text-[10px] text-red-400 font-medium">Platform Owner</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-500 to-rose-700 flex items-center justify-center font-bold text-white text-xs">
            ZT
          </div>
        </div>
      </div>
    </header>
  );
}
