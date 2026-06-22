"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Network,
  Cpu,
  Globe,
  LogOut,
  ShieldAlert,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Tenants", href: "/admin/tenants", icon: Users },
  { name: "Proxy Pool", href: "/admin/proxy", icon: Network },
  { name: "Workers", href: "/admin/workers", icon: Cpu },
  { name: "OTA Platforms", href: "/admin/ota", icon: Globe },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-red-900/30 bg-black flex flex-col justify-between p-6">
      <div className="flex flex-col gap-8">

        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-500 to-rose-700 flex items-center justify-center font-bold text-white text-sm">
            ZT
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">ZeroTrace</span>
            <span className="text-[9px] text-red-400 uppercase tracking-widest font-semibold">Admin Console</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : "border border-transparent text-gray-400 hover:text-white hover:bg-zinc-900/40"
                }`}
              >
                <Icon size={18} className={isActive ? "text-red-400" : "text-gray-400 group-hover:text-white transition-colors"} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight size={14} className="text-red-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-4">
        {/* Admin role badge */}
        <div className="p-4 rounded-xl border border-red-900/30 bg-red-500/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
            <ShieldAlert size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">ZeroTrace Staff</span>
            <span className="text-[9px] text-red-400">Platform Admin</span>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={18} />
          <span>Exit Admin</span>
        </Link>
      </div>
    </aside>
  );
}
