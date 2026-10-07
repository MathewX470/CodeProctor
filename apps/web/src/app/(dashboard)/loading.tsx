import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] w-full animate-in fade-in duration-300">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/50 backdrop-blur-sm shadow-sm">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500 dark:text-blue-400" />
        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300 tracking-tight">
          Loading...
        </span>
      </div>
    </div>
  );
}
