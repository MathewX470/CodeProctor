"use client";

import React, { useTransition } from "react";
import { Save, Shield, Globe } from "lucide-react";
import { toast } from "sonner";
import { savePlatformSettingsServer } from "@/app/actions/admin-settings";

export function AdminSettingsForm({ initialData }: { initialData: any }) {
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      platformName: formData.get("platformName"),
      supportEmail: formData.get("supportEmail"),
      requireVerification: formData.get("requireVerification") === "on",
      allowPublicRegistration: formData.get("allowPublicRegistration") === "on",
      maintenanceMode: formData.get("maintenanceMode") === "on",
    };

    startTransition(async () => {
      const res = await savePlatformSettingsServer(data);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Platform settings updated successfully");
      }
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* General Settings */}
      <section className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">General</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Platform Name</label>
            <input 
              type="text" 
              name="platformName"
              defaultValue={initialData.platformName}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1.5">Support Email</label>
            <input 
              type="email" 
              name="supportEmail"
              defaultValue={initialData.supportEmail}
              className="w-full px-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Security & Access */}
      <section className="bg-white dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security & Access</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div className="font-medium text-slate-900 dark:text-white text-sm">Require Email Verification</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Users must verify their email before joining contests.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="requireVerification" className="sr-only peer" defaultChecked={initialData.requireVerification} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <div className="font-medium text-slate-900 dark:text-white text-sm">Allow Public Registration</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Anyone can create an account on the platform.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="allowPublicRegistration" className="sr-only peer" defaultChecked={initialData.allowPublicRegistration} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium text-slate-900 dark:text-white text-sm">Global Maintenance Mode</div>
              <div className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Locks out all non-admin users.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" name="maintenanceMode" className="sr-only peer" defaultChecked={initialData.maintenanceMode} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4">
        <button 
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-200 dark:shadow-none hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

    </form>
  );
}
