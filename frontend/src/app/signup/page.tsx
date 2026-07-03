import { signup } from '@/app/login/actions'
import Link from 'next/link'
import { use } from 'react'

export default function SignupPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = use(searchParams)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0a0a] to-[#0a0a0a] p-4">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight">
              CompetiTour
            </h1>
            <p className="text-white/50 mt-2 text-sm font-medium">Create DMC Account</p>
          </div>

          {resolvedParams.message && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {resolvedParams.message}
            </div>
          )}

          <form className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Organization Name</label>
              <input 
                id="full_name" 
                name="full_name" 
                type="text" 
                required
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-white/30 text-sm"
                placeholder="e.g. Horizon DMC"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Work Email</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-white/30 text-sm"
                placeholder="agent@competitour.app"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider pl-1">Password</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all text-white placeholder-white/30 text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button 
                formAction={signup}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98]"
              >
                Register Organization
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link href="/login" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Already have an account? Sign in
            </Link>
          </div>

          <div className="mt-8 text-center flex flex-col items-center gap-2">
            <p className="text-xs text-white/40">Secure access provided by Supabase Auth</p>
            <Link href="/admin" className="text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest font-bold">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
