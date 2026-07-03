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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-950/60 border border-zinc-900 p-8 rounded-3xl flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-6">
          <Clock size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Account Pending Verification</h1>
        <p className="text-sm text-gray-400 mb-8">
          Your DMC account ({email || "..."}) is currently awaiting admin approval. 
          Due to the high cost of proxy node executions and AI models, we manually verify all new registrations.
        </p>
        
        <div className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-start gap-3 mb-8">
          <ShieldAlert size={16} className="text-sky-400 shrink-0 mt-0.5" />
          <div className="text-left">
            <h3 className="text-xs font-bold text-white">What happens next?</h3>
            <p className="text-[11px] text-gray-400 mt-1">
              Once the ZeroTrace Admin approves your organization, you will receive full access to the Competitiveness Dashboard and your scraping quotas.
            </p>
          </div>
        </div>

        <form action={signout} className="w-full">
          <button 
            type="submit"
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign out for now</span>
          </button>
        </form>
      </div>
    </div>
  );
}
