"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";
import { ShieldCheck, LogOut } from "lucide-react";
import { toast } from "sonner";

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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Route Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center group">
            <Logo size={26} className="group-hover:opacity-90 transition-opacity" />
          </Link>

          <nav className="hidden lg:flex items-center gap-2 font-sans text-xs text-slate-500">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/problems" && pathname.startsWith("/problems"));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3.5 py-1.5 rounded-full transition-all font-medium ${
                    isActive
                      ? "text-blue-700 bg-blue-50 border border-blue-100 shadow-sm"
                      : "hover:text-slate-900 border border-transparent hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Proctor Sensor Badge & Candidate Profile */}
        <div className="flex items-center gap-4">
          {/* Proctor Readiness Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 shadow-sm rounded-full text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Sensors Nominal</span>
          </div>

          {/* Candidate Profile Box */}
          <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs text-slate-900 font-medium tracking-tight">
                {session?.user?.name || session?.user?.email?.split("@")[0] || "Candidate"}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                Verified Profile
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all font-medium text-xs rounded-xl flex items-center gap-2 shadow-sm"
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
