"use client";

import React, { useState } from "react";
import { Trophy, Search, Users, Medal, Clock, CheckCircle2 } from "lucide-react";

interface ContestLeaderboardTabProps {
  leaderboard: any[];
  problems: any[];
}

export function ContestLeaderboardTab({ leaderboard, problems }: ContestLeaderboardTabProps) {
  const [search, setSearch] = useState("");

  const filtered = leaderboard.filter(m => 
    m.name?.toLowerCase().includes(search.toLowerCase()) || 
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Live Contest Leaderboard
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked standings of all {leaderboard.length} enrolled contestant(s) by score and ICPC penalty.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contestant..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 dark:text-zinc-200"
          />
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {leaderboard.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-zinc-300">No contestants enrolled yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Once candidates join or are invited, their live performance and solve status will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <th className="py-4 px-6 w-16 text-center">Rank</th>
                  <th className="py-4 px-6">Contestant</th>
                  <th className="py-4 px-6 text-center">Score</th>
                  <th className="py-4 px-6 text-center">Solved</th>
                  <th className="py-4 px-6 text-center">Penalty</th>
                  {problems.map((p: any, i: number) => (
                    <th key={p.id || i} className="py-4 px-4 text-center min-w-[70px]" title={p.title || p.problem?.title}>
                      Q{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filtered.map((member) => (
                  <tr 
                    key={member.userId} 
                    className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
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
                          {member.name ? member.name.slice(0, 2) : "U"}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-xs text-slate-400">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center font-bold text-blue-600 dark:text-blue-400 font-mono text-base">
                      {member.score}
                    </td>

                    <td className="py-4 px-6 text-center font-semibold text-slate-700 dark:text-zinc-300">
                      {member.solvedCount} / {problems.length}
                    </td>

                    <td className="py-4 px-6 text-center font-mono text-slate-500 dark:text-zinc-400">
                      {member.penalty}m
                    </td>

                    {/* Per-problem results */}
                    {member.problemResults?.map((pr: any, pIdx: number) => (
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
                        ) : pr.partiallySolved ? (
                          <div className="inline-block px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                            <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                              +{pr.points}
                            </div>
                            <div className="text-[10px] text-amber-500 font-mono">
                              {pr.passedCases !== undefined && pr.totalCases !== undefined ? `${pr.passedCases}/${pr.totalCases}` : `${pr.timeMins}m`}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
