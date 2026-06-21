"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { 
  CheckCircle2, 
  Loader2, 
  Terminal, 
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";

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
  const [progress, setProgress] = useState(0);
  const [currentStepId, setCurrentStepId] = useState(1);
  const [finished, setFinished] = useState(false);

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
        "[09:30:11] Target hotel: Cinnamon Wild Yala - found match on Booking.com (€2,100/3 Nights)",
        "[09:30:12] GET https://www.agoda.com/search?q=Cinnamon+Wild+Yala - Status: 200",
        "[09:30:13] Extracted Agoda room rate: Deluxe (€2,100/3 Nights)"
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
      label: "AI Equivalence Verification (Claude)",
      sublabel: "Running structural room-type and cancellation policy matching validation",
      status: "pending",
      logs: [
        "[09:30:19] Invoking Claude LLM validation agent...",
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
        "[09:30:23] Normalizing currency rates: EUR to LKR (Rate: 326.50)",
        "[09:30:24] Calculating cost components difference...",
        "[09:30:25] Package sum-of-parts in Germany: €7,120. Your price: €5,660.",
        "[09:30:26] Pricing Gap (Margin Leakage): -20.5%",
        "[09:30:27] Saving snapshot to database competitiveness_reports."
      ]
    }
  ]);

  // Stepper logic
  useEffect(() => {
    if (finished) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setFinished(true);
          // Mark final step success
          setSteps((prevSteps) => {
            const nextSteps = [...prevSteps];
            nextSteps[4].status = "success";
            return nextSteps;
          });
          return 100;
        }

        // Stepper calculation: 5 steps, 20% each
        const stepIndex = Math.floor(next / 20);
        setCurrentStepId(stepIndex + 1);

        setSteps((prevSteps) => {
          const nextSteps = prevSteps.map((s, idx) => {
            if (idx < stepIndex) {
              return { ...s, status: "success" as const };
            } else if (idx === stepIndex) {
              return { ...s, status: "running" as const };
            } else {
              return { ...s, status: "pending" as const };
            }
          });
          return nextSteps;
        });

        return next;
      });
    }, 150); // Fast animation

    return () => clearInterval(interval);
  }, [finished]);

  return (
    <PageWrapper>
      {/* Title */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu size={20} className="text-sky-400 animate-spin" />
            Running Pricing Audit
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Analyzing package "Adventure & Wildlife Safari - 12 Days" in target market Germany using real-time search queries
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
                    <span className="text-[10px] text-gray-500 mt-0.5">{step.sublabel}</span>
                  </div>
                </div>

                <span className="text-[9px] font-bold tracking-wider text-gray-600 uppercase">
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
              {/* Show logs from all steps that have started or succeeded */}
              {steps
                .filter((s) => s.status !== "pending")
                .flatMap((s) => s.logs)
                .map((log, idx) => (
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
    </PageWrapper>
  );
}
