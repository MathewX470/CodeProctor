import React from "react";
import { Wrench } from "lucide-react";

export function MaintenanceScreen() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-10 rounded-3xl max-w-md shadow-2xl">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Down for Maintenance</h1>
        <p className="text-slate-500 dark:text-zinc-400 text-sm">
          CodeProctor is currently undergoing scheduled maintenance. Please check back later!
        </p>
      </div>
    </div>
  );
}
