"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center p-2 rounded-xl transition-colors bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 border border-slate-200 dark:border-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      title="Toggle theme"
    >
      <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
