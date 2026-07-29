"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";
import { ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            router.push("/login");
          },
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to disconnect session");
    }
  };

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Problem Bank", href: "/problems" },
    { label: "Telemetry & Logs", href: "/dashboard#activity" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Route Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center group">
            <Logo size={26} className="group-hover:opacity-90 transition-opacity" />
          </Link>

          <nav className="hidden lg:flex items-center gap-2 font-sans text-xs text-slate-500 dark:text-zinc-400">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/problems" && pathname.startsWith("/problems"));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full transition-all font-medium ${
                    isActive
                      ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm dark:text-white dark:bg-white/[0.05] dark:border-white/[0.05] dark:shadow-none"
                      : "hover:text-slate-900 border border-transparent hover:bg-slate-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Theme, Proctor Sensor Badge & Candidate Profile */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {/* Proctor Readiness Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 shadow-sm rounded-full text-xs font-medium text-slate-600 dark:bg-white/[0.03] dark:border-white/[0.06] dark:shadow-none dark:text-zinc-300 transition-colors">
            <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-zinc-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Sensors Nominal</span>
          </div>

          {/* Candidate Profile Box */}
          <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200 dark:sm:border-zinc-800 transition-colors">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-slate-900 dark:text-zinc-200 font-medium tracking-tight">
                {session?.user?.name || session?.user?.email?.split("@")[0] || "Candidate"}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-mono">
                Verified Profile
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:shadow-inner transition-all font-medium text-xs rounded-xl flex items-center gap-2"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline-block">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
