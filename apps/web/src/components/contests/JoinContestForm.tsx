"use client";

import React, { useState } from "react";
import { joinContestByCode } from "@/app/actions/contests";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Key } from "lucide-react";

export function JoinContestForm() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    try {
      const res = await joinContestByCode(joinCode);
      if (res.success) {
        toast.success("Successfully joined contest!");
        setJoinCode("");
        router.push(`/contests/${res.contestId}`);
      } else {
        toast.error(res.error || "Failed to join contest");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <form onSubmit={handleJoin} className="relative flex items-center w-full sm:w-64">
      <div className="absolute left-3 text-slate-400">
        <Key className="w-4 h-4" />
      </div>
      <input
        type="text"
        placeholder="Enter Join Code..."
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value)}
        className="w-full pl-9 pr-20 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      />
      <button
        type="submit"
        disabled={isJoining || !joinCode.trim()}
        className="absolute right-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
      >
        {isJoining ? "Joining..." : "Join"}
      </button>
    </form>
  );
}
