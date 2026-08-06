import React from "react";
import Link from "next/link";
import { Plus, Users, Clock, Calendar, ShieldCheck, Lock, Globe } from "lucide-react";
import { getUserContestsServer, getMyInvites } from "@/app/actions/contests";
import { getSessionWithRoles } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { PendingInvitesSection } from "@/components/contests/PendingInvitesSection";

export const dynamic = "force-dynamic";

export default async function UserContestsPage() {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    redirect("/login");
  }

  const [memberships, myInvites] = await Promise.all([
    getUserContestsServer(),
    getMyInvites()
  ]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Contests</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Contests you are participating in or managing.
          </p>
        </div>
        
        <Link 
          href="/contests/create"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Contest
        </Link>
      </div>

      <PendingInvitesSection initialInvites={myInvites} />

      {memberships.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No contests yet</h3>
          <p className="text-slate-500 dark:text-zinc-400 max-w-md mb-6">
            You haven't joined or created any contests. Create your first private contest to challenge your friends!
          </p>
          <Link 
            href="/contests/create"
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium transition-colors"
          >
            Create Private Contest
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {memberships.map((membership) => {
            const contest = membership.contest;
            const settings = contest.settings;
            const isOwner = membership.role === "OWNER";
            const isUpcoming = new Date(contest.startTime) > new Date();
            const isActive = new Date(contest.startTime) <= new Date() && new Date(contest.endTime) >= new Date();

            return (
              <div key={membership.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      isUpcoming ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {isActive ? 'Active Now' : isUpcoming ? 'Upcoming' : 'Ended'}
                    </div>
                    
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      isOwner ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {membership.role}
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

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                      <Calendar className="w-4 h-4 opacity-70" />
                      {new Date(contest.startTime).toLocaleDateString()} at {new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                      <Clock className="w-4 h-4 opacity-70" />
                      {contest.duration} minutes
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 dark:text-zinc-400 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 opacity-70" />
                        {contest._count.members}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {settings?.isPublic ? (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><Globe className="w-3.5 h-3.5"/> Public</span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500"><Lock className="w-3.5 h-3.5"/> Private</span>
                        )}
                        <span className="mx-1.5 text-slate-300 dark:text-zinc-700">•</span>
                        <span title={settings?.proctoringMode || "NORMAL"}>
                          <ShieldCheck className="w-4 h-4 opacity-70" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-100 dark:border-zinc-800 p-4 bg-slate-50 dark:bg-zinc-950/50 flex gap-3">
                  <Link 
                    href={`/contests/${contest.id}`}
                    className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Enter Arena
                  </Link>
                  {isOwner && (
                    <Link 
                      href={`/contests/${contest.id}/manage`}
                      className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                    >
                      Manage
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
