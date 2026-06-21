"use client";

import React from "react";
import { Bell, Radio, Database, CloudLightning } from "lucide-react";

export default function TopBar() {
  return (
    <header className="h-20 border-b border-zinc-900 bg-black flex items-center justify-between px-8">
      
      {/* Search / System Indicator */}
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-white tracking-tight">
          Competitiveness Dashboard
        </h1>

        <div className="hidden md:flex items-center gap-4">
          <span className="h-4 w-px bg-zinc-800" />
          
          {/* Status Badge 1 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span>Proxy: <strong className="text-white">Active</strong></span>
          </div>

          {/* Status Badge 2 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CloudLightning size={14} className="text-sky-500" />
            <span>AI Matcher: <strong className="text-white">Idle</strong></span>
          </div>
        </div>
      </div>

      {/* Profile & Notifications */}
      <div className="flex items-center gap-4">
        
        {/* Notifications Icon */}
        <button className="relative p-2.5 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors text-gray-400 hover:text-white">
          <Bell size={16} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
        </button>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white">Aitken Spence Travels</span>
            <span className="text-[10px] text-gray-500 font-medium">Standard DMC Account</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            AS
          </div>
        </div>
      </div>
    </header>
  );
}
