"use client";

import React, { useState } from "react";
import { 
  X, Eye, Users, AlertTriangle, ShieldAlert, Monitor, 
  Clock, CheckCircle2, XOctagon, ExternalLink, Filter 
} from "lucide-react";

export interface EvidenceViolationItem {
  id: string;
  type: string;
  subType?: string;
  severity: string;
  timestamp: string;
  durationSec: number;
  confidence: number;
  snapshotUrl?: string;
  metadata?: any;
}

interface ProctoringEvidenceTimelineProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName: string;
  candidateEmail: string;
  isDisqualified: boolean;
  disqualifiedReason?: string | null;
  violations: EvidenceViolationItem[];
  onDisqualify: () => void;
  onPardon: () => void;
}

export function ProctoringEvidenceTimeline({
  isOpen,
  onClose,
  candidateName,
  candidateEmail,
  isDisqualified,
  disqualifiedReason,
  violations,
  onDisqualify,
  onPardon,
}: ProctoringEvidenceTimelineProps) {
  const [filterType, setFilterType] = useState<"ALL" | "CV" | "BROWSER">("ALL");
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredViolations = violations.filter(v => {
    const isCv = ["NO_FACE", "MULTIPLE_FACES", "LOOKING_AWAY", "CAMERA_BLOCKED"].includes(v.subType || v.type);
    if (filterType === "CV") return isCv;
    if (filterType === "BROWSER") return !isCv;
    return true;
  });

  const getEventBadge = (v: EvidenceViolationItem) => {
    const effectiveType = v.subType || v.type;

    switch (effectiveType) {
      case "MULTIPLE_FACES":
        return {
          label: "Multiple Faces",
          icon: Users,
          badgeBg: "bg-red-500/10 text-red-500 border-red-500/30",
          cardBorder: "border-red-500/30",
        };
      case "CAMERA_BLOCKED":
        return {
          label: "Camera Blocked / Dark",
          icon: ShieldAlert,
          badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/30",
          cardBorder: "border-amber-500/30",
        };
      case "NO_FACE":
        return {
          label: "Face Not In Frame",
          icon: AlertTriangle,
          badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/30",
          cardBorder: "border-amber-500/20",
        };
      case "LOOKING_AWAY":
        return {
          label: "Gaze / Head Deviation",
          icon: Eye,
          badgeBg: "bg-purple-500/10 text-purple-500 border-purple-500/30",
          cardBorder: "border-purple-500/20",
        };
      case "FULLSCREEN_EXIT":
        return {
          label: "Fullscreen Exited",
          icon: Monitor,
          badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/30",
          cardBorder: "border-blue-500/20",
        };
      case "TAB_SWITCH":
        return {
          label: "Tab Switched",
          icon: Monitor,
          badgeBg: "bg-blue-500/10 text-blue-500 border-blue-500/30",
          cardBorder: "border-blue-500/20",
        };
      default:
        return {
          label: effectiveType.replace("_", " "),
          icon: Clock,
          badgeBg: "bg-slate-500/10 text-slate-400 border-slate-500/30",
          cardBorder: "border-slate-800",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-3xl w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100 dark:border-zinc-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Integrity Evidence Dossier
              </h2>
              {isDisqualified ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                  Disqualified
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                  Active
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-zinc-400">
              Candidate: <strong className="text-slate-800 dark:text-slate-200">{candidateName}</strong> ({candidateEmail}) &bull; {violations.length} total events recorded
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center justify-between py-3 shrink-0">
          <div className="flex items-center gap-1.5">
            {[
              { id: "ALL", label: `All Events (${violations.length})` },
              { id: "CV", label: `Camera / CV (${violations.filter(v => ["NO_FACE", "MULTIPLE_FACES", "LOOKING_AWAY", "CAMERA_BLOCKED"].includes(v.subType || v.type)).length})` },
              { id: "BROWSER", label: `Browser Focus (${violations.filter(v => !["NO_FACE", "MULTIPLE_FACES", "LOOKING_AWAY", "CAMERA_BLOCKED"].includes(v.subType || v.type)).length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                  filterType === tab.id 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            S3 Secure Presigned Assets
          </div>
        </div>

        {/* Chronological Event Cards List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 my-2">
          {filteredViolations.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No events recorded in this category for this candidate.
            </div>
          ) : (
            filteredViolations.map((v) => {
              const cfg = getEventBadge(v);
              const Icon = cfg.icon;

              return (
                <div 
                  key={v.id} 
                  className={`p-4 rounded-2xl border bg-slate-50/50 dark:bg-zinc-800/40 ${cfg.cardBorder} transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.badgeBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${cfg.badgeBg}`}>
                          {cfg.label}
                        </span>

                        {v.durationSec > 0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-700/80 text-slate-700 dark:text-zinc-200">
                            {v.durationSec}s Duration
                          </span>
                        )}

                        {v.confidence < 1.0 && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            {Math.round(v.confidence * 100)}% Conf
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
                        {v.metadata?.detail || v.metadata?.reason || `Recorded anomaly persisted for ${v.durationSec || 0} seconds.`}
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        Timestamp: {new Date(v.timestamp).toLocaleTimeString()} &bull; {new Date(v.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Visual S3 Snapshot Thumbnail */}
                  {v.snapshotUrl && (
                    <div className="shrink-0 flex items-center gap-2">
                      <div 
                        onClick={() => setSelectedSnapshot(v.snapshotUrl!)}
                        className="relative w-24 h-18 sm:w-28 sm:h-20 rounded-xl overflow-hidden border border-slate-300 dark:border-zinc-700 cursor-pointer hover:opacity-90 transition-all shadow-sm group"
                      >
                        <img 
                          src={v.snapshotUrl} 
                          alt="Violation evidence" 
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Organizer Action Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {isDisqualified ? (
              <span className="text-red-500 font-bold">Disqualification Reason: {disqualifiedReason}</span>
            ) : (
              <span>Inspect snapshots and duration before issuing a manual disqualification.</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isDisqualified ? (
              <button
                onClick={onPardon}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Pardon Candidate
              </button>
            ) : (
              <button
                onClick={onDisqualify}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <XOctagon className="w-4 h-4" />
                Disqualify Candidate
              </button>
            )}
          </div>
        </div>

        {/* Snapshot Lightbox Preview Modal */}
        {selectedSnapshot && (
          <div 
            onClick={() => setSelectedSnapshot(null)}
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 text-center shadow-2xl relative">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Evidence Frame Capture
              </div>

              <div className="rounded-2xl overflow-hidden bg-black aspect-[4/3] border border-slate-800">
                <img 
                  src={selectedSnapshot} 
                  alt="High resolution snapshot" 
                  className="w-full h-full object-contain scale-x-[-1]"
                />
              </div>

              <div className="mt-3 text-[11px] text-slate-400">
                Click anywhere outside or press Close to dismiss
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
