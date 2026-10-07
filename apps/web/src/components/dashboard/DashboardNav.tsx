"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";
import { LogOut, User, Settings, Sun, Moon, ChevronDown, Bell, Trophy, Mail, ShieldAlert, Code2 } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { getNotifications, markNotificationsAsRead } from "@/app/actions/notifications";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch notifications
    if (session?.user) {
      getNotifications().then(res => {
        if (res.notifications) {
          setNotifications(res.notifications);
          setUnreadCount(res.notifications.filter(n => !n.isRead).length);
        }
      });
    }
  }, [session?.user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      sessionStorage.setItem("isLoggingOut", "true");
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            router.push("/");
          },
        },
      });
    } catch (e) {
      console.error(e);
      sessionStorage.removeItem("isLoggingOut");
      toast.error("Failed to disconnect session");
    }
  };

  const handleNotifToggle = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0) {
      // Mark as read when opening
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await markNotificationsAsRead();
    }
  };

  const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Contests", href: "/contests" },
    { label: "Practice", href: "/problems" },
    { label: "Submissions", href: "/submissions" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Route Tabs */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center group text-slate-900 dark:text-white">
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

        {/* Right: Notifications & Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={handleNotifToggle}
              className="relative p-2 rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors block focus:outline-none"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-zinc-950"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800/80 font-semibold text-sm text-slate-900 dark:text-white flex justify-between items-center">
                  Notifications
                </div>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-zinc-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(record => {
                      const notif = record.notification;
                      let Icon = Bell;
                      let iconColor = "text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20";
                      
                      if (notif.type === "CONTEST_STARTED") {
                        Icon = Trophy;
                        iconColor = "text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20";
                      } else if (notif.type === "INVITATION") {
                        Icon = Mail;
                        iconColor = "text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20";
                      } else if (notif.type === "DISQUALIFICATION") {
                        Icon = ShieldAlert;
                        iconColor = "text-red-500 bg-red-50 border-red-100 dark:bg-red-500/10 dark:border-red-500/20";
                      } else if (notif.type === "SUBMISSION_JUDGED") {
                        Icon = Code2;
                        iconColor = "text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20";
                      }

                      return (
                        <div key={record.id} className="p-4 transition-colors flex gap-3 hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                          <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border ${iconColor}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {notif.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 block">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 pl-2 sm:border-l sm:border-slate-200 dark:sm:border-zinc-800 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs text-slate-900 dark:text-zinc-200 font-medium tracking-tight">
                  {session?.user?.name || session?.user?.email?.split("@")[0] || "Candidate"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  Verified Profile
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
                
                {/* Profile Link */}
                <Link
                  href="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <span>My Profile</span>
                </Link>

                {/* Settings Link */}
                <Link
                  href="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                  <span>Settings</span>
                </Link>

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors text-left"
                >
                  {mounted ? (
                    resolvedTheme === "dark" ? (
                      <Sun className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    )
                  ) : (
                    <Sun className="w-4 h-4 opacity-0 text-slate-400 dark:text-zinc-500" />
                  )}
                  <span>Toggle Theme</span>
                </button>

                <div className="h-px bg-slate-100 dark:bg-zinc-800/80 my-1.5" />

                {/* Sign Out */}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
