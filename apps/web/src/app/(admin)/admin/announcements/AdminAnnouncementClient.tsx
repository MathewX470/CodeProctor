"use client";

import React, { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createAnnouncementServer, deleteAnnouncementServer } from "@/app/actions/admin-announcements";

export function NewAnnouncementButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const type = formData.get("type") as string;

    if (!title || !message) return toast.error("Title and message are required");

    startTransition(async () => {
      const res = await createAnnouncementServer({ title, message, announcementType: type });
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Announcement broadcasted to all users!");
        setIsOpen(false);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        <span>New Announcement</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Broadcast Announcement</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Title</label>
                <input name="title" type="text" required className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Scheduled Maintenance" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Type</label>
                <select name="type" className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="Maintenance">Maintenance</option>
                  <option value="Feature">Feature Update</option>
                  <option value="Update">General Update</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300 mb-1">Message</label>
                <textarea name="message" required rows={3} className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Details..."></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white">Cancel</button>
                <button type="submit" disabled={isPending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {isPending ? "Broadcasting..." : "Broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this announcement? It will be removed from all users' notifications.")) return;
    startTransition(async () => {
      const res = await deleteAnnouncementServer(id);
      if (res?.error) toast.error(res.error);
      else toast.success("Announcement deleted");
    });
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
