"use client";

import React, { useState, useEffect } from "react";
import { X, Shield, Save } from "lucide-react";
import { AdminUser } from "./UsersTable";
import { updateUserRolesServer } from "@/app/actions/admin/users";
import { toast } from "sonner";

export function ManageRolesModal({ user, onClose }: { user: AdminUser, onClose: () => void }) {
  const [roles, setRoles] = useState<string[]>(user.roles);
  const [isSaving, setIsSaving] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleToggle = (role: string) => {
    setRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserRolesServer(user.id, roles);
      toast.success("Roles updated successfully.");
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to update roles.");
    } finally {
      setIsSaving(false);
    }
  };

  const rbacOptions = [
    { id: "RBAC_USERS", label: "Manage Users", description: "Can view and manage users (Super Admins only typically)" },
    { id: "RBAC_CONTESTS", label: "Manage Contests", description: "Can create, edit, and delete global platform contests" },
    { id: "RBAC_PROBLEMS", label: "Manage Problems", description: "Can create, edit, and delete problems in the public bank" },
    { id: "RBAC_ANNOUNCEMENTS", label: "Manage Announcements", description: "Can broadcast announcements across the platform" },
    { id: "RBAC_ANALYTICS", label: "View Analytics", description: "Can view platform usage statistics" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Manage Access</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{user.name} ({user.email})</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Base Admin Role */}
          <div className="flex items-start gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/5">
            <div className="mt-0.5 text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-zinc-100">
                    Administrator Access
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Grants access to the admin portal. Required for any other permissions to take effect.
                  </span>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={roles.includes("ADMIN")}
                    onChange={() => handleToggle("ADMIN")}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-zinc-800" />

          {/* Granular Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Page-Level Permissions</h3>
            <div className="space-y-3">
              {rbacOptions.map((opt) => (
                <label key={opt.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                  roles.includes(opt.id) 
                    ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-500/30 dark:bg-indigo-500/5" 
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                } ${!roles.includes("ADMIN") ? "opacity-50 pointer-events-none" : ""}`}>
                  <div>
                    <span className="block text-sm font-medium text-slate-900 dark:text-zinc-100">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {opt.description}
                    </span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-zinc-800 focus:ring-2 dark:bg-zinc-700 dark:border-zinc-600"
                    checked={roles.includes(opt.id)}
                    onChange={() => handleToggle(opt.id)}
                    disabled={!roles.includes("ADMIN")}
                  />
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-blue-500/20"
          >
            {isSaving ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
