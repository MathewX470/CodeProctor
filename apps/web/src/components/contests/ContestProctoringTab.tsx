"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, AlertTriangle, XOctagon, CheckCircle2, 
  Search, RefreshCw, Eye, UserX, UserCheck, Clock, 
  Maximize, Copy, Laptop, ChevronRight, X
} from "lucide-react";
import { toast } from "sonner";
import { 
  getContestProctoringDataServer, 
  manualDisqualifyMemberServer, 
  pardonMemberServer 
} from "@/app/actions/contests";
import { ProctoringEvidenceTimeline } from "./ProctoringEvidenceTimeline";

export function ContestProctoringTab({ contestId }: { contestId: string }) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "CLEAN" | "AT_RISK" | "DISQUALIFIED">("ALL");
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getContestProctoringDataServer(contestId);
      setData(res);
    } catch (e: any) {
      toast.error(e.message || "Failed to load proctoring data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contestId]);

  const handleManualDisqualify = async (targetUserId: string, name: string) => {
    const reason = window.prompt(`Enter reason for disqualifying ${name}:`, "Manual disqualification by contest organizer");
    if (!reason) return;

    setActionLoading(targetUserId);
    try {
      const res = await manualDisqualifyMemberServer(contestId, targetUserId, reason);
      if (res.success) {
        toast.success(`${name} has been disqualified.`);
        loadData();
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePardon = async (targetUserId: string, name: string) => {
    if (!confirm(`Are you sure you want to pardon ${name}? This will reset their disqualification status and integrity log.`)) {
      return;
    }

    setActionLoading(targetUserId);
    try {
      const res = await pardonMemberServer(contestId, targetUserId);
      if (res.success) {
        toast.success(`${name} has been pardoned.`);
        loadData();
      }
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm font-semibold">Loading real-time proctoring data...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, participants, settings } = data;

  const filteredParticipants = participants.filter((p: any) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === "CLEAN") return p.totalViolations === 0 && !p.isDisqualified;
    if (filterStatus === "AT_RISK") return p.totalViolations > 0 && !p.isDisqualified;
    if (filterStatus === "DISQUALIFIED") return p.isDisqualified;
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header / Mode Banner */}
      <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Proctoring Mode: {settings?.proctoringMode || "NORMAL"}
            </span>
            {settings?.proctoringMode === "FULL_SCREEN" && (
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Strict Fullscreen Enabled
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Malpractice & Candidate Integrity Timeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Real-time audit log of candidate browser focus, fullscreen changes, and blocked clipboard actions.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-zinc-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Feed
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Candidates
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.totalParticipants}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Enrolled in contest</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Violations Logged
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {summary.totalViolations}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across all candidates</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            At-Risk Candidates
          </div>
          <div className="text-2xl font-black text-amber-500">
            {summary.atRiskCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Window changes recorded</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Disqualified
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {summary.disqualifiedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Disqualified by organizer</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 border border-slate-200 dark:border-zinc-800 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "All Candidates" },
            { id: "CLEAN", label: "Clean (0 Changes)" },
            { id: "AT_RISK", label: "Flagged (>0)" },
            { id: "DISQUALIFIED", label: "Disqualified" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors whitespace-nowrap ${
                filterStatus === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6 text-center">Status</th>
                {settings?.proctoringMode === "CV_PROCTORED" ? (
                  <>
                    <th className="py-4 px-6 text-center">Multi-Faces</th>
                    <th className="py-4 px-6 text-center">No Face / Dark</th>
                    <th className="py-4 px-6 text-center">Gaze Shift</th>
                    <th className="py-4 px-6 text-center">Focus / Fullscreen</th>
                  </>
                ) : (
                  <>
                    <th className="py-4 px-6 text-center">Tab Switches</th>
                    <th className="py-4 px-6 text-center">Fullscreen Exits</th>
                    <th className="py-4 px-6 text-center">Pastes Blocked</th>
                  </>
                )}
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No candidates found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-slate-600 dark:text-zinc-300">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </div>
                          <div className="text-slate-400 text-[11px]">{p.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      {p.isDisqualified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                          <XOctagon className="w-3 h-3" />
                          Disqualified
                        </span>
                      ) : p.totalViolations > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                          <AlertTriangle className="w-3 h-3" />
                          {p.totalViolations} {p.totalViolations === 1 ? "Event" : "Events"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                          <CheckCircle2 className="w-3 h-3" />
                          Clean
                        </span>
                      )}
                    </td>

                    {settings?.proctoringMode === "CV_PROCTORED" ? (
                      <>
                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {p.multipleFaces > 0 ? (
                            <span className="text-red-600 dark:text-red-400">{p.multipleFaces}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {(p.noFace + p.cameraBlocked) > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">{p.noFace + p.cameraBlocked}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {p.lookingAway > 0 ? (
                            <span className="text-purple-600 dark:text-purple-400">{p.lookingAway}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {(p.tabSwitches + p.fullscreenExits) > 0 ? (
                            <span className="text-blue-600 dark:text-blue-400">{p.tabSwitches + p.fullscreenExits}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {p.tabSwitches > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">{p.tabSwitches}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {p.fullscreenExits > 0 ? (
                            <span className="text-red-600 dark:text-red-400">{p.fullscreenExits}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-center font-mono font-bold">
                          {p.pastes > 0 ? (
                            <span className="text-purple-600 dark:text-purple-400">{p.pastes}</span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                      </>
                    )}

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.totalViolations > 0 && (
                          <button
                            onClick={() => setSelectedParticipant(p)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px] border border-blue-200 dark:border-blue-900/50"
                          >
                            <Eye className="w-3 h-3" />
                            Evidence ({p.totalViolations})
                          </button>
                        )}

                        {p.isDisqualified ? (
                          <button
                            onClick={() => handlePardon(p.userId, p.name)}
                            disabled={actionLoading === p.userId}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <UserCheck className="w-3 h-3" />
                            Pardon
                          </button>
                        ) : (
                          <button
                            onClick={() => handleManualDisqualify(p.userId, p.name)}
                            disabled={actionLoading === p.userId}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 font-bold rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                          >
                            <UserX className="w-3 h-3" />
                            Disqualify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Visual Evidence Timeline Dossier Modal */}
      {selectedParticipant && (
        <ProctoringEvidenceTimeline
          isOpen={Boolean(selectedParticipant)}
          onClose={() => setSelectedParticipant(null)}
          candidateName={selectedParticipant.name}
          candidateEmail={selectedParticipant.email}
          isDisqualified={selectedParticipant.isDisqualified}
          disqualifiedReason={selectedParticipant.disqualifiedReason}
          violations={selectedParticipant.violations || []}
          onDisqualify={() => handleManualDisqualify(selectedParticipant.userId, selectedParticipant.name)}
          onPardon={() => handlePardon(selectedParticipant.userId, selectedParticipant.name)}
        />
      )}
    </div>
  );
}
