import React from "react";
import { Terminal, Shield, Cpu, Database, Cloud, Lock } from "lucide-react";

export function Marquee() {
  const items = [
    { icon: Cpu, label: "Docker Isolated Sandbox" },
    { icon: Shield, label: "Real-Time Webcam Gaze Tracking" },
    { icon: Terminal, label: "BullMQ Asynchronous Evaluation" },
    { icon: Database, label: "Neon Serverless PostgreSQL" },
    { icon: Lock, label: "Zero-Trust Tab Focus Sensors" },
    { icon: Cloud, label: "Better Auth Encrypted Sessions" },
  ];

  return (
    <section className="py-12 border-y border-zinc-800/60 bg-zinc-900/20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-xs uppercase font-medium tracking-wider text-zinc-500 mb-8">
          Built for High-Stakes Competitions, University Examinations, and Enterprise Recruiting
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                <Icon className="w-4 h-4 text-emerald-500/80" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
