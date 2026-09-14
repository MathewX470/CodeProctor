"use client";

import React from "react";
import { BarChart3, Code2, Users, Trophy, CheckCircle2, TrendingUp } from "lucide-react";

interface ContestAnalyticsTabProps {
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
  totalParticipants: number;
  totalPoints: number;
}

export function ContestAnalyticsTab({ analytics, totalParticipants, totalPoints }: ContestAnalyticsTabProps) {
  const problemAnalytics = analytics.problemAnalytics || [];

  // Solves by difficulty
  const easyProblems = problemAnalytics.filter(p => p.difficulty === "EASY");
  const mediumProblems = problemAnalytics.filter(p => p.difficulty === "MEDIUM");
  const hardProblems = problemAnalytics.filter(p => p.difficulty === "HARD");

  const calcAvgSolveRate = (items: typeof problemAnalytics) => {
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, i) => acc + i.solveRate, 0);
    return Math.round(sum / items.length);
  };

  return (
    <div className="space-y-8">
      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Submissions Volume</span>
            <Code2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics.totalSubmissions}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
            Total candidate code executions evaluated by judge
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Contestants</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {totalParticipants}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
            Enrolled participant members
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Score Pool</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {totalPoints} pts
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
            Maximum score possible across all questions
          </p>
        </div>
      </div>

      {/* Difficulty Solve Rate Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
              Easy Problems ({easyProblems.length})
            </span>
            <span className="text-sm font-bold font-mono text-green-600 dark:text-green-400">
              {calcAvgSolveRate(easyProblems)}% solve rate
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${calcAvgSolveRate(easyProblems)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              Medium Problems ({mediumProblems.length})
            </span>
            <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">
              {calcAvgSolveRate(mediumProblems)}% solve rate
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${calcAvgSolveRate(mediumProblems)}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
              Hard Problems ({hardProblems.length})
            </span>
            <span className="text-sm font-bold font-mono text-red-600 dark:text-red-400">
              {calcAvgSolveRate(hardProblems)}% solve rate
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-red-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${calcAvgSolveRate(hardProblems)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Problem Acceptance & Solve Rate Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Problem Solvability & Statistics
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Breakdown of submission attempts, successful solvers, and acceptance rate per problem.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {problemAnalytics.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">
              No problems assigned to this contest.
            </div>
          ) : (
            problemAnalytics.map((pa, idx) => (
              <div key={pa.problemId} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-zinc-400 shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {pa.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pa.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" :
                        pa.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                      }`}>
                        {pa.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{pa.points} Points</span>
                      <span>•</span>
                      <span>{pa.totalSubmissions} Total Attempts</span>
                      <span>•</span>
                      <span>{pa.acceptedCount} Solvers</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-zinc-300 font-mono">
                      <span>Solve Rate</span>
                      <span>{pa.solveRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pa.solveRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
