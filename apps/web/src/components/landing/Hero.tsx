"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Play, Activity, Zap } from "lucide-react";

export function Hero() {
  // Simulated real-time execution & proctoring metrics scanner
  const [activeTest, setActiveTest] = useState(1);
  const [latency, setLatency] = useState(14);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTest((prev) => (prev < 8 ? prev + 1 : 1));
      setLatency(Math.floor(Math.random() * 5) + 12); // Fluctuates between 12ms and 16ms
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden min-h-[85vh] justify-center" id="features">
      
      {/* Subtle Glowing Emerald Backdrop */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[650px] h-[350px] bg-emerald-500/15 blur-[140px] pointer-events-none rounded-full z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto space-y-6">
        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight drop-shadow-sm">
          Fair Coding Assessments,{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 animate-gradient">
            Without the Friction.
          </span>
        </h1>

        {/* Subdescription */}
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed">
          CodeProctor combines secure Docker evaluation queues with unobtrusive computer vision telemetry—guaranteeing exam integrity while providing candidates with a world-class developer experience.
        </p>

        {/* Call to Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 hover:scale-[1.02]"
          >
            <span>Explore Sandbox</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium rounded-xl text-base transition-all duration-200 flex items-center justify-center backdrop-blur-md hover:border-zinc-700"
          >
            <span>Live Demo Arena</span>
          </Link>
        </div>
      </div>

      {/* Animated Interactive Editor & Proctor Telemetry Card */}
      <div className="relative z-10 mt-16 w-full max-w-5xl bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md text-left transition-all duration-500 hover:border-zinc-700/80 group">
        
        {/* Subtle Animated Glowing Edge Border on Hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between pb-4 mb-4 border-b border-zinc-800/80 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-zinc-700 group-hover:bg-red-500/80 transition-colors" />
              <span className="w-3 h-3 rounded-full bg-zinc-700 group-hover:bg-yellow-500/80 transition-colors" />
              <span className="w-3 h-3 rounded-full bg-zinc-700 group-hover:bg-emerald-500/80 transition-colors" />
            </div>
            <span className="ml-2 text-zinc-300 font-sans font-medium">Problem: Zero-Trust Memory Allocator</span>
          </div>
          
          <div className="flex items-center gap-3 font-sans">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Proctor Sensor Active</span>
            </span>
            <span className="hidden sm:inline-block text-zinc-500 font-mono text-xs">Python 3.11</span>
          </div>
        </div>

        {/* Mock Code & Animated Telemetry Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 font-mono text-xs sm:text-sm">
          
          {/* Code IDE Showcase */}
          <div className="md:col-span-8 text-zinc-300 space-y-1.5 bg-zinc-950/90 p-5 rounded-xl border border-zinc-800/80 leading-relaxed overflow-x-auto shadow-inner">
            <p className="text-zinc-500"># Validates memory register checksums in O(N) time</p>
            <p><span className="text-purple-400 font-semibold">def</span> <span className="text-blue-400 font-semibold">find_target_registers</span>(registers, target):</p>
            <p className="pl-4">cache = {"{}"}</p>
            <p className="pl-4"><span className="text-purple-400 font-semibold">for</span> i, val <span className="text-purple-400 font-semibold">in</span> <span className="text-yellow-200">enumerate</span>(registers):</p>
            <p className="pl-8">complement = target - val</p>
            <p className="pl-8"><span className="text-purple-400 font-semibold">if</span> complement <span className="text-purple-400 font-semibold">in</span> cache:</p>
            <p className="pl-12"><span className="text-purple-400 font-semibold">return</span> [cache[complement], i]</p>
            <p className="pl-8">cache[val] = i</p>
            <p className="pl-4"><span className="text-purple-400 font-semibold">return</span> [-1, -1]</p>

            {/* Live Typing Execution Status Line */}
            <div className="pt-4 mt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="flex items-center gap-2 text-emerald-400">
                <Zap className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Docker Sandbox Evaluation Root: Verified</span>
              </span>
              <span className="bg-zinc-900 px-2 py-0.5 rounded text-[11px] text-zinc-400 border border-zinc-800">
                Memory: 11.4 MB
              </span>
            </div>
          </div>

          {/* Animated Telemetry & Biometrics Side Panel */}
          <div className="md:col-span-4 flex flex-col justify-between space-y-4 font-sans">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                <span>Live Telemetry Feed</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              </div>
              
              <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs transition-colors hover:border-zinc-700">
                <span className="text-zinc-400 font-medium">Webcam Biometrics</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gaze Normal
                </span>
              </div>

              <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs transition-colors hover:border-zinc-700">
                <span className="text-zinc-400 font-medium">Tab Focus & Window</span>
                <span className="text-emerald-400 font-semibold">Locked 100%</span>
              </div>

              <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs transition-colors hover:border-zinc-700">
                <span className="text-zinc-400 font-medium">Judge Worker Speed</span>
                <span className="text-zinc-200 font-mono font-bold">{latency}ms (BullMQ)</span>
              </div>

              {/* Animated Radar Progress Ticker */}
              <div className="p-3.5 bg-zinc-950/90 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                  <span>TEST SHARDS EVALUATING</span>
                  <span className="text-emerald-400">{activeTest}/8 PASSED</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(activeTest / 8) * 100}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full py-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 font-mono shadow-md shadow-emerald-500/5">
                <Play className="w-3.5 h-3.5 fill-emerald-400 animate-bounce" />
                <span>ALL TEST CASES PASSED (8/8)</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </section>
  );
}
