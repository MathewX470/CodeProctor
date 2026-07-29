import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContestCard } from "@/components/dashboard/ContestCard";
import { 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Code2, 
  ArrowUpRight, 
  Activity,
  Flame,
  Terminal
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Query Database for active contests & problem bank previews
  const contests = await prisma.contest.findMany({
    where: { isDeleted: false },
    include: { settings: true },
    orderBy: { startTime: "asc" },
  });

  const recentProblems = await prisma.problem.findMany({
    where: { isPublic: true, isDeleted: false },
    take: 5,
    include: { problemTags: { include: { tag: true } } },
    orderBy: { createdAt: "asc" },
  });

  const totalProblemsCount = await prisma.problem.count({
    where: { isPublic: true, isDeleted: false },
  });

  // Sample real-time execution logs (Audit & Verdict timeline)
  const executionLogs = [
    { time: "21:04:12", problem: "Zero-Trust Memory Allocator", lang: "Python 3.11", verdict: "ACCEPTED", ms: "34ms", kb: "14.2KB", isPass: true },
    { time: "20:52:44", problem: "Suboptimal Gaze Angle Tracking", lang: "C++ (GCC 13)", verdict: "ACCEPTED", ms: "12ms", kb: "8.1KB", isPass: true },
    { time: "20:41:09", problem: "LRU Telemetry Cache", lang: "Python 3.11", verdict: "WRONG_ANSWER", ms: "45ms", kb: "15.4KB", isPass: false },
    { time: "20:18:55", problem: "Graph Cycle Deadlock Monitor", lang: "Java (OpenJDK 21)", verdict: "TIME_LIMIT_EXCEEDED", ms: ">2000ms", kb: "64.0KB", isPass: false },
  ];

  return (
    <div className="space-y-10">
      
      {/* 1. WELCOME & PROCTOR SENSOR READINESS BANNER */}
      <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-xl backdrop-blur-md transition-colors">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 dark:bg-white/[0.03] blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-white/[0.03] border border-blue-100 dark:border-white/[0.06] rounded-full text-xs font-medium text-blue-700 dark:text-zinc-300 mb-4 transition-colors">
              <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-zinc-400" />
              <span>Assessment Workspace Ready</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
              Candidate <span className="text-blue-600 dark:text-zinc-300 font-semibold">Dashboard</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-2xl leading-relaxed transition-colors">
              Welcome to your isolated evaluation environment. All algorithmic testing is executed in secure Docker sandboxes with real-time AI proctoring verification.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800/80 p-4 sm:p-5 rounded-xl flex flex-col gap-3 shrink-0 shadow-sm dark:shadow-inner transition-colors">
            <div className="flex items-center justify-between gap-6 text-xs font-medium">
              <span className="text-slate-500 dark:text-zinc-500">Sensor Status:</span>
              <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-zinc-400 animate-pulse" />
                All Systems Nominal
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs border-t border-slate-200 dark:border-zinc-800/80 pt-3 text-slate-600 dark:text-zinc-400">
              <span className="px-2.5 py-1 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none rounded-lg text-slate-700 dark:text-zinc-300">Webcam Ready</span>
              <span className="px-2.5 py-1 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.05] shadow-sm dark:shadow-none rounded-lg text-slate-700 dark:text-zinc-300">Tab-Lock Active</span>
              <span className="px-2.5 py-1 bg-green-50 dark:bg-white/[0.05] border border-green-100 dark:border-white/[0.05] text-green-700 dark:text-zinc-300 rounded-lg font-medium">Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PERFORMANCE & FAIRNESS STATS GRID */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-500 text-xs font-medium mb-3">
            <span>Problems Solved</span>
            <Code2 className="w-4 h-4 text-blue-500 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">3</span>
            <span className="text-sm text-slate-500 dark:text-zinc-500">/ {totalProblemsCount || 8} completed</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-900 h-1.5 mt-4 rounded-full overflow-hidden">
            <div className="bg-blue-500 dark:bg-zinc-500 h-full w-[37.5%] rounded-full transition-all duration-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-500 text-xs font-medium mb-3">
            <span>Execution Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">89.2%</span>
            <span className="text-xs text-slate-500 dark:text-zinc-500">acceptance rate</span>
          </div>
          <span className="text-xs text-slate-400 dark:text-zinc-600 mt-4 font-mono">
            24 accepted &bull; 3 failed
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-500 text-xs font-medium mb-3">
            <span>Total Arena Score</span>
            <Award className="w-4 h-4 text-yellow-500 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">1,450</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-600">PTS</span>
          </div>
          <span className="text-xs text-slate-600 dark:text-zinc-500 font-medium mt-4 flex items-center gap-1">
            <span>▲ Rank: Nominal Tier 1</span>
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-500 text-xs font-medium mb-3">
            <span>Fairness Certificate</span>
            <ShieldCheck className="w-4 h-4 text-purple-500 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">100% Clean</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-500 mt-4">
            0 malpractice infractions logged
          </span>
        </div>
      </section>

      {/* 3. ACTIVE & UPCOMING CONTESTS ARENA */}
      <section className="space-y-6" id="contests">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-white/[0.05] border border-blue-100 dark:border-white/[0.05] flex items-center justify-center text-blue-600 dark:text-zinc-400">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Timed Assessment Arena
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-500">Live tournaments and scheduled testing events</p>
            </div>
          </div>
          <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium px-3 py-1 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-sm dark:shadow-none rounded-full">
            {contests.length} {contests.length === 1 ? "Contest" : "Contests"} Active
          </span>
        </div>

        {contests.length === 0 ? (
          <div className="p-12 border border-slate-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/40 shadow-sm dark:shadow-none text-center text-sm text-slate-500 dark:text-zinc-500">
            No timed tournaments are currently scheduled. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {contests.map((c) => (
              <ContestCard
                key={c.id}
                id={c.id}
                title={c.title}
                description={c.description}
                startTime={c.startTime}
                endTime={c.endTime}
                duration={c.duration}
                settings={c.settings}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. CURATED PROBLEM BANK & RECENT TELEMETRY LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        
        {/* Left 7 cols: Problem Bank preview */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-200 tracking-tight">
                Curated Problem Bank
              </h2>
            </div>
            <Link
              href="/problems"
              className="text-xs text-blue-600 dark:text-zinc-400 hover:text-blue-700 dark:hover:text-zinc-200 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Explore all {totalProblemsCount} challenges</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentProblems.map((p, idx) => (
              <Link
                key={p.id}
                href={`/problems/${p.slug}`}
                className="block bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-900/60 p-4.5 rounded-xl transition-all group shadow-sm dark:shadow-none"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="font-mono text-xs text-slate-400 dark:text-zinc-500">#{idx + 101}</span>
                      <h4 className="font-semibold text-slate-900 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors text-sm sm:text-base">
                        {p.title}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                          p.difficulty === "EASY"
                            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-white/[0.08] dark:text-white dark:border-white/[0.1]"
                            : p.difficulty === "MEDIUM"
                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:border-white/[0.05]"
                            : "bg-red-50 text-red-700 border border-red-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800"
                        }`}
                      >
                        {p.difficulty}
                      </span>
                      {p.problemTags.slice(0, 2).map((pt) => (
                        <span key={pt.tag.id} className="text-xs text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-950 px-2.5 py-0.5 border border-slate-200 dark:border-zinc-800 rounded-md">
                          {pt.tag.name}
                        </span>
                      ))}
                      <span className="text-xs text-slate-400 dark:text-zinc-600 pl-1 font-mono">
                        {p.timeLimit}ms &bull; {p.memoryLimit}KB
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-zinc-500 group-hover:text-blue-600 dark:group-hover:text-zinc-300 transition-colors">
                    <span>Solve Challenge</span>
                    <ArrowUpRight className="w-4 h-4 text-blue-500 dark:text-zinc-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Right 5 cols: Live Activity & Verdict Timeline */}
        <section className="lg:col-span-5 space-y-4" id="activity">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-200 tracking-tight">
                Judge Telemetry Logs
              </h2>
            </div>
            <span className="text-xs text-blue-700 dark:text-zinc-300 bg-blue-50 dark:bg-white/[0.05] px-2.5 py-0.5 border border-blue-100 dark:border-white/[0.05] rounded-full font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-zinc-400 animate-ping" />
              Live Feed
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-5 rounded-2xl space-y-4 relative shadow-sm dark:shadow-none transition-colors">
            <div className="text-xs text-slate-500 dark:text-zinc-500 pb-3 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <span>Worker Queue: BullMQ &bull; Neon</span>
              <span className="text-slate-700 dark:text-zinc-400 font-medium">4/4 Shards Ready</span>
            </div>

            <div className="space-y-3">
              {executionLogs.map((log, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-zinc-950/50 border border-slate-200 dark:border-zinc-800/80 rounded-xl flex flex-col gap-2 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 dark:text-zinc-500 font-mono">{log.time}</span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        log.isPass 
                          ? "bg-green-100 dark:bg-white/[0.05] text-green-700 dark:text-zinc-300 border border-green-200 dark:border-white/[0.1]" 
                          : "bg-red-100 dark:bg-zinc-950 text-red-700 dark:text-zinc-400 border border-red-200 dark:border-zinc-800"
                      }`}
                    >
                      {log.verdict.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-zinc-300 text-sm">{log.problem}</div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-500">
                    <span>{log.lang}</span>
                    <span className="font-mono">{log.ms} &bull; {log.kb}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <span className="text-xs text-blue-600 dark:text-zinc-500 hover:text-blue-800 dark:hover:text-zinc-300 cursor-pointer transition-colors font-medium">
                View Archived Audit Logs &rarr;
              </span>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
