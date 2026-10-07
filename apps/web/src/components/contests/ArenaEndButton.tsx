"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { endContestServer } from "@/app/actions/contests";

export function ArenaEndButton({ contestId }: { contestId: string }) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConfirmEnd = async () => {
    setIsEnding(true);
    const res = await endContestServer(contestId);
    if (res.success) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
      toast.success("Contest assessment submitted successfully!");
      setShowModal(false);
      router.refresh();
    } else {
      toast.error(res.error || "Failed to submit contest.");
      setIsEnding(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isEnding}
        className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        Finish Contest Early
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit & Finish Contest?
              </h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
                Are you sure you want to end your assessment now? Once confirmed, all code submissions will be permanently locked and your final ranking will be computed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isEnding}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                disabled={isEnding}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
              >
                {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isEnding ? "Submitting..." : "Yes, Finish Contest"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
