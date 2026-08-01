import React from "react";
import { Plus, Megaphone, Trash2, Clock, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminAnnouncementsPage() {
  const announcements = [
    { id: 1, title: "Scheduled Downtime", type: "Maintenance", date: "2024-05-18", author: "System Admin" },
    { id: 2, title: "New Feature: AI Hint Generator", type: "Feature", date: "2024-05-15", author: "Product Team" },
    { id: 3, title: "Server Migration Completed", type: "Update", date: "2024-05-01", author: "DevOps" },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Announcements</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Broadcast messages to all users on the platform.
          </p>
        </div>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors hover:border-slate-300 dark:hover:border-zinc-700">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  announcement.type === 'Maintenance' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                  announcement.type === 'Feature' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                }`}>
                  {announcement.type === 'Maintenance' ? <Wrench className="w-5 h-5" /> :
                   announcement.type === 'Feature' ? <Megaphone className="w-5 h-5" /> :
                   <Clock className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {announcement.type}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                {announcement.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6">
                Posted by {announcement.author} on {announcement.date}
              </p>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}
