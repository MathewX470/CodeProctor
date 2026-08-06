import React from "react";
import { ContestForm } from "@/components/contests/ContestForm";
import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../../components/AccessDenied";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminCreateContestPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_CONTESTS")) {
    return <AccessDenied message="You need the 'Manage Contests' permission to view this page." />;
  }

  // We pass isAdmin=true so the form allows creating Public contests
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/contests"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Global Contest</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Create a public or private contest for the entire platform.
          </p>
        </div>
      </div>

      <ContestForm isAdmin={true} redirectPath="/admin/contests" />
    </div>
  );
}
