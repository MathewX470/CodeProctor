import { getAdminProblemsServer } from "@/app/actions/admin/problems";
import { ProblemsTable } from "./ProblemsTable";
import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../components/AccessDenied";

export default async function AdminProblemsPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_PROBLEMS")) {
    return <AccessDenied message="You need the 'Manage Problems' permission to view this page." />;
  }

  const problems = await getAdminProblemsServer();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Problem Bank</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage the global bank of competitive programming problems.
          </p>
        </div>
      </div>

      <ProblemsTable initialProblems={problems} />
    </div>
  );
}
