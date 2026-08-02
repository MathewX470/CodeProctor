import React from "react";
import { ShieldAlert } from "lucide-react";

export function AccessDenied({ message = "You do not have permission to view this page." }: { message?: string }) {
  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h1>
      <p className="text-slate-500 dark:text-zinc-400 max-w-md">
        {message}
      </p>
    </div>
  );
}
