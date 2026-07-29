"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { AnimatedGrid } from "@/components/dashboard/AnimatedGrid";
import { Loader2, ShieldAlert } from "lucide-react";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center font-sans p-6">
        <div className="flex items-center gap-3 border border-slate-200 px-6 py-4 rounded-xl bg-white shadow-xl">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Initializing workspace...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center font-sans p-6">
        <div className="flex items-center gap-3 border border-red-200 px-6 py-4 rounded-xl bg-white text-red-500 shadow-xl">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-slate-700">Redirecting to sign-in...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative overflow-x-hidden flex flex-col">
      {/* React Bits style animated background - Light Mode */}
      <AnimatedGrid color="rgba(15, 23, 42, 0.05)" gridSize={40} className="fixed z-0" />

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#fff",
            borderRadius: "0.75rem",
            fontFamily: "var(--font-inter), sans-serif",
          },
        }}
      />
      
      {/* Universal Command Header */}
      <DashboardNav />

      {/* Main Content Arena */}
      <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-6 py-8 sm:py-12">
        {children}
      </main>

      {/* Footer Minimal Status */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm py-6 px-6 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>CodeProctor Arena &bull; Zero-Trust Sandbox & AI Proctoring</span>
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Telemetry Stream: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
