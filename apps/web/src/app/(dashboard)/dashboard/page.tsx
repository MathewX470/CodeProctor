import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ContestCard } from "@/components/dashboard/ContestCard";
import { 
  Play, 
  Trophy, 
  Globe, 
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Clock,
  History
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Query Database for active/upcoming contests
  const contests = await prisma.contest.findMany({
    where: { isDeleted: false },
    include: { settings: true },
    orderBy: { startTime: "asc" },
  });

  const totalProblemsCount = await prisma.problem.count({
    where: { isPublic: true, isDeleted: false },
  });

  // Sample real-time execution logs for Recent Submissions
  const recentSubmissions = [
    { id: 1, problem: "Zero-Trust Memory Allocator", lang: "Python 3.11", verdict: "Accepted", runtime: "34ms", time: "10 mins ago" },
    { id: 2, problem: "LRU Telemetry Cache", lang: "Python 3.11", verdict: "Wrong Answer", runtime: "45ms", time: "2 hours ago" },
    { id: 3, problem: "Graph Cycle Deadlock", lang: "Java (OpenJDK 21)", verdict: "Time Limit Exceeded", runtime: ">2000ms", time: "5 hours ago" },
    { id: 4, problem: "Distributed Hash Table", lang: "C++ (GCC 13)", verdict: "Running", runtime: "--", time: "Just now" },
    { id: 5, problem: "Suboptimal Gaze Tracking", lang: "C++ (GCC 13)", verdict: "Accepted", runtime: "12ms", time: "1 day ago" },
  ];

  // Sample Recent Activity
  const recentActivity = [
    { id: 1, type: "solve", text: "Solved Two Sum", time: "10 mins ago", icon: CheckCircle2, color: "text-green-500" },
    { id: 2, type: "submit", text: "Submitted Graph Problem", time: "5 hours ago", icon: History, color: "text-slate-500 dark:text-zinc-400" },
    { id: 3, type: "fail", text: "Wrong Answer - DP Question", time: "2 hours ago", icon: XCircle, color: "text-red-500" },
    { id: 4, type: "solve", text: "Solved Suboptimal Gaze Tracking", time: "1 day ago", icon: CheckCircle2, color: "text-green-500" },
  ];

  // Mock Ongoing Contest
  const ongoingContest = {
    title: "Weekly Arena 142",
    progress: 45,
    timeRemaining: "01:24:10",
    currentRank: 412,
  };

  const getVerdictColor = (verdict: string) => {
    switch(verdict) {
      case "Accepted": return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20";
      case "Wrong Answer": return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20";
      case "Time Limit Exceeded": return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20";
      case "Running": return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
      default: return "text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 py-8">
      
      {/* 1. WELCOME SECTION */}
      <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 md:p-8 rounded-2xl relative overflow-hidden shadow-sm dark:shadow-none backdrop-blur-md transition-colors">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50 dark:hidden blur-[100px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
              Welcome back, Candidate
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-xl leading-relaxed transition-colors">
              Ready to jump back in? Continue your algorithmic training or participate in an upcoming arena to improve your global rank.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/problems"
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 dark:shadow-none hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continue Last Problem</span>
            </Link>
            <Link
              href="#contests"
              className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm dark:shadow-none"
            >
              <Trophy className="w-4 h-4" />
              <span>Browse Contests</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. STATS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl flex items-center gap-5 shadow-sm dark:shadow-none transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-white/[0.05] border border-blue-100 dark:border-white/[0.1] flex items-center justify-center text-blue-600 dark:text-zinc-300">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-1">Problems Solved</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
              128 <span className="text-xs font-medium text-slate-400 dark:text-zinc-600">/ {totalProblemsCount || 450}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl flex items-center gap-5 shadow-sm dark:shadow-none transition-colors">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-white/[0.05] border border-purple-100 dark:border-white/[0.1] flex items-center justify-center text-purple-600 dark:text-zinc-300">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-1">Current Rating</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
              1,642 <span className="text-xs font-semibold text-green-500 dark:text-green-400">+14</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl flex items-center gap-5 shadow-sm dark:shadow-none transition-colors">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-white/[0.05] border border-amber-100 dark:border-white/[0.1] flex items-center justify-center text-amber-600 dark:text-zinc-300">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-1">Global Rank</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-2">
              Top 4.2% <span className="text-xs font-semibold text-slate-400 dark:text-zinc-600">#41,920</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ONGOING CONTEST */}
      {ongoingContest && (
        <section className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm dark:shadow-none transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 dark:hidden blur-3xl rounded-full" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-white/[0.05] border border-blue-100 dark:border-white/[0.1] text-blue-600 dark:text-zinc-300 flex items-center justify-center shrink-0">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-wider uppercase">Ongoing Contest</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{ongoingContest.title}</h3>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full md:w-auto">
              <div className="hidden sm:block">
                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Time Remaining</div>
                <div className="font-mono text-lg font-bold text-slate-800 dark:text-zinc-200">{ongoingContest.timeRemaining}</div>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-slate-500 dark:text-zinc-400 mb-1">Current Rank</div>
                <div className="font-semibold text-lg text-slate-800 dark:text-zinc-200">#{ongoingContest.currentRank}</div>
              </div>
              <Link
                href="#enter-arena"
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 dark:shadow-none hover:scale-[1.02] group"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Submissions & Upcoming Contests */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 6. RECENT SUBMISSIONS */}
          <section className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm dark:shadow-none transition-colors">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                Recent Submissions
              </h2>
              <Link href="/submissions" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                View All
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-zinc-400 bg-white dark:bg-zinc-900/40 border-b border-slate-200 dark:border-zinc-800/80">
                  <tr>
                    <th className="px-6 py-3 font-medium">Problem</th>
                    <th className="px-6 py-3 font-medium">Verdict</th>
                    <th className="px-6 py-3 font-medium">Runtime</th>
                    <th className="px-6 py-3 font-medium">Language</th>
                    <th className="px-6 py-3 font-medium text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {recentSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-zinc-200">
                        {sub.problem}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getVerdictColor(sub.verdict)}`}>
                          {sub.verdict === "Accepted" && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {sub.verdict === "Wrong Answer" && <XCircle className="w-3.5 h-3.5" />}
                          {sub.verdict === "Time Limit Exceeded" && <AlertCircle className="w-3.5 h-3.5" />}
                          {sub.verdict === "Running" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {sub.verdict}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500 dark:text-zinc-400 text-xs">
                        {sub.runtime}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-zinc-400 text-xs">
                        {sub.lang}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-500 dark:text-zinc-500 text-xs">
                        {sub.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. UPCOMING CONTESTS */}
          <section id="contests">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500 dark:text-zinc-400" />
                Upcoming Contests
              </h2>
            </div>
            {contests.length === 0 ? (
              <div className="p-12 border border-slate-200 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900/40 text-center text-sm text-slate-500 dark:text-zinc-500 shadow-sm dark:shadow-none">
                No timed tournaments are currently scheduled. Check back soon!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        </div>

        {/* RIGHT COLUMN: Recent Activity */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 5. RECENT ACTIVITY */}
          <section className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
            
            <div className="relative border-l border-slate-200 dark:border-zinc-800 ml-3 space-y-6">
              {recentActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="relative pl-6">
                    <div className="absolute -left-3 top-0.5 bg-white dark:bg-zinc-950 p-1 rounded-full border border-slate-200 dark:border-zinc-800">
                      <Icon className={`w-3.5 h-3.5 ${activity.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-zinc-200 mb-0.5 leading-snug">
                        {activity.text}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <button className="w-full mt-8 py-2.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-medium text-xs rounded-xl transition-colors">
              View All Activity
            </button>
          </section>

        </div>
      </div>
      
    </div>
  );
}
