import React from "react";
import { Search, Plus, Edit3, Archive, Trash2, Eye, EyeOff } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminProblemsPage() {
  const problems = [
    { id: 1, title: "Two Sum", difficulty: "EASY", author: "System", tags: ["Array", "Hash Table"], visibility: "Public" },
    { id: 2, title: "LRU Cache", difficulty: "MEDIUM", author: "System", tags: ["Design", "Linked List"], visibility: "Public" },
    { id: 3, title: "Graph Coloring", difficulty: "HARD", author: "Alice Smith", tags: ["Graph", "Backtracking"], visibility: "Private" },
    { id: 4, title: "Suboptimal Gaze Tracking", difficulty: "MEDIUM", author: "System", tags: ["Math", "Geometry"], visibility: "Public" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Problem Bank</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage the central repository of coding problems available to contests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search problems..." 
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            <span>Add Problem</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800/80 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Problem</th>
                <th className="px-6 py-4 font-semibold">Difficulty</th>
                <th className="px-6 py-4 font-semibold">Author</th>
                <th className="px-6 py-4 font-semibold">Tags</th>
                <th className="px-6 py-4 font-semibold">Visibility</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {problem.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      problem.difficulty === 'EASY' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      problem.difficulty === 'MEDIUM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-zinc-300">
                    {problem.author}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {problem.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400">
                      {problem.visibility === 'Public' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      {problem.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Edit Problem">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="Archive Problem">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete Problem">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
