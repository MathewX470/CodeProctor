"use client";

import React from "react";
import { ShieldAlert, AlertTriangle, Maximize, ExternalLink, XOctagon, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProctorViolationEvent } from "@/hooks/useStrictProctor";

interface StrictProctorOverlayProps {
  contestId: string;
  enabled: boolean;
  requireFullScreen: boolean;
  isFullscreen: boolean;
  violationCount: number;
  maxViolations?: number;
  isDisqualified: boolean;
  disqualifiedReason?: string | null;
  activeViolation: ProctorViolationEvent | null;
  isOpen: boolean;
  onEnterFullscreen: () => void;
  onDismiss?: () => void;
}

export function StrictProctorOverlay({
  contestId,
  enabled,
  requireFullScreen,
  isFullscreen,
  violationCount,
  maxViolations = 3,
  isDisqualified,
  disqualifiedReason,
  activeViolation,
  isOpen,
  onEnterFullscreen,
  onDismiss
}: StrictProctorOverlayProps) {
  const router = useRouter();

  if (!enabled) return null;

  // 1. DISQUALIFIED SCREEN
  if (isDisqualified) {
    return (
      <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center shadow-2xl shadow-red-950/50 animate-in fade-in zoom-in duration-200">
          <div className="w-20 h-20 bg-red-500/10 border-2 border-red-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <XOctagon className="w-10 h-10 text-red-500 animate-pulse" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 mb-4">
            Contest Assessment Terminated
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            You Have Been Disqualified
          </h2>

          <p className="text-sm text-slate-400 mb-6">
            The contest organizer has reviewed your integrity activity log and issued a disqualification.
          </p>

          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 text-left mb-6">
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
              Disqualification Reason
            </div>
            <div className="text-sm text-red-200 font-medium break-words">
              {disqualifiedReason || `Accumulated ${violationCount} proctoring violations.`}
            </div>
          </div>

          <button
            onClick={() => router.push(`/contests/${contestId}`)}
            className="w-full py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all flex items-center justify-center gap-2"
          >
            Return to Contest Hub
          </button>
        </div>
      </div>
    );
  }

  // 2. FULLSCREEN GATEWAY (INITIAL ENTRY)
  const needsInitialFullscreen = requireFullScreen && !isFullscreen && violationCount === 0 && !isOpen;
  if (needsInitialFullscreen) {
    return (
      <div className="fixed inset-0 z-[99990] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-7 text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Maximize className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
            Fullscreen Proctoring Required
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            This contest runs under strict integrity rules. You must enter fullscreen mode before you can view problems and write code.
          </p>

          <div className="bg-slate-800/60 rounded-xl p-4 text-left space-y-2.5 text-xs text-slate-300 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Fullscreen mode is strictly enforced</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Tab switches and minimizing window are logged</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Clipboard copying and pasting is disabled</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Window and tab changes are recorded for organizer review</span>
            </div>
          </div>

          <button
            onClick={onEnterFullscreen}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Maximize className="w-4 h-4" />
            Enter Fullscreen & Start
          </button>
        </div>
      </div>
    );
  }

  // 3. ACTIVE VIOLATION ALERT / FULLSCREEN LOST OVERLAY
  const shouldShowWarning = isOpen || (requireFullScreen && !isFullscreen);

  if (!shouldShowWarning) return null;

  return (
    <div className="fixed inset-0 z-[99995] bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-amber-500/40 shadow-2xl shadow-amber-950/40 rounded-2xl p-7 text-center animate-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border bg-amber-500/10 border-amber-500/30 text-amber-400">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        {/* Window Changes Badge */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40">
            Window Change #{violationCount} Logged
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
          Warning: Focus Lost / Tab Switch Detected
        </h2>

        <p className="text-xs text-slate-300 mb-5 leading-relaxed">
          {activeViolation?.description || (
            !isFullscreen 
              ? "You exited fullscreen mode. You must return to fullscreen immediately to continue your assessment."
              : "You switched away from the contest tab or window. This action has been recorded."
          )}
        </p>

        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 text-xs text-amber-300/90 font-medium mb-6 text-left">
          <div className="font-bold text-amber-400 mb-0.5">Note to Candidate:</div>
          Every window switch and fullscreen exit is logged with timestamps in the contest organizer's audit feed. The contest creator reviews this log and has the discretion to disqualify participants.
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {requireFullScreen && !isFullscreen ? (
            <button
              onClick={onEnterFullscreen}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Maximize className="w-4 h-4" />
              Return to Fullscreen & Resume
            </button>
          ) : (
            <button
              onClick={onDismiss}
              className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/25 transition-all flex items-center justify-center gap-2 text-sm"
            >
              I Understand, Resume Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
