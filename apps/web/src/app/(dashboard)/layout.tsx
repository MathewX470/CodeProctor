"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { AnimatedGrid } from "@/components/dashboard/AnimatedGrid";
import { Loader2, ShieldAlert } from "lucide-react";
import { Toaster } from "sonner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  
  const isIdePage = pathname?.match(/^\/problems\/[^/]+$/);

  const hasRedirected = React.useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    if (!isPending && !session?.user) {
      hasRedirected.current = true;
      const isLoggingOut = typeof window !== "undefined" && sessionStorage.getItem("isLoggingOut") === "true";
      if (isLoggingOut) {
        router.replace("/");
      } else {
        router.replace("/login");
      }
      return;
    }

    if (!isPending && session?.user) {
      import("@/app/actions/auth").then(({ getUserRoleServer }) => {
        getUserRoleServer().then((role) => {
          if (role === "ADMIN") {
            router.replace("/admin");
          }
        });
      });
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col items-center justify-center font-sans p-6 transition-colors duration-300">
        <div className="flex items-center gap-3 border border-slate-200 dark:border-zinc-800 px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 shadow-xl dark:shadow-2xl transition-colors">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400 dark:text-zinc-400" />
          <span className="text-sm font-medium text-slate-600 dark:text-zinc-200">Initializing workspace...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col items-center justify-center font-sans p-6 transition-colors duration-300">
        <div className="flex items-center gap-3 border border-red-200 dark:border-red-500/30 px-6 py-4 rounded-xl bg-white dark:bg-zinc-900 text-red-500 dark:text-red-400 shadow-xl dark:shadow-2xl transition-colors">
          <ShieldAlert className="w-5 h-5 text-red-500 dark:text-red-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-zinc-200">Redirecting to sign-in...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-zinc-800 dark:selection:text-zinc-100 relative overflow-x-hidden flex flex-col transition-colors duration-300">
      {/* React Bits style animated background */}
      {!isIdePage && <AnimatedGrid gridSize={40} className="fixed z-0" />}

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
      <main className={`flex-1 relative z-10 w-full ${isIdePage ? "" : "max-w-7xl mx-auto px-6 py-8 sm:py-12"}`}>
        {children}
      </main>

      {/* Footer Minimal Status */}
      {!isIdePage && (
        <footer className="border-t border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm py-6 px-6 text-center text-xs text-slate-500 dark:text-zinc-500 relative z-10 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>CodeProctor Arena &bull; Zero-Trust Sandbox & AI Proctoring</span>
            <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-zinc-400 animate-pulse" />
              <span>Telemetry Stream: Active</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
