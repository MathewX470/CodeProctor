import { getAdminUsersServer } from "@/app/actions/admin/users";
import { UsersTable } from "./UsersTable";
import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../components/AccessDenied";

export default async function AdminUsersPage() {
  const { isSuperAdmin, permissions } = await getSessionWithRoles();
  
  if (!isSuperAdmin && !permissions.includes("RBAC_USERS")) {
    return <AccessDenied message="You need the 'Manage Users' permission to view this page." />;
  }

  const users = await getAdminUsersServer();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Manage platform users and their administrative access roles.
          </p>
        </div>
      </div>

      <UsersTable initialUsers={users} />
    </div>
  );
}
