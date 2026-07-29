"use client";

import React from "react";
import { motion } from "framer-motion";
import { Terminal, CheckCircle2, Zap, Cpu, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export function ChapterSandbox() {
  const features = [
    {
      title: "Multi-Language Support",
      description: "Run code across Python 3.11, C++ (GCC 13), and Java (OpenJDK 21) out of the box.",
      icon: Cpu,
    },
    {
      title: "Strict Resource Bounding",
      description: "Enforce exact millisecond execution time limits and memory allocation caps.",
      icon: Zap,
    },
    {
      title: "BullMQ & Redis Workers",
      description: "Asynchronous job evaluation queues assure zero server bottlenecks during thousands of simultaneous submissions.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto" id="sandbox">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-medium">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Sandboxed Judge Engine</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 leading-tight font-display">
            Isolated Code Execution with Guaranteed Security.
          </h2>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Execute untrusted candidate code inside ephemeral Docker containers without risking infrastructure integrity. Each submission is evaluated against secret verification test cases in milliseconds.
          </p>

          <div className="space-y-6 pt-4">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className="flex gap-4 items-start"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 text-zinc-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">{feat.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{feat.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Right Column: Terminal Card with Spotlight */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6"
        >
          <SpotlightCard className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 text-xs font-mono text-zinc-500">
              <span className="text-zinc-300 font-sans font-medium">Worker Queue: evaluation-pipeline-v7</span>
              <span className="text-zinc-400 font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" />
                <span>Active Shards: 4/4</span>
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-200 font-semibold">submission-8A4F-C991.py</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-500">
                  <span>Python 3.11</span>
                  <span className="text-zinc-300 font-bold">ACCEPTED 24ms</span>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-200 font-semibold">submission-B309-E812.cpp</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-500">
                  <span>C++ (GCC 13)</span>
                  <span className="text-zinc-300 font-bold">ACCEPTED 8ms</span>
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950/60 rounded-xl border border-white/[0.04] flex items-center justify-between opacity-70">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-zinc-500 ml-1 animate-pulse" />
                  <span className="text-zinc-400">submission-C192-A704.java</span>
                </div>
                <div className="flex items-center gap-4 text-zinc-500">
                  <span>Java 21</span>
                  <span className="text-zinc-400 font-medium">EVALUATING...</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-400 font-sans flex items-center justify-between">
              <span>Average Judge Latency</span>
              <span className="font-mono font-bold text-sm text-zinc-200">18.4 ms per submission</span>
            </div>
          </SpotlightCard>
        </motion.div>

      </div>
    </section>
  );
}
