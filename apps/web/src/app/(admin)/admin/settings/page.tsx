import React from "react";
import { getSessionWithRoles } from "@/app/actions/auth";
import { AccessDenied } from "../components/AccessDenied";
import { AdminSettingsForm } from "./AdminSettingsClient";
import { getPlatformSettingsServer } from "@/app/actions/admin-settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const { isSuperAdmin } = await getSessionWithRoles();

  if (!isSuperAdmin) {
    return <AccessDenied message="You need SuperAdmin privileges to manage platform settings." />;
  }

  const initialData = await getPlatformSettingsServer();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Settings</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Manage global configurations and security parameters.
        </p>
      </div>

      <AdminSettingsForm initialData={initialData} />

    </div>
  );
}
