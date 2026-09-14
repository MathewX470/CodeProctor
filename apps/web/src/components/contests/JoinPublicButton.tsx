"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { joinPublicContest } from "@/app/actions/contests";

export function JoinPublicButton({ 
  contestId, 
  isEnded, 
  isUpcoming 
}: { 
  contestId: string;
  isEnded: boolean;
  isUpcoming: boolean;
}) {
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    const res = await joinPublicContest(contestId);
    if (res.success || res.error?.includes("already a member")) {
      router.push(`/contests/${contestId}`);
    } else {
      toast.error(res.error || "Failed to access contest.");
      setIsJoining(false);
    }
  };

  if (isEnded) {
    return (
      <button 
        onClick={handleJoin}
        disabled={isJoining}
        className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-zinc-700 disabled:opacity-70"
      >
        {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "View Standings & Results"}
      </button>
    );
  }

  return (
    <button
      onClick={handleJoin}
      disabled={isJoining}
      className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
    >
      {isJoining && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isJoining && isUpcoming && "Join (Upcoming)"}
      {!isJoining && !isUpcoming && "Join Active Contest"}
    </button>
  );
}
