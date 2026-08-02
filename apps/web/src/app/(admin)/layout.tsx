"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Database, 
  Megaphone, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Contests", href: "/admin/contests", icon: Trophy },
  { label: "Problem Bank", href: "/admin/problems", icon: Database },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const hasRedirected = React.useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          if (role !== "ADMIN") {
            router.replace("/dashboard");
          }
        });
      });
    }
  }, [session, isPending, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col md:flex-row transition-colors">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <Link href="/admin">
          <Logo size={24} textClassName="text-slate-900 dark:text-white" />
        </Link>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-500 dark:text-zinc-400"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-zinc-800">
          <Link href="/admin" onClick={() => setIsMobileOpen(false)}>
            <Logo size={24} textClassName="text-slate-900 dark:text-white" />
          </Link>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-3">
            Admin Portal
          </div>
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" 
                    : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 space-y-1">
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-colors"
          >
            {mounted ? (resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Sun className="w-4 h-4 opacity-0" />}
            Toggle Theme
          </button>
          
          <button
            onClick={async () => {
              sessionStorage.setItem("isLoggingOut", "true");
              await signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Overlay for Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
