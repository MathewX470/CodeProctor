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
    if (res.success) {
      toast.success("Successfully joined the contest!");
      router.push(`/contests/${res.contestId}`);
    } else {
      toast.error(res.error || "Failed to join contest.");
      setIsJoining(false);
    }
  };

  if (isEnded) {
    return (
      <button 
        disabled 
        className="flex-1 text-center py-2 bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-500 rounded-lg text-sm font-medium cursor-not-allowed border border-slate-300 dark:border-zinc-700"
      >
        Contest Ended
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
