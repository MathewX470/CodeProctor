"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Eye, Users, UserX, Monitor, PanelsTopLeft, ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";

const EVENTS = [
  { time: "10:41:02", label: "Session started", detail: "Face verified · single subject detected in frame", level: "ok" as const, icon: Eye, badge: "CLEAR" },
  { time: "10:42:17", label: "Tab switched", detail: "Focus temporarily left the active contest window (Duration: 1.8s)", level: "warn" as const, icon: PanelsTopLeft, badge: "WARNING" },
  { time: "10:43:50", label: "Full-screen exited", detail: "Enforcement breach recorded via browser screen API", level: "warn" as const, icon: Monitor, badge: "WARNING" },
  { time: "10:45:09", label: "Multiple subjects flagged", detail: "Secondary audio or movement detected near workstation", level: "alert" as const, icon: Users, badge: "FLAGGED" },
  { time: "10:47:33", label: "Prolonged gaze diversion", detail: "Candidate gaze focused off-screen for 8.2 seconds", level: "alert" as const, icon: UserX, badge: "FLAGGED" },
];

const levelColor: Record<string, string> = {
  ok: "#00FF66",
  warn: "#FFCC00",
  alert: "#FF3B30",
};

export const ChapterProctor = () => {
  const [active, setActive] = useState(0);

  const getBadgeIcon = (level: string) => {
    if (level === "ok") return <ShieldCheck className="w-3.5 h-3.5 text-[#00FF66]" />;
    if (level === "warn") return <AlertTriangle className="w-3.5 h-3.5 text-[#FFCC00]" />;
    return <AlertCircle className="w-3.5 h-3.5 text-[#FF3B30]" />;
  };

  return (
    <section id="chapter-02" data-testid="chapter-proctor" className="relative py-32 md:py-48 border-b border-[#1A1A1A]">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <span className="font-mono text-sm text-[#00FF66]">[ 02 ]</span>
            <p className="font-mono text-xs text-[#8A8A8A] mt-4 tracking-widest uppercase">THE PROCTOR</p>
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
            Explainable <br /> <span className="text-stroke">Malpractice</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 max-w-2xl font-mono text-sm text-[#8A8A8A] leading-relaxed"
          >
            Not a black-box verdict — an uneditable, timestamped chronological timeline. Click through each event to evaluate security integrity without invasive webcam storage or false AI assumptions.
          </motion.p>

          {/* Full-Width Interactive Timeline Monitor (Without Photo Webcam Box) */}
          <div className="mt-12 w-full border border-[#1A1A1A] bg-[#0A0A0A]/60 rounded-sm shadow-xl overflow-hidden" data-testid="proctoring-timeline">
            <div className="flex items-center justify-between border-b border-[#1A1A1A] px-6 py-4 bg-[#08080A]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00FF66] animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase text-zinc-300 tracking-wider">
                  Session Audit Log — Candidate Timeline
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#8A8A8A] hidden sm:inline">
                5 telemetry events logged
              </span>
            </div>

            <div className="divide-y divide-[#1A1A1A]">
              {EVENTS.map((e, i) => {
                const isActive = i === active;
                const color = levelColor[e.level];
                const IconComponent = e.icon;
                return (
                  <button
                    key={i}
                    data-testid={`timeline-event-${i}`}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    className={`w-full text-left px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200 cursor-pointer ${
                      isActive ? "bg-[#0F0F12]" : "hover:bg-[#0C0C0F]"
                    }`}
                    style={isActive ? { borderLeft: `4px solid ${color}` } : { borderLeft: "4px solid transparent" }}
                  >
                    <div className="flex items-start md:items-center gap-4 flex-1">
                      <div className="p-2 rounded bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5 md:mt-0">
                        <IconComponent className="w-4 h-4" strokeWidth={1.5} style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`font-mono text-sm font-semibold ${isActive ? "text-white" : "text-[#B0B0B0]"}`}>
                            {e.label}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider border"
                            style={{
                              color,
                              borderColor: `${color}40`,
                              backgroundColor: `${color}15`,
                            }}
                          >
                            {getBadgeIcon(e.level)}
                            {e.badge}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-[#8A8A8A] mt-1.5 leading-relaxed">
                          {e.detail}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 font-mono text-xs text-[#8A8A8A] md:text-right pl-12 md:pl-0">
                      <div className="font-semibold text-zinc-400">{e.time}</div>
                      <div className="text-[10px] uppercase text-[#606060] mt-0.5">EST SYNC</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[#1A1A1A] bg-[#060608] flex items-center justify-between text-xs font-mono text-[#8A8A8A]">
              <span>🔒 SHA-256 Timestamps cryptographic hash verified</span>
              <span className="text-[#00FF66]">Full playback available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
