"use client";

import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface PageWrapperProps {
  children: React.ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-white font-sans">
      
      {/* Side Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <TopBar />

        {/* Dynamic Page Scroll Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,#0f172a_0%,#000000_100%)]">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
