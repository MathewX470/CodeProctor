"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, ArrowUpRight, Code2, Sparkles, X } from "lucide-react";

interface Tag {
  id: string;
  name: string;
}

interface ProblemItem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  timeLimit: number;
  memoryLimit: number;
  tags: string[];
}

interface ProblemBankGridProps {
  initialProblems: ProblemItem[];
  availableTags: Tag[];
}

export function ProblemBankGrid({ initialProblems, availableTags }: ProblemBankGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  // Filter algorithmic challenges
  const filteredProblems = useMemo(() => {
    return initialProblems.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchDifficulty = selectedDifficulty === "ALL" || p.difficulty === selectedDifficulty;
      const matchTag = selectedTag === "ALL" || p.tags.includes(selectedTag);

      return matchSearch && matchDifficulty && matchTag;
    });
  }, [initialProblems, searchQuery, selectedDifficulty, selectedTag]);

  return (
    <div className="space-y-8">
      
      {/* Search & Filter Controls Card */}
      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl space-y-6 shadow-sm dark:shadow-lg backdrop-blur-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title, slug or tag..."
              className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-zinc-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-zinc-500 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 text-sm rounded-xl outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty Pill Buttons */}
          <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
            <span className="text-slate-500 dark:text-zinc-500 mr-1 flex items-center gap-1.5 transition-colors">
              <Filter className="w-3.5 h-3.5" />
              <span>Difficulty:</span>
            </span>
            {["ALL", "EASY", "MEDIUM", "HARD"].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedDifficulty(tier)}
                className={`px-3.5 py-1.5 rounded-full transition-all font-medium ${
                  selectedDifficulty === tier
                    ? "bg-blue-600 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-md shadow-blue-200 dark:shadow-white/10"
                    : "bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                {tier === "ALL" ? "All Tiers" : tier.charAt(0) + tier.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Tag Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 dark:border-zinc-800/80 text-xs transition-colors">
          <span className="text-slate-500 dark:text-zinc-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
            <span>Topics:</span>
          </span>
          <button
            onClick={() => setSelectedTag("ALL")}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              selectedTag === "ALL"
                ? "bg-blue-50 dark:bg-white/[0.08] text-blue-700 dark:text-white border border-blue-100 dark:border-white/[0.1]"
                : "bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200"
            }`}
          >
            All Domains
          </button>
          {availableTags.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTag(t.name)}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                selectedTag === t.name
                  ? "bg-blue-50 dark:bg-white/[0.08] text-blue-700 dark:text-white border border-blue-100 dark:border-white/[0.1]"
                  : "bg-white dark:bg-zinc-950 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:text-slate-900 dark:hover:text-zinc-200"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Results Table Grid */}
      <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden backdrop-blur-sm transition-colors">
        
        {/* Table Header */}
        <div className="bg-slate-50/80 dark:bg-zinc-950/80 px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between text-xs font-medium transition-colors">
          <div className="flex items-center gap-2.5 text-slate-600 dark:text-zinc-300">
            <Code2 className="w-4 h-4 text-slate-400 dark:text-zinc-400" />
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-semibold">{filteredProblems.length}</strong> of {initialProblems.length} challenges
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-zinc-500 font-mono">
            Timeout: Strict &bull; Memory: Bounded
          </span>
        </div>

        {/* Table Body / Rows */}
        {filteredProblems.length === 0 ? (
          <div className="p-16 text-center text-sm text-slate-500 dark:text-zinc-400 space-y-3 transition-colors">
            <div>No algorithmic challenges match your current filters.</div>
            <button
              onClick={() => { setSearchQuery(""); setSelectedDifficulty("ALL"); setSelectedTag("ALL"); }}
              className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium rounded-xl transition-all inline-block mt-2"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/80 transition-colors">
            {filteredProblems.map((p, index) => (
              <div
                key={p.id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-zinc-900/80 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Problem Info */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 dark:text-zinc-500 transition-colors">
                      #{String(index + 101).padStart(3, "0")}
                    </span>
                    <Link
                      href={`/problems/${p.slug}`}
                      className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-zinc-200 transition-colors"
                    >
                      {p.title}
                    </Link>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        p.difficulty === "EASY"
                          ? "bg-green-50 dark:bg-white/[0.08] text-green-700 dark:text-white border border-green-200 dark:border-white/[0.1]"
                          : p.difficulty === "MEDIUM"
                          ? "bg-yellow-50 dark:bg-white/[0.04] text-yellow-700 dark:text-zinc-300 border border-yellow-200 dark:border-white/[0.05]"
                          : "bg-red-50 dark:bg-zinc-950 text-red-700 dark:text-zinc-400 border border-red-200 dark:border-zinc-800"
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </div>

                  {/* Tags & Judge Limits */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 transition-colors">
                    <span className="bg-white dark:bg-zinc-950 px-2.5 py-0.5 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-600 dark:text-zinc-300 font-mono text-[11px] transition-colors">
                      {p.timeLimit}ms
                    </span>
                    <span className="bg-white dark:bg-zinc-950 px-2.5 py-0.5 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-600 dark:text-zinc-400 font-mono text-[11px] transition-colors">
                      {p.memoryLimit}KB
                    </span>
                    <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
                    {p.tags.map((t) => (
                      <span key={t} className="text-slate-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 px-2.5 py-0.5 border border-slate-200 dark:border-zinc-800 rounded-md text-[11px] transition-colors">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <div className="shrink-0 flex items-center justify-end">
                  <Link
                    href={`/problems/${p.slug}`}
                    className="px-4 py-2.5 bg-white dark:bg-zinc-950 hover:bg-blue-600 dark:hover:bg-white border border-slate-200 dark:border-zinc-800 hover:border-blue-600 dark:hover:border-white text-slate-600 dark:text-zinc-300 hover:text-white dark:hover:text-zinc-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02] group/btn"
                  >
                    <span>Solve Challenge</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 dark:text-zinc-400 group-hover/btn:text-white dark:group-hover/btn:text-zinc-950 transition-colors" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
