"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Globe,
  Target,
  Brain,
  TrendingUp,
  Play,
  ChevronDown,
  ArrowRight,
  Menu,
  X
} from "lucide-react";

// Dynamically import GlobeView with SSR disabled to prevent server-side window errors
const GlobeView = dynamic(() => import("../components/landing/GlobeView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border-2 border-t-sky-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute w-16 h-16 rounded-full border border-sky-500/10" />
      </div>
    </div>
  ),
});

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200">

      {/* Background Grid & Ambient Glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] left-10 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <div className="w-8 h-8 rounded-[10px] bg-black flex items-center justify-center">
              {/* Dynamic Logo Symbol */}
              <div className="relative w-4 h-4 rounded-full border-2 border-sky-400 flex items-center justify-center animate-[spin_6s_linear_infinite]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute -bottom-1" />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
              CompetiTour
            </span>
            <span className="text-[10px] tracking-widest text-gray-400 uppercase font-semibold -mt-1">
              Travel Intelligence Layer
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-8">
          <div className="relative group cursor-pointer">
            <span className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Product <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
            </span>
          </div>
          <div className="relative group cursor-pointer">
            <span className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Solutions <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
            </span>
          </div>
          <div className="relative group cursor-pointer">
            <span className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Resources <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
            </span>
          </div>
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Pricing
          </Link>
          <div className="relative group cursor-pointer">
            <span className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Company <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
            </span>
          </div>
        </nav>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Login
          </Link>
          <Link
            href="#"
            className="relative inline-flex items-center justify-center px-6 py-2.5 rounded-full text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-md shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all group overflow-hidden"
          >
            <span>Book a Demo</span>
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-lg lg:hidden pt-24 px-6 flex flex-col gap-6">
          <Link href="#" className="text-lg font-semibold text-gray-200 border-b border-zinc-800 pb-3">Product</Link>
          <Link href="#" className="text-lg font-semibold text-gray-200 border-b border-zinc-800 pb-3">Solutions</Link>
          <Link href="#" className="text-lg font-semibold text-gray-200 border-b border-zinc-800 pb-3">Resources</Link>
          <Link href="#" className="text-lg font-semibold text-gray-200 border-b border-zinc-800 pb-3">Pricing</Link>
          <Link href="#" className="text-lg font-semibold text-gray-200 border-b border-zinc-800 pb-3">Company</Link>
          <div className="flex flex-col gap-4 mt-8">
            <Link href="/dashboard" className="w-full text-center py-3 rounded-xl border border-zinc-800 text-gray-200 font-semibold hover:bg-zinc-900 transition-colors">
              Login
            </Link>
            <Link href="#" className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold">
              Book a Demo
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-10 pb-20 lg:pt-16 lg:pb-28 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-6 items-center">

        {/* Left Column (Hero Content) */}
        <div className="lg:col-span-5 flex flex-col items-start gap-8 z-10">

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-500/5 text-[10px] font-bold tracking-wider text-sky-400 uppercase shadow-inner shadow-sky-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            + AI-Powered Market Intelligence
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            See the world <br />
            the way your <br />
            <span className="bg-gradient-to-r from-sky-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
              travelers
            </span> see it.
          </h1>

          {/* Paragraph */}
          <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-lg">
            CompetiTour reveals how your travel packages compete in global markets with real-time data from leading OTA platforms.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-xl shadow-sky-500/10 hover:shadow-sky-500/20 transition-all group"
            >
              <span>Explore Platform</span>
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* <button className="flex items-center gap-3.5 group cursor-pointer text-left">
              <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-sky-500 group-hover:bg-sky-500/5 transition-all">
                <Play size={16} fill="white" className="text-white ml-0.5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-sky-400 transition-colors">Watch Demo</div>
                <div className="text-xs text-gray-500">2 min overview</div>
              </div>
            </button> */}
          </div>
        </div>

        {/* Right Column (Globe) */}
        <div className="lg:col-span-7 w-full h-[580px] lg:h-[720px] flex items-center justify-center relative">
          <GlobeView />
        </div>
      </section>

      {/* Feature Icons Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-xl">

          {/* Feature 1 */}
          <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Real Market Prices</h3>
              <p className="text-xs text-gray-400 mt-0.5">From OTA platforms</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Geo-Targeted Insights</h3>
              <p className="text-xs text-gray-400 mt-0.5">Across 50+ source markets</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI-Powered Matching</h3>
              <p className="text-xs text-gray-400 mt-0.5">Hotels, activities & more</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-zinc-900/40 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Actionable Intelligence</h3>
              <p className="text-xs text-gray-400 mt-0.5">Make smarter pricing decisions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section (Partners) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 text-center">
        <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 mb-10">
          Trusted By Leading Travel Companies
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-60">
          {/* Aitken Spence Travels */}
          <div className="flex flex-col items-center">
            <span className="font-serif italic text-lg tracking-wide text-gray-300">
              Aitken Spence
            </span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-gray-500 font-sans -mt-0.5">
              Travels
            </span>
          </div>

          {/* Jetwing Travels */}
          <div className="flex flex-col items-center">
            <span className="font-sans font-bold text-xl tracking-tight text-gray-300">
              Jetwing
            </span>
            <span className="text-[8px] uppercase tracking-[0.4em] text-gray-500 font-sans">
              Travels
            </span>
          </div>

          {/* Walkers Tours */}
          <div className="flex flex-col items-center">
            <span className="font-sans font-black text-lg tracking-widest text-gray-300 uppercase">
              Walkers
            </span>
            <span className="text-[9px] tracking-[0.2em] text-gray-500 font-semibold uppercase">
              Tours
            </span>
          </div>

          {/* Cinnamon Hotels & Resorts */}
          <div className="flex flex-col items-center">
            <span className="font-serif text-xl tracking-wide text-gray-300">
              Cinnamon
            </span>
            <span className="text-[7px] uppercase tracking-[0.25em] text-gray-500 font-sans -mt-0.5">
              Hotels & Resorts
            </span>
          </div>

          {/* hs Hospitality Solutions */}
          <div className="flex items-baseline gap-1">
            <span className="font-sans font-black text-2xl text-gray-300 lowercase leading-none">
              hs
            </span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] uppercase font-bold text-gray-300 tracking-wider">Hospitality</span>
              <span className="text-[7px] uppercase font-semibold text-gray-500 tracking-widest">Solutions</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
