"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
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
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans p-6">
        <div className="flex items-center gap-3 border border-zinc-800 px-6 py-4 rounded-xl bg-zinc-900 text-emerald-400 shadow-2xl">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
          <span className="text-sm font-medium text-zinc-200">Initializing workspace...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center font-sans p-6">
        <div className="flex items-center gap-3 border border-red-500/30 px-6 py-4 rounded-xl bg-zinc-900 text-red-400 shadow-2xl">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium text-zinc-200">Redirecting to sign-in...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-400 relative overflow-x-hidden flex flex-col">
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
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 px-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>CodeProctor Arena &bull; Zero-Trust Sandbox & AI Proctoring</span>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Stream: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
