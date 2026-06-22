"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderHeart, BarChart3, Settings, LogOut,
  ShieldCheck, Bell, FolderOpen, ChevronRight, CreditCard
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Packages", href: "/packages", icon: FolderOpen },
    { name: "Add Package", href: "/packages/new", icon: FolderHeart },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Billing", href: "/billing", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-zinc-900 bg-black flex flex-col justify-between p-6">
      <div className="flex flex-col gap-8">

        {/* Brand Card */}
        <Link href="/" className="flex items-center gap-0">
          <Image
            src="/logo.png"
            alt="CompetiTour Logo"
            width={150}
            height={100}
            className="h-13 w-auto object-contain"
            priority
          />
          <div className="flex flex-col -ml-5">
            <span className="text-sm font-bold text-white">CompetiTour</span>
            <span className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold">ZeroTrace · DMC</span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href ||
              (item.href !== "/dashboard" && item.href !== "/packages/new" && pathname.startsWith(item.href) && item.href.length > 1);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? "bg-sky-500/10 border border-sky-500/20 text-sky-400"
                  : "border border-transparent text-gray-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
              >
                <Icon size={18} className={isActive ? "text-sky-400" : "text-gray-400 group-hover:text-white transition-colors"} />
                <span className="flex-1">{item.name}</span>
                {isActive && <ChevronRight size={14} className="text-sky-400" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400">
            <ShieldCheck size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">Proxy Secured</span>
            <span className="text-[9px] text-gray-300">Torch Labs via ZeroTrace</span>
          </div>
        </div>

        <Link
          href="/login"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-300 hover:text-red-400 hover:bg-red-500/5 transition-all"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
