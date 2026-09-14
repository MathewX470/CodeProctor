"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Trophy, Medal, CheckCircle2, XCircle, Clock, 
  BarChart3, Users, ChevronRight, ChevronDown, 
  Code2, Sparkles, ArrowLeft, Eye, X, Award, ShieldCheck
} from "lucide-react";

interface SubmissionHistoryItem {
  id: string;
  verdict: string | null;
  executionTime: number | null;
  memoryUsed: number | null;
  sourceCode: string;
  submittedAt: Date | string;
  status: string;
  language?: {
    name: string;
    slug?: string;
  };
}

interface ProblemBreakdownItem {
  id: string;
  title: string;
  difficulty: string;
  points: number;
  bestSubmission: SubmissionHistoryItem | null;
  history: SubmissionHistoryItem[];
}

interface LeaderboardMember {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  score: number;
  penalty: number;
  solvedCount: number;
  rank: number;
  problemResults: {
    problemId: string;
    solved: boolean;
    points: number;
    timeMins: number;
    wrongAttempts: number;
  }[];
}

interface ContestResultsDashboardProps {
  results: {
    contestId: string;
    title: string;
    duration: number;
    stats: {
      score: number;
      totalPossibleScore: number;
      rank: number;
      totalParticipants: number;
      solved: number;
      total: number;
      penalty: number;
      accuracy: number;
      minutesSpent: number;
      isOrganizer?: boolean;
    };
    problems: ProblemBreakdownItem[];
    leaderboard: LeaderboardMember[];
    analytics: {
      totalSubmissions: number;
      problemAnalytics: {
        problemId: string;
        title: string;
        difficulty: string;
        points: number;
        totalSubmissions: number;
        acceptedCount: number;
        solveRate: number;
      }[];
    };
  };
  currentUserId: string;
  isOrganizer?: boolean;
}

export function ContestResultsDashboard({ results, currentUserId, isOrganizer }: ContestResultsDashboardProps) {
  const stats = results.stats;
  const organizer = isOrganizer || stats.isOrganizer;

  const [activeTab, setActiveTab] = useState<"problems" | "leaderboard" | "analytics">(
    organizer ? "leaderboard" : "problems"
  );
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(results.problems[0]?.id || null);
  const [selectedCodeSubmission, setSelectedCodeSubmission] = useState<SubmissionHistoryItem | null>(null);

  // Medal styling for top ranks
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-sm">
          <Trophy className="w-4 h-4" /> 1st Place
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-400/10 text-slate-400 border border-slate-400/20 font-black text-sm">
          <Medal className="w-4 h-4" /> 2nd Place
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/10 text-amber-700 dark:text-amber-600 border border-amber-700/20 font-black text-sm">
          <Medal className="w-4 h-4" /> 3rd Place
        </div>
      );
    }
    if (rank <= 0) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-bold text-sm">
          Unranked
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-sm">
        Rank #{rank}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-10 space-y-8">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link 
          href="/contests" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contests
        </Link>
        <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
          Contest Concluded
        </div>
      </div>

      {/* Hero Performance Overview Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {organizer ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-black text-sm">
                  <ShieldCheck className="w-4 h-4" /> Contest Organizer
                </div>
              ) : (
                getRankBadge(stats.rank)
              )}
              <span className="text-xs text-slate-400 dark:text-zinc-500">
                {stats.totalParticipants} {stats.totalParticipants === 1 ? "contestant" : "contestants"} enrolled
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {results.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {organizer ? "Contest organizer dashboard & live standings" : "Assessment results and performance summary"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {organizer && (
              <Link
                href={`/contests/${results.contestId}/manage`}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
              >
                Manage Contest
              </Link>
            )}
            <Link
              href="/contests"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-8">
          {organizer ? (
            <>
              {/* Contestants */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Contestants
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {stats.totalParticipants}
                </div>
              </div>

              {/* Submissions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Submissions
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {results.analytics.totalSubmissions}
                </div>
              </div>

              {/* Questions */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Problems
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.total}
                </div>
              </div>

              {/* Total Points */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Max Points
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                  {stats.totalPossibleScore}
                </div>
              </div>

              {/* Duration */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Duration
                </div>
                <div className="text-2xl font-black text-green-600 dark:text-green-500">
                  {results.duration}m
                </div>
              </div>

              {/* Leader Score */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Top Score
                </div>
                <div className="text-2xl font-black text-slate-700 dark:text-zinc-300">
                  {results.leaderboard[0]?.score ?? 0}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Score */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Score
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {stats.score}
                  <span className="text-xs font-normal text-slate-400 dark:text-zinc-500"> / {stats.totalPossibleScore}</span>
                </div>
              </div>

              {/* Rank */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Rank
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats.rank > 0 ? `#${stats.rank}` : "-"}
                </div>
              </div>

              {/* Solved */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Solved
                </div>
                <div className="text-2xl font-black text-green-600 dark:text-green-500">
                  {stats.solved} / {stats.total}
                </div>
              </div>

              {/* Penalty */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Penalty
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-500">
                  {stats.penalty}m
                </div>
              </div>

              {/* Accuracy */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Accuracy
                </div>
                <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  {stats.accuracy}%
                </div>
              </div>

              {/* Time Spent */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mb-1">
                  Time Spent
                </div>
                <div className="text-2xl font-black text-slate-700 dark:text-zinc-300">
                  {stats.minutesSpent}m
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 gap-8">
        <button
          onClick={() => setActiveTab("problems")}
          className={`py-4 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "problems"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Code2 className="w-4 h-4" />
          Problem Breakdown & Code ({results.problems.length})
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`py-4 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "leaderboard"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Standings & Leaderboard ({results.leaderboard.length})
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`py-4 px-1 text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === "analytics"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Contest Analytics
        </button>
      </div>

      {/* TAB 1: PROBLEM BREAKDOWN & SUBMISSION HISTORY */}
      {activeTab === "problems" && (
        <div className="space-y-4">
          {results.problems.map((prob, idx) => {
            const isAccepted = prob.bestSubmission?.verdict === "ACCEPTED";
            const hasAttempts = prob.history.length > 0;
            const isExpanded = expandedProblemId === prob.id;

            return (
              <div 
                key={prob.id} 
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                <div 
                  onClick={() => setExpandedProblemId(isExpanded ? null : prob.id)}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isAccepted 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : hasAttempts 
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {prob.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prob.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          prob.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {prob.difficulty}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                        <span className={`font-semibold flex items-center gap-1 ${
                          isAccepted ? "text-green-600 dark:text-green-400" :
                          hasAttempts ? "text-amber-600 dark:text-amber-400" :
                          "text-slate-400"
                        }`}>
                          {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : hasAttempts ? <XCircle className="w-3.5 h-3.5" /> : null}
                          {isAccepted ? "Solved" : hasAttempts ? `${prob.history.length} Attempt(s)` : "Unattempted"}
                        </span>

                        {isAccepted && prob.bestSubmission && (
                          <>
                            <span>•</span>
                            <span>Best Runtime: <strong className="text-slate-700 dark:text-zinc-300 font-mono">{prob.bestSubmission.executionTime} ms</strong></span>
                            <span>•</span>
                            <span>Memory: <strong className="text-slate-700 dark:text-zinc-300 font-mono">{prob.bestSubmission.memoryUsed} KB</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {isAccepted ? `+${prob.points}` : `0 / ${prob.points}`}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Points
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </div>

                {/* Collapsible Submission History */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                        Submission History ({prob.history.length})
                      </h4>
                    </div>

                    {prob.history.length === 0 ? (
                      <p className="text-sm text-slate-400 italic py-3">No submissions were recorded for this problem.</p>
                    ) : (
                      <div className="space-y-2">
                        {prob.history.map((sub, sIdx) => (
                          <div 
                            key={sub.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-sm hover:border-blue-400/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                sub.verdict === "ACCEPTED" 
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                              }`}>
                                #{prob.history.length - sIdx}
                              </span>

                              <div>
                                <span className={`font-semibold ${sub.verdict === "ACCEPTED" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                  {sub.verdict === "ACCEPTED" ? "✓ Accepted" : `✗ ${sub.verdict}`}
                                </span>
                                {sub.language?.name && (
                                  <span className="ml-2 text-xs text-slate-400 font-mono">({sub.language.name})</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-zinc-400">
                              <span>{sub.executionTime ? `${sub.executionTime} ms` : "-"}</span>
                              <span>{sub.memoryUsed ? `${sub.memoryUsed} KB` : "-"}</span>
                              <span className="text-slate-400">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                              
                              {sub.sourceCode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCodeSubmission(sub);
                                  }}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md font-sans text-xs font-medium flex items-center gap-1 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View Code
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: STANDINGS & FULL LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <th className="py-4 px-6 w-16 text-center">Rank</th>
                  <th className="py-4 px-6">Participant</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6 text-center">Penalty</th>
                  {results.problems.map((p, i) => (
                    <th key={p.id} className="py-4 px-4 text-center min-w-[80px]" title={p.title}>
                      Q{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {results.leaderboard.map((member) => {
                  const isCurrent = member.userId === currentUserId;

                  return (
                    <tr 
                      key={member.userId} 
                      className={`transition-colors ${
                        isCurrent 
                          ? "bg-blue-50/70 dark:bg-blue-950/20 font-semibold" 
                          : "hover:bg-slate-50/50 dark:hover:bg-zinc-800/30"
                      }`}
                    >
                      <td className="py-4 px-6 text-center font-mono font-bold">
                        {member.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">1</span>
                        ) : member.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300">2</span>
                        ) : member.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">3</span>
                        ) : (
                          `#${member.rank}`
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-zinc-300 uppercase">
                            {member.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {member.name}
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-600 text-white">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{member.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center font-bold text-blue-600 dark:text-blue-400 font-mono text-base">
                        {member.score}
                      </td>

                      <td className="py-4 px-6 text-center font-mono text-slate-500 dark:text-zinc-400">
                        {member.penalty}m
                      </td>

                      {/* Per-problem results */}
                      {member.problemResults.map((pr, pIdx) => (
                        <td key={pIdx} className="py-4 px-4 text-center">
                          {pr.solved ? (
                            <div className="inline-block px-2 py-1 rounded bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50">
                              <div className="text-xs font-bold text-green-600 dark:text-green-400 font-mono">
                                +{pr.points}
                              </div>
                              <div className="text-[10px] text-green-500 font-mono">
                                {pr.timeMins}m
                              </div>
                            </div>
                          ) : pr.wrongAttempts > 0 ? (
                            <div className="inline-block px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
                              <div className="text-xs font-bold text-red-600 dark:text-red-400 font-mono">
                                -{pr.wrongAttempts}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-zinc-700">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTEST ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Submissions</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {results.analytics.totalSubmissions}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                Evaluated by CodeProctor judge across all participants
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contestants</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {results.stats.totalParticipants}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                Registered members who attended
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Total Problem Points</div>
              <div className="text-3xl font-black text-slate-900 dark:text-white">
                {stats.totalPossibleScore}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
                Maximum possible score achievable
              </p>
            </div>
          </div>

          {/* Problem Analytics Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Problem Solvability & Statistics
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Acceptance rate and submissions volume per problem
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {results.analytics.problemAnalytics.map((pa, idx) => (
                <div key={pa.problemId} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-zinc-400">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-base">
                        {pa.title}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{pa.points} Points</span>
                        <span>•</span>
                        <span>{pa.totalSubmissions} Total Submissions</span>
                        <span>•</span>
                        <span>{pa.acceptedCount} Solvers</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 min-w-[180px]">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-zinc-300">
                        <span>Solve Rate</span>
                        <span>{pa.solveRate}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pa.solveRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CODE VIEW MODAL */}
      {selectedCodeSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 px-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-blue-500" />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Submitted Source Code
                  </h4>
                  <div className="text-xs text-slate-400 font-mono">
                    {selectedCodeSubmission.verdict} • {selectedCodeSubmission.language?.name || "Code"} • {new Date(selectedCodeSubmission.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCodeSubmission(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-950 text-slate-100 font-mono text-sm leading-relaxed whitespace-pre">
              <code>{selectedCodeSubmission.sourceCode}</code>
            </div>

            <div className="p-4 px-6 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex justify-end">
              <button
                onClick={() => setSelectedCodeSubmission(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
