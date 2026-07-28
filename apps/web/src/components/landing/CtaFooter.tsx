"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/landing/Logo";

export function CtaFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950">

      {/* Call to action box */}
      <div className="max-w-5xl mx-auto px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto leading-tight">
          Ready to Elevate Your Technical Assessments?
        </h2>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto">
          Deploy zero-trust programming assessments with real-time Docker evaluation queues and AI proctoring in seconds.
        </p>

        <div className="pt-4 flex justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl text-base transition-all duration-200 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span>Start Free Assessment</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Footer bottom links & copyright */}
      <div className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <Logo size={20} />
            <span>© {new Date().getFullYear()} CodeProctor AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </span>
            <a href="#features" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#sandbox" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="#proctoring" className="hover:text-zinc-300 transition-colors">Documentation</a>
          </div>
        </div>
      </div>

    </footer>
  );
}
