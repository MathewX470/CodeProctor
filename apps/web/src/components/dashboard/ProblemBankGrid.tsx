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
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-2xl space-y-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title, slug or tag..."
              className="w-full pl-11 pr-10 py-3 bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-zinc-100 placeholder-zinc-500 text-sm rounded-xl outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty Pill Buttons */}
          <div className="flex items-center gap-2 text-xs font-medium flex-wrap">
            <span className="text-zinc-500 mr-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Difficulty:</span>
            </span>
            {["ALL", "EASY", "MEDIUM", "HARD"].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedDifficulty(tier)}
                className={`px-3.5 py-1.5 rounded-full transition-all font-medium ${
                  selectedDifficulty === tier
                    ? tier === "EASY"
                      ? "bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/20"
                      : tier === "MEDIUM"
                      ? "bg-amber-400 text-zinc-950 font-semibold shadow-md shadow-amber-400/20"
                      : tier === "HARD"
                      ? "bg-red-500 text-white font-semibold shadow-md shadow-red-500/20"
                      : "bg-white text-zinc-950 font-semibold shadow-md shadow-white/10"
                    : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                {tier === "ALL" ? "All Tiers" : tier.charAt(0) + tier.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Tag Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-800/80 text-xs">
          <span className="text-zinc-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Topics:</span>
          </span>
          <button
            onClick={() => setSelectedTag("ALL")}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              selectedTag === "ALL"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
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
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Problem Results Table Grid */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
        
        {/* Table Header */}
        <div className="bg-zinc-950/80 px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5 text-zinc-300">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>
              Showing <strong className="text-white font-semibold">{filteredProblems.length}</strong> of {initialProblems.length} challenges
            </span>
          </div>
          <span className="hidden sm:inline-block text-xs text-zinc-500 font-mono">
            Timeout: Strict &bull; Memory: Bounded
          </span>
        </div>

        {/* Table Body / Rows */}
        {filteredProblems.length === 0 ? (
          <div className="p-16 text-center text-sm text-zinc-400 space-y-3">
            <div>No algorithmic challenges match your current filters.</div>
            <button
              onClick={() => { setSearchQuery(""); setSelectedDifficulty("ALL"); setSelectedTag("ALL"); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-all inline-block mt-2"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredProblems.map((p, index) => (
              <div
                key={p.id}
                className="p-5 hover:bg-zinc-900/80 transition-colors group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Problem Info */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs text-zinc-500">
                      #{String(index + 101).padStart(3, "0")}
                    </span>
                    <Link
                      href={`/problems/${p.slug}`}
                      className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors"
                    >
                      {p.title}
                    </Link>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                        p.difficulty === "EASY"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : p.difficulty === "MEDIUM"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </div>

                  {/* Tags & Judge Limits */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                    <span className="bg-zinc-950 px-2.5 py-0.5 border border-zinc-800 rounded-md text-amber-400 font-mono text-[11px]">
                      ⚡ {p.timeLimit}ms
                    </span>
                    <span className="bg-zinc-950 px-2.5 py-0.5 border border-zinc-800 rounded-md text-zinc-400 font-mono text-[11px]">
                      💾 {p.memoryLimit}KB
                    </span>
                    <span className="text-zinc-600">&bull;</span>
                    {p.tags.map((t) => (
                      <span key={t} className="text-zinc-400 bg-zinc-950 px-2.5 py-0.5 border border-zinc-800 rounded-md text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Launch Button */}
                <div className="shrink-0 flex items-center justify-end">
                  <Link
                    href={`/problems/${p.slug}`}
                    className="px-4 py-2.5 bg-zinc-950 hover:bg-emerald-500 border border-zinc-800 hover:border-emerald-400 text-zinc-300 hover:text-zinc-950 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm hover:scale-[1.02]"
                  >
                    <span>Solve Challenge</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:text-zinc-950 transition-colors" />
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
