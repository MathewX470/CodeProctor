import React from "react";
import { Search, Megaphone, Trash2, Edit3, Plus, Clock, Wrench } from "lucide-react";
import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../components/AccessDenied";
import { getAdminAnnouncementsServer } from "@/app/actions/admin-announcements";
import { NewAnnouncementButton, DeleteAnnouncementButton } from "./AdminAnnouncementClient";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_ANNOUNCEMENTS")) {
    return <AccessDenied message="You need the 'Manage Announcements' permission to view this page." />;
  }

  const announcements = await getAdminAnnouncementsServer();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Announcements</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Broadcast messages to all users on the platform.
          </p>
        </div>
        <NewAnnouncementButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-zinc-700">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  announcement.type === 'Maintenance' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                  announcement.type === 'Feature Update' || announcement.type === 'Feature' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                }`}>
                  {announcement.type === 'Maintenance' ? <Wrench className="w-5 h-5" /> :
                   announcement.type === 'Feature Update' || announcement.type === 'Feature' ? <Megaphone className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {announcement.type}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {announcement.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-2">
                Posted by {announcement.author} on {announcement.date}
              </p>
              <p className="text-sm text-slate-600 dark:text-zinc-300 mb-6">
                {announcement.message}
              </p>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
              <DeleteAnnouncementButton id={announcement.id} />
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 dark:text-zinc-500">
            <Megaphone className="w-12 h-12 mb-3 opacity-20" />
            <p>No platform announcements have been broadcasted yet.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}
