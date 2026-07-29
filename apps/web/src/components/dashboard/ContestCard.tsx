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
    <div className={`bg-white border rounded-2xl p-6 relative flex flex-col justify-between transition-all duration-300 ${
      isActive ? "border-blue-200 shadow-lg shadow-blue-50" : "border-slate-200 hover:border-slate-300 shadow-sm"
    }`}>
      
      {/* Top Status Bar & Clock */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${isActive ? "bg-blue-500 animate-pulse" : isUpcoming ? "bg-orange-400" : "bg-slate-300"}`} />
            <span className={`font-semibold ${isActive ? "text-blue-700" : isUpcoming ? "text-orange-600" : "text-slate-500"}`}>
              {isActive ? "Live Arena Active" : isUpcoming ? "Upcoming Contest" : "Completed"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 border border-slate-200 rounded-full text-slate-700 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{timerText.replace("&bull;", "•")}</span>
          </div>
        </div>

        {/* Title & Specs */}
        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
          {description || "Proctored competitive coding tournament under strict algorithmic validation protocols."}
        </p>

        {/* Proctoring Readiness Requirements */}
        <div className="flex flex-wrap gap-2 mb-6 text-xs">
          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Mode: {proctorMode.replace(/_/g, " ")}</span>
          </div>
          {settings?.requireCamera && (
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
              Webcam Required
            </div>
          )}
          {settings?.detectTabSwitch && (
            <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
              Tab-Lock Active
            </div>
          )}
          <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono">
            {duration} mins
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-mono">
          ID: {id.slice(-8)}
        </span>

        {isActive ? (
          <button
            onClick={() => toast.success("Arena Initialized", { description: "Entering assessment sandbox..." })}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-200 hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Enter Arena</span>
          </button>
        ) : isUpcoming ? (
          <button
            onClick={() => toast.info("Registered for Contest", { description: "We will notify you via telemetry when ignition occurs." })}
            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Register Notification</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="px-4 py-2 font-medium text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed">
            Archived
          </span>
        )}
      </div>
    </div>
  );
}
