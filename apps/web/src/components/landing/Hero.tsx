"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Play, Activity } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";
import { TerminalTyper } from "@/components/landing/TerminalTyper";

export function Hero() {
  const [activeTest, setActiveTest] = useState(1);
  const [latency, setLatency] = useState(14);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTest((prev) => (prev < 8 ? prev + 1 : 1));
      setLatency(Math.floor(Math.random() * 5) + 12);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const terminalLines = [
    "docker run --rm codeproctor/sandbox:v7",
    "evaluating submission-8A4F.py ...",
    "all 8 test cases passed ✓",
    "latency: 24ms | memory: 11.4MB",
  ];

  return (
    <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden min-h-[85vh] justify-center" id="features">

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center max-w-4xl mx-auto space-y-6"
      >
        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-zinc-50 leading-tight font-display">
          Fair Coding Assessments,{" "}
          <span className="text-zinc-400">
            Without the Friction.
          </span>
        </h1>

        {/* Subdescription */}
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed">
          CodeProctor combines secure Docker evaluation queues with unobtrusive computer vision telemetry—guaranteeing exam integrity while providing a world-class developer experience.
        </p>

        {/* CTA Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-white/5 hover:scale-[1.02]"
          >
            <span>Explore Sandbox</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] font-medium rounded-xl text-base transition-all duration-200 flex items-center justify-center backdrop-blur-md hover:border-white/[0.15]"
          >
            <span>Live Demo Arena</span>
          </Link>
        </div>
      </motion.div>

      {/* Interactive Editor & Proctor Telemetry Card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-16 w-full max-w-5xl"
      >
        <SpotlightCard className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md text-left transition-all duration-500 hover:border-white/[0.12]">

          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06] text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-zinc-500 transition-colors" />
                <span className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-zinc-500 transition-colors" />
                <span className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-zinc-500 transition-colors" />
              </div>
              <span className="ml-2 text-zinc-300 font-sans font-medium">Problem: Zero-Trust Memory Allocator</span>
            </div>

            <div className="flex items-center gap-3 font-sans">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-[11px] font-medium">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Proctor Active</span>
              </span>
              <span className="hidden sm:inline-block text-zinc-500 font-mono text-xs">Python 3.11</span>
            </div>
          </div>

          {/* Code & Telemetry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono text-xs sm:text-sm">

            {/* Code IDE */}
            <div className="md:col-span-8 text-zinc-300 space-y-1.5 bg-zinc-950/80 p-5 rounded-xl border border-white/[0.04] leading-relaxed overflow-x-auto shadow-inner">
              <p className="text-zinc-600"># Validates memory register checksums in O(N) time</p>
              <p><span className="text-zinc-400 font-semibold">def</span> <span className="text-zinc-200 font-semibold">find_target_registers</span>(registers, target):</p>
              <p className="pl-4">cache = {"{}"}</p>
              <p className="pl-4"><span className="text-zinc-400 font-semibold">for</span> i, val <span className="text-zinc-400 font-semibold">in</span> <span className="text-zinc-300">enumerate</span>(registers):</p>
              <p className="pl-8">complement = target - val</p>
              <p className="pl-8"><span className="text-zinc-400 font-semibold">if</span> complement <span className="text-zinc-400 font-semibold">in</span> cache:</p>
              <p className="pl-12"><span className="text-zinc-400 font-semibold">return</span> [cache[complement], i]</p>
              <p className="pl-8">cache[val] = i</p>
              <p className="pl-4"><span className="text-zinc-400 font-semibold">return</span> [-1, -1]</p>

              {/* Terminal typing effect */}
              <div className="pt-4 mt-3 border-t border-white/[0.04]">
                <TerminalTyper lines={terminalLines} typingSpeed={35} pauseBetweenLines={600} />
              </div>
            </div>

            {/* Telemetry Side Panel */}
            <div className="md:col-span-4 flex flex-col justify-between space-y-4 font-sans">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">
                  <span>Live Telemetry</span>
                  <Activity className="w-3.5 h-3.5 text-zinc-400 animate-pulse" />
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs transition-colors hover:border-white/[0.12]">
                  <span className="text-zinc-400 font-medium">Webcam Biometrics</span>
                  <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Gaze Normal
                  </span>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs transition-colors hover:border-white/[0.12]">
                  <span className="text-zinc-400 font-medium">Tab Focus & Window</span>
                  <span className="text-zinc-300 font-semibold">Locked 100%</span>
                </div>

                <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] flex items-center justify-between text-xs transition-colors hover:border-white/[0.12]">
                  <span className="text-zinc-400 font-medium">Judge Worker Speed</span>
                  <span className="text-zinc-200 font-mono font-bold">{latency}ms (BullMQ)</span>
                </div>

                {/* Progress Ticker */}
                <div className="p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-500 font-mono text-[11px]">
                    <span>TEST SHARDS</span>
                    <span className="text-zinc-300">{activeTest}/8 PASSED</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-zinc-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(activeTest / 8) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="w-full py-3 bg-white/[0.04] border border-white/[0.08] text-zinc-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 font-mono">
                  <Play className="w-3.5 h-3.5 fill-zinc-400 text-zinc-400" />
                  <span>ALL TEST CASES PASSED (8/8)</span>
                </div>
              </div>
            </div>

          </div>
        </SpotlightCard>
      </motion.div>

    </section>
  );
}
