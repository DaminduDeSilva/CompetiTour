import { adminLogin } from '../actions'
import { ShieldCheck } from 'lucide-react'
import { use } from 'react'

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedParams = use(searchParams)
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Admin specific background styles */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-900/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] pointer-events-none mix-blend-overlay"></div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-900 p-8 rounded-2xl shadow-2xl overflow-hidden relative">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>

          <div className="text-center mb-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-white/40 mt-1 text-xs font-medium uppercase tracking-widest">Restricted Access</p>
          </div>

          <form className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Admin Identity</label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                required 
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all text-white placeholder-white/20 text-sm"
                placeholder="admin@competitour.app"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">Passphrase</label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-1 focus:ring-red-500/50 focus:border-red-500 outline-none transition-all text-white placeholder-white/20 text-sm"
                placeholder="••••••••"
              />
            </div>

            {resolvedParams.error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
                {resolvedParams.error}
              </div>
            )}

            <div className="pt-2">
              <button 
                formAction={adminLogin}
                className="w-full bg-zinc-100 hover:bg-white text-black py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-[0.98]"
              >
                Authenticate
              </button>
            </div>
          </form>
          
        </div>
      </div>
    </div>
  )
}
