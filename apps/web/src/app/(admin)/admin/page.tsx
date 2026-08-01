import React from "react";
import { 
  Users, 
  UserCog, 
  Trophy, 
  Database, 
  Activity, 
  PlayCircle, 
  Globe2, 
  ServerCrash
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const kpis = [
    { label: "Total Users", value: "1,248", icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
    { label: "Contest Creators", value: "34", icon: UserCog, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-100 dark:border-purple-500/20" },
    { label: "Total Contests", value: "89", icon: Trophy, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20" },
    { label: "Problems", value: "450", icon: Database, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-100 dark:border-emerald-500/20" },
    { label: "Submissions Today", value: "3,102", icon: Activity, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-100 dark:border-indigo-500/20" },
    { label: "Active Contests", value: "2", icon: PlayCircle, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-100 dark:border-rose-500/20" },
    { label: "Online Users", value: "156", icon: Globe2, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-100 dark:border-cyan-500/20" },
    { label: "System Status", value: "Nominal", icon: ServerCrash, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10", border: "border-green-100 dark:border-green-500/20" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          High-level overview of platform metrics and health.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl flex items-center gap-4 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${kpi.bg} ${kpi.border} ${kpi.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-zinc-500 mb-0.5">{kpi.label}</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{kpi.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions placeholder */}
      <section className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
            Create Global Contest
          </button>
          <button className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
            Post Announcement
          </button>
          <button className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors">
            Add Problem
          </button>
        </div>
      </section>

    </div>
  );
}
