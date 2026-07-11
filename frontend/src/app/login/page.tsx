import { login } from './actions'
import Link from 'next/link'
import { use } from 'react'
import Image from 'next/image'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export default function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>
}) {
  const resolvedParams = use(searchParams)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-[#030303] to-[#030303] p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="backdrop-blur-2xl bg-zinc-950/50 border border-zinc-800/80 p-8 md:p-10 rounded-3xl shadow-[0_0_50px_-12px_rgba(59,130,246,0.12)] overflow-hidden relative transition-all duration-300 hover:shadow-[0_0_50px_-6px_rgba(59,130,246,0.18)] hover:border-zinc-700/50">
          
          {/* Subtle top light bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>

          {/* Logo & Header */}
          <div className="text-center mb-8 flex flex-col items-center">
            <Image
              src="/logo.png"
              alt="CompetiTour Logo"
              width={150}
              height={100}
              className="h-14 w-auto object-contain mb-3"
              priority
            />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 tracking-tight">
              CompetiTour
            </h1>
            <p className="text-zinc-500 mt-1 text-xs font-semibold uppercase tracking-widest">
              Destination Management Intelligence
            </p>
          </div>

          {resolvedParams.message && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
              {resolvedParams.message}
            </div>
          )}

          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-600">
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-white placeholder-zinc-700 text-sm"
                  placeholder="agent@competitour.app"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-600">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-950/60 border border-zinc-900 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200 text-white placeholder-zinc-700 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                formAction={login}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3.5 rounded-2xl font-semibold text-sm transition-all duration-250 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Sign In</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/signup" className="text-xs text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer">
              Don't have an account? <span className="text-blue-400 hover:underline">Sign up</span>
            </Link>
          </div>

          <div className="mt-8 text-center pt-6 border-t border-zinc-900/60 flex flex-col items-center gap-2">
            <Link href="/admin" className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase tracking-widest font-bold cursor-pointer">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
