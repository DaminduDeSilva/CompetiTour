"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@horizondmc.lk");
  const [password, setPassword] = useState("••••••••");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // TODO(backend): Replace with POST /auth/login → receive JWT, store in httpOnly cookie or localStorage
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-sky-500/20">
            CT
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">CompetiTour</h1>
            <p className="text-sm text-gray-500 mt-1">AI-Powered Pricing Intelligence for DMCs</p>
          </div>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl border border-zinc-900 bg-zinc-950/60 backdrop-blur-md flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white">Sign in to your workspace</h2>
            <p className="text-xs text-gray-500 mt-1">Powered by ZeroTrace intelligence platform</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white focus:border-sky-500 focus:outline-none pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-sm font-bold text-black transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                <><LogIn size={16} /><span>Sign In</span></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-2 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <p className="text-[10px] text-gray-500">
              Demo credentials pre-filled. Click <strong className="text-white">Sign In</strong> to enter the DMC portal.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600">
          ZeroTrace admin?{" "}
          <a href="/admin/login" className="text-red-400 hover:text-red-300 font-semibold">
            Access admin console →
          </a>
        </p>
      </div>
    </div>
  );
}
