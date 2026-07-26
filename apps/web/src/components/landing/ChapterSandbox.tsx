"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Boxes, GitBranch, Layers, Zap } from "lucide-react";

const CODE_LINES = [
  "$ codeproctor submit solution.cpp --lang cpp",
  "> queued  ······ redis://jobs [pos 1]",
  "> spawning docker container [isolated]",
  "> limits  ······ cpu:1  mem:256mb  net:none",
  "> running testcases ████████████ 12/12",
  "> verdict ······ ACCEPTED  runtime 0.041s",
];

const stats = [
  { icon: Boxes, label: "ISOLATION", value: "Docker" },
  { icon: GitBranch, label: "QUEUE", value: "Redis-async" },
  { icon: Layers, label: "LANGUAGES", value: "Multi" },
  { icon: Zap, label: "LIMITS", value: "CPU / MEM" },
];

const Terminal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!inView) return;
    let idx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = () => {
      if (idx >= CODE_LINES.length) return;
      const current = idx;
      setLines((prev) => [...prev, CODE_LINES[current]]);
      idx += 1;
      timers.push(setTimeout(tick, 520));
    };
    timers.push(setTimeout(tick, 300));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="bg-[#0A0A0A] border border-[#1A1A1A]">
      <div className="flex items-center gap-3 border-b border-[#1A1A1A] px-4 py-3">
        <span className="w-3 h-3 bg-[#FF3B30]" />
        <span className="w-3 h-3 bg-[#FFCC00]" />
        <span className="w-3 h-3 bg-[#00FF66]" />
        <span className="font-mono text-[10px] text-[#8A8A8A] ml-2">judge — bash</span>
      </div>
      <div className="p-5 font-mono text-[11px] md:text-xs leading-7 min-h-[240px]">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className={
              l.includes("ACCEPTED")
                ? "text-[#00FF66]"
                : l.startsWith("$")
                ? "text-white"
                : "text-[#8A8A8A]"
            }
          >
            {l}
          </motion.div>
        ))}
        {lines.length < CODE_LINES.length && (
          <span className="inline-block w-2 h-4 bg-[#00FF66] animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
};

export const ChapterSandbox = () => {
  return (
    <section id="chapter-01" data-testid="chapter-sandbox" className="relative py-32 md:py-48 border-b border-[#1A1A1A]">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* sticky number */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <span className="font-mono text-sm text-[#00FF66]">[ 01 ]</span>
            <p className="font-mono text-xs text-[#8A8A8A] mt-4 tracking-widest">THE SANDBOX</p>
          </div>
        </div>

        <div className="lg:col-span-9">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-extrabold uppercase text-5xl md:text-7xl tracking-tighter leading-[0.9]"
          >
            Isolated <span className="text-stroke">&amp;</span> Async
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 max-w-xl font-mono text-sm text-[#8A8A8A] leading-relaxed"
          >
            Every submission runs inside a resource-limited Docker container — malicious or faulty programs can never touch the host. Requests flow through a Redis-backed job queue, evaluated asynchronously across multiple languages.
          </motion.p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <Terminal />
            <div className="grid grid-cols-2 border-t border-l border-[#1A1A1A]">
              {stats.map((s) => (
                <div key={s.label} className="border-b border-r border-[#1A1A1A] p-6 group hover:bg-[#0A0A0A] transition-colors">
                  <s.icon className="w-5 h-5 text-[#00FF66] mb-6" strokeWidth={1.5} />
                  <div className="font-mono text-[10px] text-[#8A8A8A] tracking-widest">{s.label}</div>
                  <div className="font-display font-bold text-2xl mt-1">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
