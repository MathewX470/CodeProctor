import React from "react";
import { prisma } from "@/lib/prisma";
import { ProblemBankGrid } from "@/components/dashboard/ProblemBankGrid";
import { Code2, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  // Fetch all public algorithmic problems with relationships
  const problems = await prisma.problem.findMany({
    where: { isPublic: true, isDeleted: false },
    include: {
      problemTags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: { difficulty: "asc" },
  });

  // Fetch available tags
  const tags = await prisma.tag.findMany({
    orderBy: { name: "asc" },
  });

  // Format data for client grid
  const initialProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty as string,
    timeLimit: p.timeLimit,
    memoryLimit: p.memoryLimit,
    tags: p.problemTags.map((pt) => pt.tag.name),
  }));

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-xl backdrop-blur-md transition-colors">
        <div className="absolute -top-12 -right-12 w-96 h-96 bg-blue-50 dark:bg-white/[0.03] blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-white/[0.03] border border-blue-100 dark:border-white/[0.06] rounded-full text-xs font-medium text-blue-700 dark:text-zinc-300 mb-4 transition-colors">
              <Code2 className="w-3.5 h-3.5 text-blue-500 dark:text-zinc-400" />
              <span>Algorithmic Challenge Catalog</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
              Problem Bank <span className="text-blue-600 dark:text-white font-semibold">Explorer</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed transition-colors">
              Select a challenge to open the CodeProctor interactive assessment environment. Each submission is evaluated for time, memory efficiency, and real-time behavioral fidelity.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col gap-1.5 shrink-0 text-right sm:min-w-[200px] shadow-sm dark:shadow-inner transition-colors">
            <span className="text-xs text-slate-500 dark:text-zinc-500 font-medium">Available Challenges</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{initialProblems.length} <span className="text-slate-500 dark:text-zinc-300 text-lg font-normal">Problems</span></span>
            <span className="text-xs text-slate-500 dark:text-zinc-500 flex items-center justify-end gap-1.5 pt-1 border-t border-slate-200 dark:border-zinc-800/80 transition-colors">
              <Terminal className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
              <span>Docker Isolated Runtime</span>
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Filter Grid */}
      <ProblemBankGrid initialProblems={initialProblems} availableTags={tags} />

    </div>
  );
}
