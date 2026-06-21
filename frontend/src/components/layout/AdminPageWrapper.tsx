"use client";
import React from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminTopBar from "@/components/layout/AdminTopBar";

export default function AdminPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#1a0505_0%,#000000_100%)]">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
