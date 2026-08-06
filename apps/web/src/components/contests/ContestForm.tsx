"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Globe, Lock, MonitorSmartphone, Video, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { createContestServer } from "@/app/actions/contests";
import { ProctoringMode } from "@prisma/client";

interface ContestFormProps {
  isAdmin: boolean;
  redirectPath: string; // where to go after successful creation
}

export function ContestForm({ isAdmin, redirectPath }: ContestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("120"); // 120 mins default
  const [isPublic, setIsPublic] = useState(false);
  const [password, setPassword] = useState("");
  const [proctoringMode, setProctoringMode] = useState<ProctoringMode>("NORMAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime || !duration) {
      toast.error("Please fill out all required fields.");
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      toast.error("End time must be after start time.");
      return;
    }

    setIsSubmitting(true);
    const res = await createContestServer({
      title,
      description,
      startTime: start,
      endTime: end,
      duration: parseInt(duration),
      isPublic: isAdmin ? isPublic : false, // Force false if not admin
      proctoringMode,
      password: (!isAdmin || !isPublic) ? password : undefined,
    });

    setIsSubmitting(false);

    if (res.success) {
      toast.success("Contest created successfully!");
      router.push(redirectPath);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to create contest.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Basic Information</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Set the title and description for this contest.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Contest Title *</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Weekly Coding Challenge #45"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or rules..."
              rows={4}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
            />
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schedule & Duration</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">When does the contest take place, and how long does a participant have?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Start Time *</label>
            <input 
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">End Time *</label>
            <input 
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Duration (minutes) *</label>
            <input 
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Visibility & Security */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Visibility & Security</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Configure who can join and how they are proctored.</p>
        </div>

        <div className="space-y-6">
          {/* Visibility Toggle (Admin Only) */}
          {isAdmin ? (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                  isPublic 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                    : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <Globe className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-bold text-sm">Public Contest</div>
                  <div className="text-xs opacity-80 font-normal">Available to everyone on the platform.</div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                  !isPublic 
                    ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300" 
                    : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <Lock className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-bold text-sm">Private Contest</div>
                  <div className="text-xs opacity-80 font-normal">Invite only or password protected.</div>
                </div>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg flex gap-3 text-sm border border-amber-200 dark:border-amber-800/30">
              <Lock className="w-5 h-5 shrink-0" />
              <div>
                <strong>Private Contest.</strong> As a standard user, your contests are inherently private. You can invite people directly or share your contest password.
              </div>
            </div>
          )}

          {/* Password (Only show if private) */}
          {(!isAdmin || !isPublic) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Contest Password (Optional)</label>
              <input 
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for invite-only"
                className="w-full sm:w-1/2 px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          )}

          <hr className="border-slate-200 dark:border-zinc-800" />

          {/* Proctoring Mode */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-3">Proctoring Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setProctoringMode("NORMAL")}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  proctoringMode === "NORMAL" 
                    ? "border-slate-400 dark:border-zinc-400 bg-slate-100 dark:bg-zinc-800" 
                    : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-zinc-300">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="font-bold text-sm">Normal</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400">No strict enforcement. Users can leave the tab.</p>
              </button>

              <button
                type="button"
                onClick={() => setProctoringMode("FULL_SCREEN")}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  proctoringMode === "FULL_SCREEN" 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                    : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className={`flex items-center gap-2 mb-2 ${proctoringMode === 'FULL_SCREEN' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                  <MonitorSmartphone className="w-5 h-5" />
                  <span className="font-bold text-sm">Strict / Fullscreen</span>
                </div>
                <p className={`text-xs ${proctoringMode === 'FULL_SCREEN' ? 'text-blue-600/80 dark:text-blue-300/80' : 'text-slate-500 dark:text-zinc-400'}`}>
                  Enforces full screen. Logs tab switching and copy-paste events.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setProctoringMode("CV_PROCTORED")}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  proctoringMode === "CV_PROCTORED" 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                    : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className={`flex items-center gap-2 mb-2 ${proctoringMode === 'CV_PROCTORED' ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-zinc-300'}`}>
                  <Video className="w-5 h-5" />
                  <span className="font-bold text-sm">Webcam Proctored</span>
                </div>
                <p className={`text-xs ${proctoringMode === 'CV_PROCTORED' ? 'text-purple-600/80 dark:text-purple-300/80' : 'text-slate-500 dark:text-zinc-400'}`}>
                  Requires webcam. Takes snapshots and detects face orientation.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(redirectPath)}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-70 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creating..." : "Create Contest"}
        </button>
      </div>
    </form>
  );
}
