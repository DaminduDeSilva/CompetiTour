"use client";
import React, { useState, useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { Bell, TrendingDown, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { fetchDashboardPackages, fetchCurrentUserProfile } from "@/app/dashboard/actions";

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  leakage:       { icon: <TrendingDown size={16} />,    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  at_risk:       { icon: <AlertTriangle size={16} />,   color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  audit_complete:{ icon: <CheckCircle size={16} />,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  info:          { icon: <Info size={16} />,            color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20" },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("Horizon DMC");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch company profile name
        const profileRes = await fetchCurrentUserProfile();
        if (profileRes?.user?.company_name) {
          setCompanyName(profileRes.user.company_name);
        }

        // Fetch reports
        const { packages } = await fetchDashboardPackages();
        if (packages) {
          const extractedNotifications = packages.flatMap((pkg: any) => {
            return (pkg.reports || []).map((rep: any) => {
              const marketNames: Record<number, { name: string; flag: string; code: string }> = {
                1: { name: "Germany", flag: "🇩🇪", code: "DE" },
                2: { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
                3: { name: "Australia", flag: "🇦🇺", code: "AU" }
              };
              const marketInfo = marketNames[rep.source_market_id] || { name: "Germany", flag: "🇩🇪", code: "DE" };
              const varianceVal = rep.price_delta_pct;
              const varianceStr = `${varianceVal > 0 ? "+" : ""}${varianceVal}%`;
              
              let type = "audit_complete";
              let title = "Audit Complete";
              let body = `Pricing audit for ${pkg.name} in ${marketInfo.name} (${marketInfo.code}) completed. Status: Competitive (${varianceStr}).`;

              if (rep.status === "at_risk") {
                type = "at_risk";
                title = "Package At Risk";
                body = `${pkg.name} is priced above OTA assembly by ${varianceStr} in the ${marketInfo.name} market.`;
              } else if (rep.status === "underpriced" || rep.status === "margin_leakage") {
                type = "leakage";
                title = "Margin Leakage Detected";
                body = `${pkg.name} is underpriced by ${varianceStr} in ${marketInfo.name} (${marketInfo.code}). Market sum-of-parts: $${Math.round(rep.market_assembled_price_usd / 1.08).toLocaleString()} vs your rate $${Math.round(rep.dmc_price_usd / 1.08).toLocaleString()}.`;
              }

              return {
                id: rep.id,
                type,
                title,
                body,
                time: new Date(rep.generated_at).toLocaleString(),
                read: false
              };
            });
          });

          // Sort by time descending
          extractedNotifications.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setItems(extractedNotifications);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: number) => setItems((prev) => prev.filter((n) => n.id !== id));

  const unread = items.filter((n) => !n.read).length;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell size={20} className="text-sky-400" />
            Notifications
            {unread > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-500 text-black">{unread}</span>
            )}
          </h2>
          <p className="text-xs text-gray-300 mt-1">Audit alerts and system events for {companyName}</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors cursor-pointer">
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Loading notifications...</p>
          </div>
        ) : items.map((n) => {
          const tc = typeConfig[n.type] || typeConfig.info;
          return (
            <div key={n.id}
              className={`p-5 rounded-2xl border backdrop-blur-md flex items-start gap-4 transition-all ${
                n.read ? "border-zinc-900 bg-zinc-950/30" : "border-sky-500/20 bg-sky-500/5"
              }`}
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tc.bg} ${tc.color}`}>
                {tc.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-bold ${n.read ? "text-gray-300" : "text-white"}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-2">{n.time}</p>
              </div>
              <button onClick={() => dismiss(n.id)}
                className="text-gray-400 hover:text-gray-400 transition-colors shrink-0 cursor-pointer">
                <X size={14} />
              </button>
            </div>
          );
        })}
        {!loading && items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">All caught up — no notifications.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
