"use client";

import React, { useTransition } from "react";
import { Eye, Ban, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { deleteContestServer, archiveContestServer } from "@/app/actions/contests";

export function AdminContestActions({ contestId }: { contestId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (!confirm("Are you sure you want to end this contest immediately?")) return;
    startTransition(async () => {
      const res = await archiveContestServer(contestId);
      if (res?.error) toast.error(res.error);
      else toast.success("Contest archived/ended successfully.");
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this contest? This cannot be easily undone.")) return;
    startTransition(async () => {
      const res = await deleteContestServer(contestId);
      if (res?.error) toast.error(res.error);
      else toast.success("Contest deleted.");
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/contests/${contestId}/manage`} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="View Contest Metadata">
        <Eye className="w-4 h-4" />
      </Link>
      <button disabled={isPending} className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors disabled:opacity-50" title="Disable Registration">
        <Ban className="w-4 h-4" />
      </button>
      <button onClick={handleArchive} disabled={isPending} className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors disabled:opacity-50" title="Archive Contest">
        <Archive className="w-4 h-4" />
      </button>
      <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50" title="Delete Contest">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
