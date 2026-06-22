"use client";
import React, { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { Bell, TrendingDown, AlertTriangle, CheckCircle, Info, X } from "lucide-react";

// TODO(backend): Fetch from GET /notifications?tenant_id=<jwt>&page=1&limit=20
const notifications = [
  { id: 1, type: "leakage", title: "Margin Leakage Detected", body: "Adventure & Wildlife Safari – 12 Days is underpriced by 20.5% in Germany (DE). Market sum-of-parts: €7,120 vs your rate €5,660.", time: "June 21, 2026 09:32", read: false },
  { id: 2, type: "audit_complete", title: "Audit Complete", body: "Pricing audit for Cultural Triangle & Beach – 7 Days in Germany (DE) completed. Status: At Risk (+3.2%).", time: "June 20, 2026 14:13", read: false },
  { id: 3, type: "at_risk", title: "Package At Risk", body: "Classic Sri Lanka Tour – 10 Days is priced above OTA assembly by +3.0% in the United Kingdom market.", time: "June 20, 2026 11:46", read: true },
  { id: 4, type: "audit_complete", title: "Audit Complete", body: "Adventure & Wildlife Safari – 12 Days audit in United Kingdom completed. Status: Leakage (–22.4%).", time: "June 19, 2026 16:31", read: true },
  { id: 5, type: "leakage", title: "Severe Margin Leakage", body: "Adventure & Wildlife Safari – 12 Days is underpriced by 26.2% in Australia (AU). Immediate review recommended.", time: "June 16, 2026 13:23", read: true },
  { id: 6, type: "info", title: "New Market Available", body: "Japan (JP) is now available as a target source market. Configure it in your package audit settings.", time: "June 15, 2026 08:00", read: true },
  { id: 7, type: "audit_complete", title: "Audit Complete", body: "Luxury Boutique Getaway – 5 Days audit in Germany completed. Status: Competitive (–9.2%).", time: "June 14, 2026 10:01", read: true },
];

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  leakage:       { icon: <TrendingDown size={16} />,    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  at_risk:       { icon: <AlertTriangle size={16} />,   color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  audit_complete:{ icon: <CheckCircle size={16} />,     color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  info:          { icon: <Info size={16} />,            color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20" },
};

export default function NotificationsPage() {
  const [items, setItems] = useState(notifications);

  // TODO(backend): PATCH /notifications/{id}/read
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
          <p className="text-xs text-gray-300 mt-1">Audit alerts and system events for Horizon DMC</p>
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
        {items.map((n) => {
          const tc = typeConfig[n.type];
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
        {items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Bell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">All caught up — no notifications.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
