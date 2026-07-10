import React, { useEffect, useState, useRef } from "react";
import { getJobStatus } from "@/app/(dashboard)/dashboard/actions";
import { CheckCircle2, XCircle, Loader2, Radio } from "lucide-react";

interface AuditProgressModalProps {
  isOpen: boolean;
  jobId: string | null;
  packageName: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function AuditProgressModal({
  isOpen,
  jobId,
  packageName,
  onClose,
  onComplete,
}: AuditProgressModalProps) {
  const [job, setJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Store onComplete in a ref to avoid re-triggering polling effect when inline functions are recreated in the parent component
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen || !jobId) return;

    // Reset state
    setJob(null);
    setError(null);

    let hasCompleted = false;

    const poll = async () => {
      try {
        const res = await getJobStatus(jobId);
        if (res.error) {
          setError(res.error);
          return;
        }
        if (res.data) {
          setJob(res.data);
          if (res.data.status === "done" && !hasCompleted) {
            hasCompleted = true;
            onCompleteRef.current();
          } else if (res.data.status === "failed") {
            setError(res.data.error_log || "Audit failed unexpectedly.");
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch status.");
      }
    };

    poll(); // Initial run
    const interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  const status = job?.status || "queued";
  const completedTasks = job?.completed_tasks || 0;
  const totalTasks = job?.total_tasks || 0;

  const steps = [
    {
      id: "queued",
      label: "Job Queued",
      description: "Waiting in the pipeline background queue...",
      isCompleted: ["scraping", "matching", "reporting", "done"].includes(status),
      isActive: status === "queued",
    },
    {
      id: "scraping",
      label: "Scraping Competitor Prices",
      description: status === "scraping" 
        ? `Fetching prices: component ${completedTasks} of ${totalTasks}...`
        : "Scraping Booking.com and Agoda in parallel",
      isCompleted: ["matching", "reporting", "done"].includes(status),
      isActive: status === "scraping",
    },
    {
      id: "matching",
      label: "AI Room Matching",
      description: "Comparing room details and currency with LLM Matcher",
      isCompleted: ["reporting", "done"].includes(status),
      isActive: status === "matching",
    },
    {
      id: "reporting",
      label: "Generating Analysis Report",
      description: "Aggregating price differentials and calculating margins",
      isCompleted: ["done"].includes(status),
      isActive: status === "reporting",
    },
    {
      id: "done",
      label: "Completed",
      description: "Competitiveness report successfully generated!",
      isCompleted: status === "done",
      isActive: false,
    },
  ];

  let progressPct = 0;
  if (status === "queued") progressPct = 10;
  else if (status === "scraping") {
    const taskRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;
    progressPct = 15 + Math.round(taskRatio * 55);
  } else if (status === "matching") progressPct = 75;
  else if (status === "reporting") progressPct = 90;
  else if (status === "done") progressPct = 100;
  else if (status === "failed") progressPct = 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg p-8 rounded-3xl border border-zinc-800 bg-zinc-950/90 shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Pricing Audit in Progress
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Auditing <span className="text-sky-400 font-semibold">{packageName}</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              status === "failed" ? "bg-red-500" : "bg-gradient-to-r from-sky-500 to-sky-400"
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-5 mt-2">
          {steps.map((step, idx) => {
            const isCompleted = step.isCompleted;
            const isActive = step.isActive;
            
            let Icon = Radio;
            let iconColor = "text-gray-600 border-zinc-800";
            
            if (isCompleted) {
              Icon = CheckCircle2;
              iconColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/10";
            } else if (isActive) {
              Icon = Loader2;
              iconColor = "text-sky-400 border-sky-500/20 bg-sky-500/10";
            }

            return (
              <div key={step.id} className="flex gap-4 items-start">
                <div className="relative flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all ${iconColor}`}>
                    <Icon size={16} className={isActive ? "animate-spin" : ""} />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 h-10 mt-1 transition-all ${
                      isCompleted ? "bg-emerald-500/30" : "bg-zinc-900"
                    }`} />
                  )}
                </div>
                
                <div className="flex flex-col pt-0.5">
                  <span className={`text-sm font-semibold transition-colors ${
                    isCompleted ? "text-gray-300" : isActive ? "text-sky-400" : "text-gray-500"
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-4 rounded-xl border border-red-950/40 bg-red-950/20 flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
              <XCircle size={16} />
              <span>Audit Execution Failed</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-h-24 overflow-y-auto font-mono">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          {status === "done" && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-black transition-colors cursor-pointer"
            >
              Done
            </button>
          )}
          {status === "failed" && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
          {status !== "done" && status !== "failed" && (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-gray-500 select-none cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 size={12} className="animate-spin" />
              <span>Analyzing Competitors...</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
