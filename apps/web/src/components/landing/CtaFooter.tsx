"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Logo } from "@/components/landing/Logo";

export function CtaFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-zinc-950">

      {/* Call to action box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto px-6 py-20 text-center space-y-6"
      >
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-50 max-w-2xl mx-auto leading-tight font-display">
          Ready to Elevate Your Technical Assessments?
        </h2>

        <p className="text-base sm:text-lg text-zinc-400 max-w-xl mx-auto">
          Deploy zero-trust programming assessments with real-time Docker evaluation queues and AI proctoring in seconds.
        </p>

        <div className="pt-4 flex justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl text-base transition-all duration-200 flex items-center gap-2 shadow-lg shadow-white/5 hover:scale-[1.02]"
          >
            <span>Start Free Assessment</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </motion.div>

      {/* Footer bottom */}
      <div className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-4">
            <Logo size={20} />
            <span>© {new Date().getFullYear()} CodeProctor AI. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
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
