"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Radio, CloudLightning, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

// TODO(backend): Fetch from GET /notifications?limit=5&unread=true
const previewNotifications = [
  { id: 1, type: "leakage",        title: "Margin Leakage",    body: "Adventure & Wildlife Safari underpriced 20.5% in DE",   time: "2m ago",  read: false },
  { id: 2, type: "audit_complete", title: "Audit Complete",    body: "Cultural Triangle & Beach — At Risk (+3.2%) in DE",      time: "14m ago", read: false },
  { id: 3, type: "at_risk",        title: "Package At Risk",   body: "Classic Sri Lanka Tour +3.0% above OTA price in GB",    time: "1h ago",  read: true  },
];

const typeIcon: Record<string, React.ReactNode> = {
  leakage:       <TrendingDown size={13} className="text-blue-400" />,
  at_risk:       <AlertTriangle size={13} className="text-yellow-400" />,
  audit_complete:<CheckCircle size={13} className="text-emerald-400" />,
};

export default function TopBar() {
  const pathname = usePathname();
  const isAnalyzing = pathname?.includes("/analyze");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = previewNotifications.filter(n => !n.read).length;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-20 border-b border-zinc-900 bg-black flex items-center justify-between px-8">

      {/* Left: Title + status badges */}
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold text-white tracking-tight">Competitiveness Dashboard</h1>
        <div className="hidden md:flex items-center gap-4">
          <span className="h-4 w-px bg-zinc-800" />
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Radio size={14} className="text-emerald-500 animate-pulse" />
            <span>Proxy: <strong className="text-white">Active</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <CloudLightning size={14} className={isAnalyzing ? "text-amber-500 animate-bounce" : "text-sky-500"} />
            <span>AI Matcher: <strong className={isAnalyzing ? "text-amber-400" : "text-white"}>{isAnalyzing ? "Running Audit" : "Idle"}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Notifications + user card */}
      <div className="flex items-center gap-4">

        {/* Notification Bell with Dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2.5 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40 transition-colors text-gray-400 hover:text-white cursor-pointer"
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-sky-500 flex items-center justify-center text-[8px] font-black text-black">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl shadow-black/50 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
                <span className="text-xs font-bold text-white">Notifications</span>
                {unread > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500 text-black">{unread} new</span>
                )}
              </div>
              <div className="flex flex-col divide-y divide-zinc-900">
                {previewNotifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.read ? "bg-sky-500/5" : ""}`}>
                    <div className="mt-0.5 shrink-0">{typeIcon[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${n.read ? "text-gray-300" : "text-white"}`}>{n.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 truncate">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
              <Link href="/notifications"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-center text-xs font-bold text-sky-400 hover:text-sky-300 border-t border-zinc-900 transition-colors">
                View all notifications →
              </Link>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-white">Horizon DMC</span>
            <span className="text-[10px] text-gray-500 font-medium">Standard Account</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            HD
          </div>
        </div>
      </div>
    </header>
  );
}
