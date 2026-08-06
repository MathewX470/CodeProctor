"use client";

import React, { useState } from "react";
import { Mail, Check, X, Calendar, Clock } from "lucide-react";
import { respondToInvite } from "@/app/actions/contests";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PendingInvitesSection({ initialInvites }: { initialInvites: any[] }) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  if (invites.length === 0) return null;

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setIsProcessing(inviteId);
    try {
      const res = await respondToInvite(inviteId, accept);
      if (res.success) {
        toast.success(accept ? "Invitation accepted!" : "Invitation declined");
        setInvites(invites.filter(i => i.id !== inviteId));
        router.refresh();
      } else {
        toast.error(res.error || "Failed to respond to invitation");
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Mail className="w-5 h-5 text-amber-500" />
        Pending Invitations ({invites.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invites.map(invite => (
          <div key={invite.id} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900/50 rounded-xl p-5 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                invite.role === 'MODERATOR' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                Invited as {invite.role}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-lg">
              {invite.contest.title}
            </h3>
            
            <div className="space-y-2 mb-6 flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                <Calendar className="w-4 h-4 opacity-70" />
                {new Date(invite.contest.startTime).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-zinc-400">
                <Clock className="w-4 h-4 opacity-70" />
                {invite.contest.duration} mins
              </div>
            </div>
            
            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => handleRespond(invite.id, true)}
                disabled={isProcessing === invite.id}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => handleRespond(invite.id, false)}
                disabled={isProcessing === invite.id}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-zinc-800 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-slate-700 dark:text-amber-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
