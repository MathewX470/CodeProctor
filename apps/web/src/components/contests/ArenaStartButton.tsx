"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play, ShieldAlert, Maximize, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { startContestTimer } from "@/app/actions/contests";

interface ArenaStartButtonProps {
  contestId: string;
  firstProblemId?: string;
  requireFullScreen?: boolean;
}

export function ArenaStartButton({ 
  contestId, 
  firstProblemId, 
  requireFullScreen = false 
}: ArenaStartButtonProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);

    // Request fullscreen immediately on trusted user gesture
    if (requireFullScreen && typeof document !== "undefined" && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn("Fullscreen request error:", err);
      }
    }

    const res = await startContestTimer(contestId);
    if (res.success) {
      setShowConfirmModal(false);
      toast.success(
        requireFullScreen 
          ? "Assessment started in Fullscreen Mode! Good luck." 
          : "Timer started! Good luck."
      );
      if (firstProblemId) {
        router.push(`/contests/${contestId}/problems/${firstProblemId}`);
      } else {
        router.refresh();
      }
    } else {
      toast.error(res.error || "Failed to start contest.");
      setIsStarting(false);
    }
  };

  const onButtonClick = () => {
    if (requireFullScreen) {
      setShowConfirmModal(true);
    } else {
      handleStart();
    }
  };

  return (
    <>
      <button
        onClick={onButtonClick}
        disabled={isStarting}
        className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
      >
        {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
        {isStarting ? "Starting..." : "Start Assessment"}
      </button>

      {/* Strict Proctoring Pre-Start Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={isStarting}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-3">
              Fullscreen Proctoring
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Ready to Start Assessment?
            </h3>

            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-5 leading-relaxed">
              This contest enforces strict integrity rules. Your browser will lock into fullscreen mode as soon as you proceed.
            </p>

            <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-600 dark:text-zinc-300 mb-6 border border-slate-200 dark:border-zinc-700/60">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                <span>Entering fullscreen is mandatory for assessment</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Window switches and minimizing will be recorded</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                <span>Clipboard copy and code paste are blocked</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-zinc-400 pt-1 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Contest creator audits all window changes for disqualification</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isStarting}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={isStarting}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-sm flex items-center justify-center gap-2"
              >
                {isStarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
                {isStarting ? "Launching..." : "Agree & Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
