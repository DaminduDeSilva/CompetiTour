"use client";

import React, { useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import { 
  ShieldAlert, 
  Cpu, 
  Settings as SettingsIcon, 
  Save, 
  CheckCircle,
  KeyRound,
  Network
} from "lucide-react";

export default function SettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Proxy settings
  const [proxyHost, setProxyHost] = useState("geox.torchproxies.com");
  const [proxyPort, setProxyPort] = useState(6011);
  const [proxyUser, setProxyUser] = useState("torch-partner-zerotrace");
  const [proxyPass, setProxyPass] = useState("••••••••••••••••••••");

  // Model settings
  const [model, setModel] = useState("claude-3-5-haiku-20241022");
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon size={20} className="text-sky-400" />
            System Configurations
          </h2>
          <p className="text-xs text-gray-500 mt-1">Configure Torch Labs proxies, Anthropic API models, and matcher thresholds</p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 animate-scaleUp">
            <CheckCircle size={14} /> Saved Successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Config Panels */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Card 1: Proxy credentials */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network size={16} className="text-sky-400" />
              Torch Labs Proxy Connection (Track 4)
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed -mt-2">
              Configure your residential proxy backconnect credentials. Exit IPs will be dynamically rotated based on the selected target market locale.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Proxy Gateway Host</label>
                <input 
                  type="text" 
                  value={proxyHost} 
                  onChange={(e) => setProxyHost(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Gateway Port</label>
                <input 
                  type="number" 
                  value={proxyPort} 
                  onChange={(e) => setProxyPort(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Sub-user Account ID</label>
                <input 
                  type="text" 
                  value={proxyUser} 
                  onChange={(e) => setProxyUser(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Sub-user Auth Password</label>
              <input 
                type="password" 
                value={proxyPass} 
                onChange={(e) => setProxyPass(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-sky-500 focus:outline-none text-white font-medium"
              />
            </div>
          </div>

          {/* Card 2: AI Matching engine */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu size={16} className="text-emerald-400" />
              AI Matching Engine Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">LLM Verification Model</label>
                <select 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-sky-500 focus:outline-none text-white font-medium appearance-none"
                >
                  <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fast, Cost-Effective)</option>
                  <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (High Accuracy)</option>
                  <option value="bge-m3-only">BGE-M3 Embedding Cosine-Only</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Minimum Confidence Threshold (%)</label>
                <input 
                  type="number" 
                  value={confidenceThreshold} 
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-sky-500 focus:outline-none text-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Callouts & Saves */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card: Actions */}
          <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white">Save Changes</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Applying changes updates the credentials globally across all docker worker instances.
            </p>

            <button 
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-sm font-bold text-black transition-colors cursor-pointer"
            >
              <Save size={16} />
              <span>Save System Config</span>
            </button>
          </div>

          {/* Alert card */}
          <div className="p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 backdrop-blur-md flex flex-col gap-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldAlert size={14} className="text-yellow-500" />
              Audit Integrity Check
            </h4>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Never share or expose sub-user credentials. The pipeline requires high-quality residential ISP proxies to avoid Cloudflare/Akamai bot detection screens on OTA platforms.
            </p>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
