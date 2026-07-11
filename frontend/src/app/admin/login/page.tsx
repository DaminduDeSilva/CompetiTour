import { adminLogin } from '../actions'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = use(searchParams)
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] p-4 relative overflow-hidden">
      {/* Admin specific background styles */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-red-950/10 blur-[130px] rounded-full pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-amber-950/10 blur-[130px] rounded-full pointer-events-none"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-2xl bg-zinc-950/60 border border-zinc-900 p-8 md:p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(239,68,68,0.1)] overflow-hidden relative transition-all duration-300 hover:shadow-[0_0_50px_-6px_rgba(239,68,68,0.15)] hover:border-zinc-800">
          
          {/* Top light bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>

          <div className="text-center mb-8 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="CompetiTour Logo"
              width={150}
              height={100}
              className="h-14 w-auto object-contain mb-3"
              priority
            />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Control Panel
            </h1>
            <p className="text-zinc-500 mt-1 text-xs font-semibold uppercase tracking-widest">
              Restricted Access
            </p>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Admin Identity</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-600">
                  <Mail size={16} />
                </span>
                <input 
                  id="email" 
                  name="email" 
                  type="email" 
                  required 
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all duration-200 text-white placeholder-zinc-700 text-sm"
                  placeholder="admin@competitour.app"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Passphrase</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-600">
                  <Lock size={16} />
                </span>
                <input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all duration-200 text-white placeholder-zinc-700 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {resolvedParams.error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                {resolvedParams.error}
              </div>
            )}

            <div className="pt-4">
              <button 
                formAction={adminLogin}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Authenticate</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-zinc-900/60 flex flex-col items-center gap-2">
            <Link href="/login" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest font-bold cursor-pointer">
              Client Portal
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  )
}
