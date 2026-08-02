import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../../components/AccessDenied";
import { getTagsServer } from "@/app/actions/admin/tags";
import { CreateProblemForm } from "./CreateProblemForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateProblemPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    return <AccessDenied message="You need the 'Manage Problems' permission to create problems." />;
  }

  const tags = await getTagsServer();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/problems"
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Problem</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Author a new problem for the global problem bank.
          </p>
        </div>
      </div>

      <CreateProblemForm initialTags={tags} />
    </div>
  );
}
