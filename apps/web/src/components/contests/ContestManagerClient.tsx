"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Plus, Trash2, Globe, Lock, SearchX } from "lucide-react";
import { toast } from "sonner";
import { searchProblemsForContest, addProblemToContest, removeProblemFromContest } from "@/app/actions/contests";
import { useRouter } from "next/navigation";

interface ProblemItem {
  id: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  isPublic?: boolean;
  isOwner?: boolean;
}

export function ContestManagerClient({ contest }: { contest: any }) {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProblemItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchProblemsForContest(searchQuery);
        setSearchResults(results as ProblemItem[]);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddProblem = async (problemId: string) => {
    const pointsStr = window.prompt("Enter point value for this problem (e.g. 100):", "100");
    if (!pointsStr) return;
    
    const points = parseInt(pointsStr, 10);
    if (isNaN(points) || points <= 0) {
      toast.error("Invalid point value");
      return;
    }

    setIsUpdating(problemId);
    const res = await addProblemToContest(contest.id, problemId, points);
    setIsUpdating(null);

    if (res.success) {
      toast.success("Problem added to contest!");
      // The server action revalidates the path, so Next.js will fetch new props.
    } else {
      toast.error(res.error || "Failed to add problem");
    }
  };

  const handleRemoveProblem = async (problemId: string) => {
    if (!window.confirm("Are you sure you want to remove this problem from the contest?")) return;

    setIsUpdating(problemId);
    const res = await removeProblemFromContest(contest.id, problemId);
    setIsUpdating(null);

    if (res.success) {
      toast.success("Problem removed");
    } else {
      toast.error(res.error || "Failed to remove problem");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT PANE: CURRENT PROBLEMS */}
      <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Current Problems</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
          Problems currently assigned to this contest. They will appear in this exact order.
        </p>

        {contest.problems.length === 0 ? (
          <div className="flex-1 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-8">
            <SearchX className="w-12 h-12 text-slate-300 dark:text-zinc-600 mb-4" />
            <h3 className="text-slate-700 dark:text-zinc-300 font-bold mb-1">No Problems Yet</h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400">Search for problems in the right panel and add them to your contest.</p>
          </div>
        ) : (
          <div className="space-y-3 flex-1 overflow-y-auto">
            {contest.problems.map((cp: any, idx: number) => (
              <div key={cp.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-lg group hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold flex items-center justify-center text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{cp.problem.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        cp.problem.difficulty === 'EASY' ? 'text-green-600 dark:text-green-400' :
                        cp.problem.difficulty === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {cp.problem.difficulty}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                        {cp.points} POINTS
                      </span>
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleRemoveProblem(cp.problemId)}
                  disabled={isUpdating === cp.problemId}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Remove from contest"
                >
                  {isUpdating === cp.problemId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANE: PROBLEM BANK SEARCH */}
      <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm min-h-[500px] flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Problem Bank</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
              Search the global bank or your own private problems.
            </p>
          </div>
          <button 
            onClick={() => router.push("/problems/create")}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Problem
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems by title..." 
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {isSearching ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : searchResults.length === 0 && searchQuery.trim() !== "" ? (
            <div className="text-center p-8 text-sm text-slate-500 dark:text-zinc-400">
              No problems found matching "{searchQuery}"
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map(p => {
              const alreadyAdded = contest.problems.some((cp: any) => cp.problemId === p.id);
              return (
                <div key={p.id} className="p-4 border border-slate-100 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{p.title}</h4>
                        {p.isPublic ? (
                          <span title="Public Problem"><Globe className="w-3 h-3 text-blue-500" /></span>
                        ) : p.isOwner ? (
                          <span title="Your Private Problem"><Lock className="w-3 h-3 text-amber-500" /></span>
                        ) : null}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        p.difficulty === 'EASY' ? 'text-green-600 dark:text-green-400' :
                        p.difficulty === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {p.difficulty}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddProblem(p.id)}
                      disabled={alreadyAdded || isUpdating === p.id}
                      className={`shrink-0 p-1.5 rounded-md transition-colors flex items-center justify-center ${
                        alreadyAdded 
                          ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-not-allowed'
                          : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                      }`}
                      title={alreadyAdded ? "Already in contest" : "Add to contest"}
                    >
                      {isUpdating === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="text-center p-8 text-sm text-slate-400 dark:text-zinc-600">
               Type to search problems...
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
