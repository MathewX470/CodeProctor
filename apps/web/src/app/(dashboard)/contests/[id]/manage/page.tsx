import React from "react";
import { getSessionWithRoles } from "@/app/actions/auth";
import { getContestForManagement } from "@/app/actions/contests";
import { redirect } from "next/navigation";
import { ContestManagerClient } from "@/components/contests/ContestManagerClient";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { AccessDenied } from "@/app/(admin)/admin/components/AccessDenied";

export default async function ContestManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  let contest;

  try {
    contest = await getContestForManagement(id);
  } catch (error: any) {
    if (error.message.includes("Forbidden")) {
      return <AccessDenied message="You do not have permission to manage this contest." />;
    }
    throw error;
  }

  // Determine back link (admin vs user)
  const backLink = (session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS")) ? "/admin/contests" : "/contests";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={backLink}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Contest</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {contest.title}
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200 dark:border-zinc-800">
        <nav className="-mb-px flex space-x-8">
          <a href="#" className="border-blue-500 text-blue-600 dark:text-blue-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Problems
          </a>
          <a href="#" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Participants
          </a>
          <a href="#" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-zinc-400 dark:hover:text-zinc-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm">
            Settings
          </a>
        </nav>
      </div>

      {/* For now, just render the problems manager tab directly */}
      <ContestManagerClient contest={contest} />

    </div>
  );
}
