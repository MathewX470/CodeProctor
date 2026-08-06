"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { updateContestSettings } from "@/app/actions/contests";
import { Save, ShieldAlert, Monitor, Video } from "lucide-react";
import { useRouter } from "next/navigation";

export function ContestSettingsTab({ contest, isAdmin }: { contest: any, isAdmin: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: contest.title,
    description: contest.description || "",
    startTime: new Date(contest.startTime).toISOString().slice(0, 16),
    endTime: new Date(contest.endTime).toISOString().slice(0, 16),
    duration: contest.duration,
    isPublic: contest.settings?.isPublic ?? true,
    password: contest.settings?.password || "",
    proctoringMode: contest.settings?.proctoringMode || "NORMAL",
    requireCamera: contest.settings?.requireCamera ?? false,
    requireFullScreen: contest.settings?.requireFullScreen ?? false,
    detectTabSwitch: contest.settings?.detectTabSwitch ?? false,
    detectCopyPaste: contest.settings?.detectCopyPaste ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateContestSettings(contest.id, formData);
      if (res.success) {
        toast.success("Settings updated successfully");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update settings");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl pb-10">
      {/* General Settings */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">General Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Contest Title</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Description (Markdown)</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              rows={4}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Start Time</label>
              <input 
                type="datetime-local" 
                required
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">End Time</label>
              <input 
                type="datetime-local" 
                required
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Duration (minutes)</label>
              <input 
                type="number" 
                required
                min={1}
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Access & Privacy */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Access & Privacy</h3>
        <div className="space-y-6">
          {isAdmin && (
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg transition-colors hover:border-slate-300 dark:hover:border-zinc-700">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isPublic ? 'bg-blue-500' : 'bg-slate-300 dark:bg-zinc-700'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isPublic ? 'transform translate-x-4' : ''}`}></div>
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">Public Contest</div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">Available to all users on the platform</div>
              </div>
            </label>
          )}

          {!formData.isPublic && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">Contest Password (Optional)</label>
              <input 
                type="text" 
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                placeholder="Leave blank to only allow invited members"
              />
            </div>
          )}
        </div>
      </div>

      {/* Proctoring Settings */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Proctoring Rules</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.proctoringMode === "NORMAL" ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"}`}>
            <input 
              type="radio" 
              name="proctoringMode" 
              value="NORMAL" 
              checked={formData.proctoringMode === "NORMAL"}
              onChange={() => setFormData({ ...formData, proctoringMode: "NORMAL", requireCamera: false, requireFullScreen: false, detectTabSwitch: false, detectCopyPaste: false })}
              className="sr-only" 
            />
            <ShieldAlert className={`w-6 h-6 mb-2 ${formData.proctoringMode === "NORMAL" ? "text-blue-500" : "text-slate-400"}`} />
            <div className="font-bold text-slate-900 dark:text-white text-sm">Normal</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">No restrictions. Just coding.</div>
          </label>

          <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.proctoringMode === "FULL_SCREEN" ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10" : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"}`}>
            <input 
              type="radio" 
              name="proctoringMode" 
              value="FULL_SCREEN" 
              checked={formData.proctoringMode === "FULL_SCREEN"}
              onChange={() => setFormData({ ...formData, proctoringMode: "FULL_SCREEN", requireFullScreen: true, detectTabSwitch: true, detectCopyPaste: true })}
              className="sr-only" 
            />
            <Monitor className={`w-6 h-6 mb-2 ${formData.proctoringMode === "FULL_SCREEN" ? "text-amber-500" : "text-slate-400"}`} />
            <div className="font-bold text-slate-900 dark:text-white text-sm">Full Screen Mode</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Forces full screen and blocks tab switching.</div>
          </label>

          <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.proctoringMode === "CV_PROCTORED" ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10" : "border-slate-200 dark:border-zinc-800 hover:border-slate-300"}`}>
            <input 
              type="radio" 
              name="proctoringMode" 
              value="CV_PROCTORED" 
              checked={formData.proctoringMode === "CV_PROCTORED"}
              onChange={() => setFormData({ ...formData, proctoringMode: "CV_PROCTORED", requireCamera: true, requireFullScreen: true, detectTabSwitch: true, detectCopyPaste: true })}
              className="sr-only" 
            />
            <Video className={`w-6 h-6 mb-2 ${formData.proctoringMode === "CV_PROCTORED" ? "text-purple-500" : "text-slate-400"}`} />
            <div className="font-bold text-slate-900 dark:text-white text-sm">CV Proctored</div>
            <div className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Requires webcam for AI facial tracking.</div>
          </label>
        </div>

        {formData.proctoringMode !== "NORMAL" && (
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.requireFullScreen}
                onChange={e => setFormData({ ...formData, requireFullScreen: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Require Full Screen</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.detectTabSwitch}
                onChange={e => setFormData({ ...formData, detectTabSwitch: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Detect Tab Switching</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.detectCopyPaste}
                onChange={e => setFormData({ ...formData, detectCopyPaste: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Detect Copy/Paste</span>
            </label>
            <label className="flex items-center gap-2">
              <input 
                type="checkbox" 
                checked={formData.requireCamera}
                disabled={formData.proctoringMode === "CV_PROCTORED"}
                onChange={e => setFormData({ ...formData, requireCamera: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">Require Camera Access</span>
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button 
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
