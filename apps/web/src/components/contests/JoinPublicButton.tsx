"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { joinPublicContest } from "@/app/actions/contests";

export function JoinPublicButton({ contestId }: { contestId: string }) {
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

  return (
    <button
      onClick={handleJoin}
      disabled={isJoining}
      className="flex-1 text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
    >
      {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Public Contest"}
    </button>
  );
}
