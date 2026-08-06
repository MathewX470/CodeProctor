import React from "react";
import { Search, Eye, Ban, Archive, Trash2 } from "lucide-react";
import Link from "next/link";
import { getSessionWithRoles } from "@/app/actions/auth";
import { getAdminContestsServer } from "@/app/actions/contests";
import { AccessDenied } from "../components/AccessDenied";

export const dynamic = "force-dynamic";

export default async function AdminContestsPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_CONTESTS")) {
    return <AccessDenied message="You need the 'Manage Contests' permission to view this page." />;
  }

  const contests = await getAdminContestsServer();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Global Contests</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage all contests across the platform. Note: Admins cannot disqualify participants or rejudge submissions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search contests..." 
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <Link 
            href="/admin/contests/create"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            Create Global Contest
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-950/50 border-b border-slate-200 dark:border-zinc-800/80 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Contest Name</th>
                <th className="px-6 py-4 font-semibold">Creator</th>
                <th className="px-6 py-4 font-semibold">Participants</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {contests.map((contest) => (
                <tr key={contest.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {contest.name}
                    {contest.isPublic ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">Public</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-400 uppercase tracking-wider">Private</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-zinc-300">
                    {contest.creator}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">
                    {contest.participants.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                      contest.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' :
                      contest.status === 'Upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                      contest.status === 'Archived' ? 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400' :
                      'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}>
                      {contest.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">
                    {contest.created}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="View Contest Metadata">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="Disable Registration">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" title="Archive Contest">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Delete Contest">
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
