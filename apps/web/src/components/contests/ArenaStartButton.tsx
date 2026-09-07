"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { startContestTimer } from "@/app/actions/contests";

export function ArenaStartButton({ contestId }: { contestId: string }) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    const res = await startContestTimer(contestId);
    if (res.success) {
      toast.success("Timer started! Good luck.");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to start contest.");
      setIsStarting(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={isStarting}
      className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
    >
      {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
      {isStarting ? "Starting..." : "Start Assessment"}
    </button>
  );
}
