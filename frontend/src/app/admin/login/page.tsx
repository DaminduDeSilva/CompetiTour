"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, ShieldAlert } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@zerotrace.io");
  const [password, setPassword] = useState("••••••••");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // TODO(backend): POST /auth/login with role=admin check → JWT stored securely
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      if (email === "admin@zerotrace.io") {
        router.push("/admin");
      } else {
        setError("Invalid admin credentials.");
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col gap-8">

        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-700 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-red-500/20">
            ZT
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">ZeroTrace Admin</h1>
            <p className="text-sm text-red-400 mt-1">Restricted Platform Access</p>
          </div>
        </div>

        <div className="p-8 rounded-2xl border border-red-900/30 bg-zinc-950/60 backdrop-blur-md flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-bold text-white">Admin Console Sign In</h2>
            <p className="text-xs text-gray-300 mt-1">ZeroTrace staff credentials required</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Admin Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white focus:border-red-500 focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-white focus:border-red-500 focus:outline-none pr-12" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-white transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-60 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2">
              {loading ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><LogIn size={16} /><span>Access Admin Console</span></>}
            </button>
          </form>

          <div className="flex items-center gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
            <ShieldAlert size={14} className="text-red-400 shrink-0" />
            <p className="text-[10px] text-gray-300">This console is for ZeroTrace platform staff only. All access is logged.</p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          DMC user? <a href="/login" className="text-sky-400 hover:text-sky-300 font-semibold">Sign in to DMC portal →</a>
        </p>
      </div>
    </div>
  );
}
