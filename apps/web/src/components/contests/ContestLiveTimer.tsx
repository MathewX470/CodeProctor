"use client";

import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endContestServer } from "@/app/actions/contests";

export function ContestLiveTimer({ 
  userEndTime, 
  contestId 
}: { 
  userEndTime: string;
  contestId: string;
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const end = new Date(userEndTime).getTime();

    const checkTime = () => {
      const now = new Date().getTime();
      const distance = end - now;

      if (distance <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        // Automatically finish contest
        endContestServer(contestId).then(() => {
          toast.error("Contest time has expired! Redirecting to results...");
          router.refresh();
        });
        return;
      }

      setTimeLeft(distance);
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [userEndTime, contestId, router]);

  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const isLowTime = timeLeft < 5 * 60 * 1000; // Under 5 minutes

  return (
    <div className={`px-5 py-3 rounded-2xl border text-right transition-colors ${
      isLowTime 
        ? "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50" 
        : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
    }`}>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center justify-end gap-1.5 ${
        isLowTime ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"
      }`}>
        <Clock className={`w-3.5 h-3.5 ${isLowTime ? "animate-pulse" : ""}`} />
        Time Remaining
      </div>
      <div className={`text-2xl font-mono font-black ${
        isLowTime ? "text-red-600 dark:text-red-400 animate-pulse" : "text-blue-600 dark:text-blue-400"
      }`}>
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
    </div>
  );
}
