import React from "react";
import Link from "next/link";
import { Plus, Users, Clock, Calendar, ShieldCheck, Lock, Globe, Trophy, Play, CheckCircle2 } from "lucide-react";
import { getUserContestsServer, getMyInvites, getPublicContestsServer } from "@/app/actions/contests";
import { getSessionWithRoles } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PendingInvitesSection } from "@/components/contests/PendingInvitesSection";
import { JoinContestForm } from "@/components/contests/JoinContestForm";
import { JoinPublicButton } from "@/components/contests/JoinPublicButton";

export const dynamic = "force-dynamic";

export default async function UserContestsPage() {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    redirect("/login");
  }

  const [memberships, myInvites, publicContests] = await Promise.all([
    getUserContestsServer(),
    getMyInvites(),
    getPublicContestsServer()
  ]);

  const activeMemberships: any[] = [];
  const upcomingMemberships: any[] = [];
  const endedMemberships: any[] = [];

  const now = new Date();

  memberships.forEach((membership: any) => {
    const contest = membership.contest;
    const isGlobalEnded = now > new Date(contest.endTime);
    const isUpcoming = now < new Date(contest.startTime);
    const isUserTimeUp = membership.startedAt && now > new Date(new Date(membership.startedAt).getTime() + contest.duration * 60000);
    const isCompleted = membership.completedAt || isGlobalEnded || isUserTimeUp;

    if (isCompleted) {
      endedMemberships.push(membership);
    } else if (isUpcoming) {
      upcomingMemberships.push(membership);
    } else {
      activeMemberships.push(membership);
    }
  });

  const renderMembershipCard = (membership: any, stateType: "active" | "upcoming" | "ended") => {
    const contest = membership.contest;
    const settings = contest.settings;
    const isOwner = membership.role === "OWNER";

    return (
      <div 
        key={membership.id} 
        className={`bg-white dark:bg-zinc-900 border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col ${
          stateType === "active" 
            ? "border-green-200 dark:border-green-900/40 ring-1 ring-green-500/20" 
            : stateType === "upcoming"
            ? "border-blue-200 dark:border-blue-900/40"
            : "border-slate-200 dark:border-zinc-800 opacity-90 hover:opacity-100"
        }`}
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              stateType === "active" 
                ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" 
                : stateType === "upcoming" 
                ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" 
                : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
              {stateType === "active" && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
              {stateType === "active" ? "Active Now" : stateType === "upcoming" ? "Upcoming" : "Concluded"}
            </div>
            
            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              isOwner 
                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" 
                : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
            }`}>
              {membership.role}
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {contest.title}
          </h3>
          
          {contest.description && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4">
              {contest.description}
            </p>
          )}

          <div className="mt-auto space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <Calendar className="w-4 h-4 opacity-70 text-blue-500" />
              <span>
                {new Date(contest.startTime).toLocaleDateString()} • {new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                <span className="mx-1.5 text-slate-400 dark:text-zinc-500">—</span> 
                {new Date(contest.endTime).toLocaleDateString()} • {new Date(contest.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <Clock className="w-4 h-4 opacity-70 text-amber-500" />
              {contest.duration} Minutes Duration
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 pt-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 opacity-70" />
                {contest._count.members} Contestants
              </div>
              <div className="flex items-center gap-1.5">
                {settings?.isPublic ? (
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Globe className="w-3.5 h-3.5"/> Public</span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500"><Lock className="w-3.5 h-3.5"/> Private</span>
                )}
                <span className="text-slate-300 dark:text-zinc-700">•</span>
                <span title="Standard Normal Rules" className="text-slate-500">Normal</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-100 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-950/50 flex gap-2">
          {isOwner ? (
            <>
              <Link 
                href={`/contests/${contest.id}/manage`}
                className="flex-1 text-center py-2 px-4 rounded-xl text-sm font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Manage Contest
              </Link>
              <Link 
                href={`/contests/${contest.id}`}
                className="px-3.5 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                title="View Standings & Analytics"
              >
                Standings
              </Link>
            </>
          ) : (
            <Link 
              href={`/contests/${contest.id}`}
              className="flex-1 text-center py-2 px-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 bg-blue-600 dark:bg-white hover:bg-blue-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 shadow-sm"
            >
              {stateType === "active" ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Enter Arena
                </>
              ) : stateType === "upcoming" ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  View Lobby
                </>
              ) : (
                <>
                  <Trophy className="w-3.5 h-3.5" />
                  View Results & Leaderboard
                </>
              )}
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Contests</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Participate in coding challenges, practice in live arenas, and review performance analytics.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <JoinContestForm />
          
          <Link 
            href="/contests/create"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Contest
          </Link>
        </div>
      </div>

      <PendingInvitesSection initialInvites={myInvites} />

      {memberships.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-3xl p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-zinc-900/40">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No contests yet</h3>
          <p className="text-slate-500 dark:text-zinc-400 max-w-md mb-6 text-sm leading-relaxed">
            You haven't joined or created any contests. Join an open public contest below or create your own contest to challenge peers.
          </p>
          <Link 
            href="/contests/create"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
          >
            Create Your First Contest
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Active Contests */}
          {activeMemberships.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Active Now</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400">
                  {activeMemberships.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeMemberships.map(m => renderMembershipCard(m, "active"))}
              </div>
            </div>
          )}

          {/* Upcoming Contests */}
          {upcomingMemberships.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming Contests</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                  {upcomingMemberships.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {upcomingMemberships.map(m => renderMembershipCard(m, "upcoming"))}
              </div>
            </div>
          )}

          {/* Completed Contests */}
          {endedMemberships.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Completed Contests</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                  {endedMemberships.length}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {endedMemberships.map(m => renderMembershipCard(m, "ended"))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Public Contests Section */}
      {publicContests.length > 0 && (
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Public Contests
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Join open contests hosted by other developers and compete on the global leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {publicContests.map((contest) => {
              const settings = contest.settings;
              const isUpcoming = new Date(contest.startTime) > new Date();
              const isActive = new Date(contest.startTime) <= new Date() && new Date(contest.endTime) >= new Date();

              return (
                <div key={contest.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                        isUpcoming ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                        {isActive ? 'Active Now' : isUpcoming ? 'Upcoming' : 'Concluded'}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                      {contest.title}
                    </h3>
                    
                    {contest.description && (
                      <p className="text-sm text-slate-500 dark:text-zinc-400 line-clamp-2 mb-4">
                        {contest.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-2.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                        <Calendar className="w-4 h-4 opacity-70 text-blue-500" />
                        <span>
                          {new Date(contest.startTime).toLocaleDateString()} • {new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                          <span className="mx-1.5 text-slate-400 dark:text-zinc-500">—</span> 
                          {new Date(contest.endTime).toLocaleDateString()} • {new Date(contest.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
                        <Clock className="w-4 h-4 opacity-70 text-amber-500" />
                        {contest.duration} Minutes Duration
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 pt-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 opacity-70" />
                          {contest._count.members} Participants
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Globe className="w-3.5 h-3.5"/> Public</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-950/50">
                    <JoinPublicButton 
                      contestId={contest.id} 
                      isUpcoming={isUpcoming} 
                      isEnded={!isActive && !isUpcoming} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
