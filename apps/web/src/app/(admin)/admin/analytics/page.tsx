import React from "react";
import { BarChart3, TrendingUp, PieChart, LineChart } from "lucide-react";
import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../components/AccessDenied";
import { getAdminAnalyticsServer } from "@/app/actions/analytics";
import { 
  UserGrowthChart, 
  ContestGrowthChart, 
  LanguagePopularityChart, 
  SubmissionOutcomesChart 
} from "./AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_ANALYTICS")) {
    return <AccessDenied message="You need the 'View Analytics' permission to view this page." />;
  }

  const { userGrowth, contestGrowth, languagePopularity, submissionOutcomes } = await getAdminAnalyticsServer();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Detailed metrics and charts regarding platform growth and engagement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User Growth */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Growth (Last 6 Months)</h2>
          </div>
          <div className="h-48 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
            <UserGrowthChart data={userGrowth} />
          </div>
        </div>

        {/* Contest Growth */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contests (Last 6 Months)</h2>
          </div>
          <div className="h-48 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
            <ContestGrowthChart data={contestGrowth} />
          </div>
        </div>

        {/* Popular Languages */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
              <PieChart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Popular Languages</h2>
          </div>
          <div className="h-48 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
            <LanguagePopularityChart data={languagePopularity} />
          </div>
        </div>

        {/* Submission Trend & Acceptance */}
        <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <LineChart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submission Outcomes</h2>
          </div>
          <div className="h-48 w-full bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-slate-200 dark:border-zinc-700">
            <SubmissionOutcomesChart data={submissionOutcomes} />
          </div>
        </div>

      </div>
      
    </div>
  );
}
