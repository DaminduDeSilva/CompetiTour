"use client";
import { signout } from "@/app/login/actions";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ShieldAlert, LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function PendingPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setEmail(data.user.email || null);
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-[#030303] to-[#030303] p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-2xl bg-zinc-950/50 border border-zinc-800/80 p-8 md:p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.12)] overflow-hidden relative transition-all duration-300 hover:shadow-[0_0_50px_-6px_rgba(59,130,246,0.18)] hover:border-zinc-700/50 flex flex-col items-center">
          
          {/* Subtle top light bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          {/* Logo / Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <Clock size={32} className="animate-pulse" />
          </div>
          
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 tracking-tight mb-3 text-center">
            Account Pending Verification
          </h1>
          
          <p className="text-xs text-zinc-400 mb-8 leading-relaxed text-center">
            Your DMC account <span className="text-zinc-200 font-medium">({email || "..."})</span> is currently awaiting admin approval. 
            Due to the high cost of proxy node executions and AI models, we manually verify all new registrations.
          </p>
          
          <div className="w-full bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-5 flex items-start gap-4 mb-8">
            <ShieldAlert size={18} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-left">
              <h3 className="text-xs font-bold text-zinc-200">What happens next?</h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                Once the ZeroTrace Admin approves your organization, you will receive full access to the Competitiveness Dashboard and your scraping quotas.
              </p>
            </div>
          </div>

          <form action={signout} className="w-full">
            <button 
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Sign out for now</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


