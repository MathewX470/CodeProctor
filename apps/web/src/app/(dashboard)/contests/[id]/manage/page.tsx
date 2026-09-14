import React from "react";
import { getSessionWithRoles } from "@/app/actions/auth";
import { getContestForManagement, getContestResultsServer } from "@/app/actions/contests";
import { redirect } from "next/navigation";
import { ContestManagerClient } from "@/components/contests/ContestManagerClient";
import { ChevronLeft, Info, Code2, Users, Trophy, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { AccessDenied } from "@/app/(admin)/admin/components/AccessDenied";

import { ContestSettingsTab } from "@/components/contests/ContestSettingsTab";
import { ContestParticipantsTab } from "@/components/contests/ContestParticipantsTab";
import { ContestOverviewTab } from "@/components/contests/ContestOverviewTab";
import { ContestLeaderboardTab } from "@/components/contests/ContestLeaderboardTab";
import { ContestAnalyticsTab } from "@/components/contests/ContestAnalyticsTab";

export const dynamic = "force-dynamic";

export default async function ContestManagementPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    redirect("/login");
  }

  const [{ id }, searchParamsData] = await Promise.all([params, searchParams]);
  const tab = searchParamsData.tab || "overview";
  
  let contest;
  let results;

  try {
    const [contestData, resultsData] = await Promise.all([
      getContestForManagement(id),
      getContestResultsServer(id)
    ]);
    contest = contestData;
    results = resultsData;
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return <AccessDenied message="You do not have permission to manage this contest." />;
    }
    throw error;
  }

  // Determine back link (admin vs user)
  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  const backLink = isAdmin ? "/admin/contests" : "/contests";
  const totalPoints = contest.problems.reduce((acc: number, p: any) => acc + (p.points || 100), 0);

  const navTabs = [
    { id: "overview", label: "Overview & Details", icon: Info },
    { id: "problems", label: `Problems (${contest.problems.length})`, icon: Code2 },
    { id: "participants", label: `Participants (${contest._count?.members || 0})`, icon: Users },
    { id: "leaderboard", label: "Leaderboard", icon: Trophy },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href={backLink}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/50">
                Creator Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {contest.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-6 overflow-x-auto pb-1">
          {navTabs.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <Link 
                key={t.id}
                href={`/contests/${contest.id}/manage?tab=${t.id}`} 
                className={`whitespace-nowrap py-3.5 px-2 border-b-2 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                  isActive 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Contents */}
      {tab === "overview" && <ContestOverviewTab contest={contest} totalPoints={totalPoints} />}
      {tab === "problems" && <ContestManagerClient contest={contest} />}
      {tab === "participants" && <ContestParticipantsTab contest={contest} isAdmin={isAdmin} />}
      {tab === "leaderboard" && <ContestLeaderboardTab leaderboard={results.leaderboard} problems={contest.problems} />}
      {tab === "analytics" && <ContestAnalyticsTab analytics={results.analytics} totalParticipants={results.stats.totalParticipants} totalPoints={totalPoints} />}
      {tab === "settings" && <ContestSettingsTab contest={contest} isAdmin={isAdmin} />}

    </div>
  );
}
