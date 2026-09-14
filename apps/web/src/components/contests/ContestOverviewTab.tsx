"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, Clock, Users, Trophy, Code2, Globe, 
  Lock, Copy, Check, ShieldCheck, ArrowRight, 
  BarChart3, FileQuestion, UserPlus, Settings
} from "lucide-react";
import { toast } from "sonner";

interface ContestOverviewTabProps {
  contest: any;
  totalPoints: number;
}

export function ContestOverviewTab({ contest, totalPoints }: ContestOverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const isUpcoming = now < startTime;
  const isActive = now >= startTime && now <= endTime;
  const isEnded = now > endTime;

  const handleCopyJoinCode = () => {
    if (!contest.joinCode) return;
    navigator.clipboard.writeText(contest.joinCode);
    setCopied(true);
    toast.success("Contest Join Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Contest Status & Basic Info Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isActive 
                  ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/50" 
                  : isUpcoming 
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50" 
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400"
              }`}>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {isActive ? "Active Now" : isUpcoming ? "Upcoming Contest" : "Concluded"}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                {contest.settings?.isPublic ? (
                  <><Globe className="w-3 h-3 text-blue-500" /> Public</>
                ) : (
                  <><Lock className="w-3 h-3 text-amber-500" /> Private</>
                )}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-500" /> Normal Contest
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {contest.title}
            </h2>

            {contest.description ? (
              <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                {contest.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No description provided for this contest.</p>
            )}
          </div>

          {/* Join Code Card */}
          {contest.joinCode && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl shrink-0 space-y-1 text-center sm:text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Participant Join Code
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-black text-blue-600 dark:text-blue-400 tracking-wider">
                  {contest.joinCode}
                </span>
                <button
                  onClick={handleCopyJoinCode}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                  title="Copy Join Code"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Schedule & Timing Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Start Time</div>
              <div className="font-semibold text-slate-800 dark:text-zinc-200">
                {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">End Time</div>
              <div className="font-semibold text-slate-800 dark:text-zinc-200">
                {endTime.toLocaleDateString()} at {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Duration Limit</div>
              <div className="font-semibold text-slate-800 dark:text-zinc-200">
                {contest.duration} Minutes per attempt
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Contestants</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {contest._count?.members || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Enrolled participants</div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Problems</span>
            <FileQuestion className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {contest.problems.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Total questions in set</div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Max Points</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {totalPoints}
          </div>
          <div className="text-xs text-slate-400 mt-1">Achievable score</div>
        </div>

        <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Submissions</span>
            <Code2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {contest._count?.submissions || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Evaluated by judge</div>
        </div>
      </div>

      {/* Organizer Quick Actions Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href={`/contests/${contest.id}/manage?tab=problems`}
          className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-blue-500/50 rounded-2xl transition-all group flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Manage Problems</div>
              <div className="text-xs text-slate-400">Add, reorder & set points</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href={`/contests/${contest.id}/manage?tab=participants`}
          className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-green-500/50 rounded-2xl transition-all group flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Participants</div>
              <div className="text-xs text-slate-400">Invite & view roster</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href={`/contests/${contest.id}/manage?tab=leaderboard`}
          className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-amber-500/50 rounded-2xl transition-all group flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Live Leaderboard</div>
              <div className="text-xs text-slate-400">Scores & solve times</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href={`/contests/${contest.id}/manage?tab=analytics`}
          className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:border-purple-500/50 rounded-2xl transition-all group flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Contest Analytics</div>
              <div className="text-xs text-slate-400">Submissions & solvability</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Current Problem Set Summary */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assigned Problems ({contest.problems.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Problems contestants will be given to solve</p>
          </div>
          <Link
            href={`/contests/${contest.id}/manage?tab=problems`}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Edit Problems
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {contest.problems.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No problems assigned yet. Go to the Problems tab to search and add problems.
            </div>
          ) : (
            contest.problems.map((cp: any, idx: number) => (
              <div key={cp.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {cp.problem.title}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      cp.problem.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      cp.problem.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {cp.problem.difficulty}
                    </span>
                  </div>
                </div>

                <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                  {cp.points} pts
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
