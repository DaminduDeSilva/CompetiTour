"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe,
  Shield,
  Plus,
  Play,
  MapPin,
  XCircle,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useQuota, formatLimit } from "@/lib/quota";
import { fetchDashboardPackage, runPackageAudit, getJobStatus } from "@/app/(dashboard)/dashboard/actions";

interface Step {
  id: number;
  label: string;
  sublabel: string;
  status: "pending" | "running" | "success";
  logs: string[];
}

export default function AnalyzePage() {
  const router = useRouter();
  const params = useParams();
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [showQuotaGate, setShowQuotaGate] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(["DE"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [realLogs, setRealLogs] = useState<string[]>(["[System] Audit job configured and initializing..."]);
  const { usage, plan, limit, exhausted } = useQuota();

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      label: "Establish Geotargeted Proxy Session",
      sublabel: "Initializing dual-proxy sessions (Premium Residential & ISP) in Frankfurt, DE",
      status: "running",
      logs: [
        "[09:30:01] Establishing Connection 1: Premium Residential Proxy (for anti-bot evasion)...",
        "[09:30:02] Establishing Connection 2: ISP Proxy (for stable sticky session orchestration)...",
        "[09:30:03] Session 1 Exit IP: 46.112.88.24 (Frankfurt, DE - Deutsche Telekom)",
        "[09:30:04] Session 2 Exit IP: 109.250.4.12 (Frankfurt, DE - Vodafone Germany)"
      ]
    },
    {
      id: 2,
      label: "OTA Target Scraping (Booking.com & Agoda)",
      sublabel: "Scraping hotel availability and standard night pricing via Playwright",
      status: "pending",
      logs: [
        "[09:30:05] Routing initial search queries through Premium Residential proxy...",
        "[09:30:06] Applying stealth fingerprint bypass models to Booking.com and Agoda...",
        "[09:30:08] GET https://www.booking.com/searchresults.html?ss=Yala+National+Park - Status: 200",
        "[09:30:10] Extracting listing items. Switching to ISP proxy for sticky detail parsing...",
        "[09:30:11] Target hotel: Cinnamon Wild Yala - found match on Booking.com ($2,100/3 Nights)",
        "[09:30:12] GET https://www.agoda.com/search?q=Cinnamon+Wild+Yala - Status: 200",
        "[09:30:13] Extracted Agoda room rate: Deluxe ($2,100/3 Nights)"
      ]
    },
    {
      id: 3,
      label: "Vector-Based Semantic Alignment",
      sublabel: "Vectorizing scraped item names against DMC inventory using BGE-M3",
      status: "pending",
      logs: [
        "[09:30:14] Initializing SentenceTransformers pipeline with BGE-M3 (multilingual)",
        "[09:30:15] Source: 'Cinnamon Wild Yala - Deluxe Room, 3 Nights'",
        "[09:30:16] Scraped: 'Cinnamon Wild (Yala National Park) - Superior Room' - Cosine Similarity: 0.942",
        "[09:30:17] Scraped: 'Cinnamon Wild Safari Lodge' - Cosine Similarity: 0.810",
        "[09:30:18] High-confidence matches forwarded for LLM confirmation."
      ]
    },
    {
      id: 4,
      label: "AI Equivalence Verification (Gemini)",
      sublabel: "Running structural room-type and cancellation policy matching validation",
      status: "pending",
      logs: [
        "[09:30:19] Invoking Gemini LLM validation agent...",
        "[09:30:20] Prompt tokens: 1,420. Max tokens: 150.",
        "[09:30:21] LLM analysis: 'Deluxe Room' and 'Superior Room' at Cinnamon Wild Yala represent equivalent tiers. Breakfast: Included. Free cancellation policy: MATCHED.",
        "[09:30:22] Match verified. Confidence rating: 98.4%."
      ]
    },
    {
      id: 5,
      label: "Compile Competitiveness Analytics Report",
      sublabel: "Analyzing pricing margins, leakages, and compiling PDF report",
      status: "pending",
      logs: [
        "[09:30:23] Normalizing currency rates: USD to LKR (Live Rate)",
        "[09:30:24] Calculating cost components difference...",
        "[09:30:25] Package sum-of-parts in Germany: $7,120. Your price: $5,660.",
        "[09:30:26] Pricing Gap (Margin Leakage): -20.5%",
        "[09:30:27] Saving snapshot to database competitiveness_reports."
      ]
    }
  ]);

  const [packageData, setPackageData] = useState<any>(null);
  const [isLoadingPackage, setIsLoadingPackage] = useState(true);

  useEffect(() => {
    async function loadPackage() {
      if (params.id) {
        setIsLoadingPackage(true);
        const { data, error } = await fetchDashboardPackage(params.id as string);
        if (data) {
          setPackageData(data);
        }
        setIsLoadingPackage(false);
      }
    }
    loadPackage();
  }, [params.id]);

  // Real polling logic
  useEffect(() => {
    if (isConfiguring || finished || !activeJobId) return;

    let pollingInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await getJobStatus(activeJobId);
        if (res.data) {
          const { status, total_tasks, completed_tasks, current_detail } = res.data;
          
          if (current_detail) {
            setRealLogs((prev) => {
              const formatted = `[${new Date().toLocaleTimeString()}] ${current_detail}`;
              if (prev[prev.length - 1] !== formatted) {
                return [...prev, formatted];
              }
              return prev;
            });
          }

          let targetProgress = progress;
          let targetStep = currentStepId;

          if (status === "queued") {
            targetProgress = 10;
            targetStep = 1;
          } else if (status === "scraping") {
            // Give it some base progress, then calculate based on tasks
            const baseProgress = 20;
            const taskProgress = total_tasks > 0 ? (completed_tasks / total_tasks) * 40 : 0;
            targetProgress = baseProgress + taskProgress;
            targetStep = 2;
          } else if (status === "matching") {
            targetProgress = 70;
            targetStep = 3;
          } else if (status === "reporting") {
            targetProgress = 90;
            targetStep = 4;
          } else if (status === "done") {
            targetProgress = 100;
            targetStep = 5;
            setFinished(true);
            clearInterval(pollingInterval);
          } else if (status === "failed") {
            // Could handle error state here
            clearInterval(pollingInterval);
            alert("Audit failed on the server.");
          }

          setProgress(targetProgress);
          setCurrentStepId(targetStep);

          setSteps((prevSteps) => {
            return prevSteps.map((s, idx) => {
              if (idx < targetStep - 1) {
                return { ...s, status: "success" as const };
              } else if (idx === targetStep - 1) {
                return { ...s, status: status === "done" ? "success" as const : "running" as const };
              } else {
                return { ...s, status: "pending" as const };
              }
            });
          });
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    // Poll every 3 seconds
    pollingInterval = setInterval(pollStatus, 3000);
    // Initial call
    pollStatus();

    return () => clearInterval(pollingInterval);
  }, [finished, isConfiguring, activeJobId]);

  useEffect(() => {
    if (finished) {
      router.push(`/reports/${params.id}/history`);
    }
  }, [finished, router, params.id]);

  if (isLoadingPackage) {
    return (
      <>
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-sky-500" />
        </div>
      </>
    );
  }

  if (isConfiguring) {
    return (
      <>
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu size={20} className="text-sky-400" />
            Configure Pricing Audit
          </h2>
          <p className="text-xs text-gray-300 mt-1">Configure proxy routing and target source market parameters for deep analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6">
          {/* Left Column: Form Config */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe size={16} className="text-sky-400" />
                Target Source Markets
              </h3>
              <p className="text-xs text-gray-400 -mt-3">Select which source market prices you want to audit against local OTA listings.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { code: "DE", name: "Germany", flag: "🇩🇪" },
                  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
                  { code: "AU", name: "Australia", flag: "🇦🇺" },
                  { code: "FR", name: "France", flag: "🇫🇷" },
                  { code: "US", name: "United States", flag: "🇺🇸" },
                  { code: "JP", name: "Japan", flag: "🇯🇵" },
                ].map((m) => (
                  <label key={m.code} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/10 cursor-pointer hover:border-zinc-700 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedMarkets.includes(m.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMarkets([...selectedMarkets, m.code]);
                        } else {
                          setSelectedMarkets(selectedMarkets.filter(c => c !== m.code));
                        }
                      }}
                      className="rounded border-zinc-700 bg-zinc-950 text-sky-500 focus:ring-sky-500/20"
                    />
                    <span className="text-xs text-gray-300 flex items-center gap-1.5">
                      <span>{m.flag}</span> {m.name}
                    </span>
                  </label>
                ))}
              </div>

              <div className="h-px bg-zinc-900 my-2" />

              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                OTA Platforms to Audit
              </h3>
              <p className="text-xs text-gray-400 -mt-3">Scrape public retail listings from the selected travel platforms.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: "booking", name: "Booking.com", checked: true },
                  { id: "agoda", name: "Agoda", checked: true },
                ].map((platform) => (
                  <label key={platform.id} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/10 cursor-pointer hover:border-zinc-700 transition-colors">
                    <input 
                      type="checkbox" 
                      defaultChecked={platform.checked}
                      className="rounded border-zinc-700 bg-zinc-950 text-sky-500 focus:ring-sky-500/20"
                    />
                    <span className="text-xs text-gray-300">{platform.name}</span>
                  </label>
                ))}
              </div>


            </div>
          </div>

          {/* Right Column: Package Details & Run */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="p-6 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-md flex flex-col gap-6">
              <div>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded uppercase">Target Package</span>
                <h3 className="text-base font-bold text-white mt-2">{packageData?.name || "Loading..."}</h3>
                <p className="text-xs text-gray-300 mt-1">{packageData?.duration_days} Days · {packageData?.destination} · ${packageData?.total_price_lkr} USD</p>
                
                {packageData && (
                  <div className="mt-3 flex items-center gap-3 text-[11px] font-medium text-gray-400 bg-black/20 p-2.5 rounded-lg border border-white/5">
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Occupancy</span>
                      <span>{packageData.adults || 2} Adults, {packageData.children || 0} Children</span>
                    </div>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <div className="flex flex-col">
                      <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Rooms</span>
                      <span>{packageData.rooms || 1} Room(s)</span>
                    </div>
                    {packageData.target_date && (
                      <>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <div className="flex flex-col">
                          <span className="text-gray-500 uppercase text-[9px] font-bold tracking-wider">Target Date</span>
                          <span>{new Date(packageData.target_date).toLocaleDateString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="h-px bg-zinc-900" />

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Itinerary Components</h4>
                <div className="flex flex-col gap-2.5">
                  {packageData?.components?.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                      <span>{c.name} ({c.nights_or_duration})</span>
                    </div>
                  ))}
                  {(!packageData?.components || packageData.components.length === 0) && (
                    <span className="text-xs text-gray-500 italic">No components defined.</span>
                  )}
                </div>
              </div>

              <button 
                disabled={isSubmitting}
                onClick={async () => {
                  if (exhausted) {
                    setShowQuotaGate(true);
                  } else {
                    if (selectedMarkets.length === 0) {
                      alert("Please select at least one source market.");
                      return;
                    }
                    setIsSubmitting(true);
                    try {
                      const res = await runPackageAudit(Number(params.id), selectedMarkets);
                      if (res.success && res.data) {
                        setActiveJobId(res.data.id);
                        setIsConfiguring(false);
                      } else {
                        alert("Failed to start audit: " + (res.error || "Unknown error"));
                        setIsSubmitting(false);
                      }
                    } catch (e) {
                      alert("Error starting audit.");
                      setIsSubmitting(false);
                    }
                  }
                }}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-sm font-bold text-white shadow-xl shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all cursor-pointer ${isSubmitting ? "opacity-70 pointer-events-none" : ""}`}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin text-white" /> : <Play size={16} fill="white" />}
                <span>{isSubmitting ? "Queueing Audits..." : "Start Real-Time AI Audit"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quota Gate Modal */}
        {showQuotaGate && (() => {
          return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <div className="w-full max-w-md p-8 rounded-2xl border border-red-500/20 bg-zinc-950 shadow-2xl flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <XCircle size={20} className="text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Audit Quota Exhausted</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{plan.name} Plan Limit</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQuotaGate(false)} className="text-gray-500 hover:text-white transition-colors cursor-pointer">
                    <XCircle size={18} />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Audits used this month</span>
                    <span className="font-bold text-red-400">{usage.auditsUsed} / {formatLimit(limit)}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full w-full" />
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    You have used all <strong className="text-white">{formatLimit(limit)} audits</strong> allocated to your <strong className="text-white">{plan.name}</strong> plan this billing cycle. Upgrade to continue running audits.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Zap size={12} className="text-indigo-400" />
                    <span>Professional plan: <strong className="text-white">50 audits/month</strong> — $149/mo</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowQuotaGate(false)} className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer">
                      Cancel
                    </button>
                    <Link
                      href="/billing"
                      className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-xs font-bold text-white transition-all"
                    >
                      View Plans
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </>
    );
  }

  return (
    <>
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu size={20} className="text-sky-400 animate-spin" />
            Running Pricing Audit
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Analyzing package "{packageData?.name}" in target markets {selectedMarkets.join(", ")} using real-time search queries
          </p>
        </div>
        
        {/* Progress percent badge */}
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-white">{progress}%</span>
          <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">Processing</span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 transition-all duration-150" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Flow Steps */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`p-4 rounded-xl border transition-all duration-300 ${
                step.status === "running"
                  ? "border-sky-500/40 bg-sky-500/5 shadow-lg shadow-sky-500/5"
                  : step.status === "success"
                  ? "border-zinc-800 bg-zinc-950/20 opacity-70"
                  : "border-zinc-900 bg-zinc-950/40 opacity-40"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  
                  {/* Step status icon */}
                  <div className="mt-0.5">
                    {step.status === "success" ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : step.status === "running" ? (
                      <Loader2 size={18} className="text-sky-500 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-800" />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{step.label}</span>
                    <span className="text-[10px] text-gray-300 mt-0.5">{step.sublabel}</span>
                  </div>
                </div>

                <span className="text-[9px] font-bold tracking-wider text-gray-400 uppercase">
                  Step {step.id}/5
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Shell Console Logger */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Shell Container */}
          <div className="rounded-2xl border border-zinc-900 bg-black overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-2">
                <Terminal size={14} className="text-sky-400" />
                terminal_logs.log
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>

            <div className="p-4 font-mono text-[10px] text-emerald-400/90 leading-relaxed overflow-y-auto h-80 flex flex-col gap-2 bg-black">
              {/* Show real logs fetched from the backend API */}
              {realLogs.map((log, idx) => (
                  <div key={idx} className="transition-all duration-300 opacity-90 animate-fadeIn">
                    {log}
                  </div>
                ))}
              {/* Spinning cursor if not finished */}
              {!finished && (
                <div className="flex items-center gap-1.5 text-sky-400 animate-pulse mt-1">
                  <span>&gt; pipeline processing...</span>
                  <span className="w-1.5 h-3.5 bg-sky-500 animate-blink" />
                </div>
              )}
            </div>
          </div>

          {/* Success Callout Box */}
          {finished && (
            <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md flex flex-col gap-4 animate-scaleUp">
              <div className="flex items-start gap-4">
                <CheckCircle2 size={24} className="text-emerald-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Pricing Audit Complete!</h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    AI successfully matched 4 hotel inventory tiers and calculated the target pricing competitiveness report for target markets.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => router.push("/reports/3/history")}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black transition-all cursor-pointer"
              >
                <span>View Competitiveness Report</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
