"use client";

import React, { useState, useEffect } from "react";
import { Clock, ShieldCheck, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";

interface ContestCardProps {
  id: string;
  title: string;
  description: string | null;
  startTime: string | Date;
  endTime: string | Date;
  duration: number;
  settings?: {
    proctoringMode?: string;
    requireCamera?: boolean;
    requireFullScreen?: boolean;
    detectTabSwitch?: boolean;
  } | null;
}

export function ContestCard({
  id,
  title,
  description,
  startTime,
  endTime,
  duration,
  settings,
}: ContestCardProps) {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    const initialTimeout = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(timer);
    };
  }, []);

  const isActive = now > 0 && now >= start && now <= end;
  const isUpcoming = now === 0 || now < start;

  // Format countdown clock
  const formatDiff = (target: number, current: number) => {
    const diff = Math.max(0, Math.floor((target - current) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timerText = isActive
    ? `Live &bull; Ends in ${formatDiff(end, now)}`
    : isUpcoming
    ? `Starts in ${formatDiff(start, now)}`
    : `Contest Ended`;

  const proctorMode = settings?.proctoringMode || "AI Proctored";

  return (
    <div className={`bg-white dark:bg-zinc-900/60 border rounded-2xl p-6 relative flex flex-col justify-between transition-all duration-300 ${
      isActive 
        ? "border-blue-200 dark:border-white/[0.08] shadow-lg shadow-blue-50 dark:shadow-none dark:bg-white/[0.02]" 
        : "border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none"
    }`}>
      
      {/* Top Status Bar & Clock */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-zinc-800/80 text-xs transition-colors">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isActive ? "bg-blue-500 dark:bg-white animate-pulse" : isUpcoming ? "bg-orange-400" : "bg-slate-300 dark:bg-zinc-600"}`} />
            <span className={`font-semibold ${isActive ? "text-blue-700 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" : isUpcoming ? "text-orange-600 dark:text-zinc-300" : "text-slate-500 dark:text-zinc-500"}`}>
              {isActive ? "Live Arena Active" : isUpcoming ? "Upcoming Contest" : "Completed"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-950 px-3 py-1 border border-slate-200 dark:border-zinc-800 rounded-full text-slate-700 dark:text-zinc-300 font-mono text-xs transition-colors">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
            <span>{timerText.replace("&bull;", "•")}</span>
          </div>
        </div>

        {/* Title & Specs */}
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-zinc-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6 line-clamp-2 leading-relaxed transition-colors">
          {description || "Proctored competitive coding tournament under strict algorithmic validation protocols."}
        </p>

        {/* Proctoring Readiness Requirements */}
        <div className="flex flex-wrap gap-2 mb-6 text-xs">
          <div className="px-3 py-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 transition-colors">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Mode: {proctorMode.replace(/_/g, " ")}</span>
          </div>
          {settings?.requireCamera && (
            <div className="px-3 py-1 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-lg text-slate-700 dark:text-zinc-300 font-medium transition-colors">
              Webcam Required
            </div>
          )}
          {settings?.detectTabSwitch && (
            <div className="px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-500 dark:text-zinc-500 transition-colors">
              Tab-Lock Active
            </div>
          )}
          <div className="px-3 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-500 dark:text-zinc-500 font-mono transition-colors">
            {duration} mins
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between transition-colors">
        <span className="text-xs text-slate-400 dark:text-zinc-600 font-mono">
          ID: {id.slice(-8)}
        </span>

        {isActive ? (
          <button
            onClick={() => toast.success("Arena Initialized", { description: "Entering assessment sandbox..." })}
            className="px-5 py-2.5 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-200 dark:shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-white dark:fill-zinc-950" />
            <span>Enter Arena</span>
          </button>
        ) : isUpcoming ? (
          <button
            onClick={() => toast.info("Registered for Contest", { description: "We will notify you via telemetry when ignition occurs." })}
            className="px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm dark:shadow-none"
          >
            <span>Register Notification</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="px-4 py-2 font-medium text-xs text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 rounded-xl cursor-not-allowed transition-colors">
            Archived
          </span>
        )}
      </div>
    </div>
  );
}
