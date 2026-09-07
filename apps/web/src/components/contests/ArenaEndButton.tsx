"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SquareSquare } from "lucide-react";
import { toast } from "sonner";
import { endContestServer } from "@/app/actions/contests";

export function ArenaEndButton({ contestId }: { contestId: string }) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const handleEnd = async () => {
    if (!confirm("Are you sure you want to end your test? You will not be able to submit more code.")) return;
    
    setIsEnding(true);
    const res = await endContestServer(contestId);
    if (res.success) {
      toast.success("Test ended successfully.");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to end contest.");
      setIsEnding(false);
    }
  };

  return (
    <button
      onClick={handleEnd}
      disabled={isEnding}
      className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
    >
      {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <SquareSquare className="w-4 h-4" />}
      End Test
    </button>
  );
}
