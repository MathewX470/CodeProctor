"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, Lock, Video } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export function ChapterProctor() {
  const capabilities = [
    {
      title: "Real-Time Gaze Angle Tracking",
      description: "Our OpenCV pipeline continuously monitors where the candidate is looking—identifying persistent sideways glances without intrusive software installation.",
      icon: Eye,
    },
    {
      title: "Facial Presence Identification",
      description: "Detects absences or unauthorized multiple faces appearing within the camera frame during examination sessions.",
      icon: Video,
    },
    {
      title: "Browser Tab-Switch & Copy-Paste Protection",
      description: "Window blur sensors register illegal tab switches and prevent bulk pasting of external LLM-generated code into the exam sandbox.",
      icon: Lock,
    },
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.06]" id="proctoring">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Visual Demo Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 order-2 lg:order-1"
        >
          <SpotlightCard className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 shadow-xl backdrop-blur-sm space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 text-xs">
              <span className="text-zinc-300 font-medium">Live Candidate Telemetry Stream</span>
              <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08] text-[11px] font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse" />
                <span>Monitoring Active</span>
              </span>
            </div>

            {/* Simulated webcam feed frame */}
            <div className="relative aspect-video rounded-xl bg-zinc-950 border border-white/[0.04] flex flex-col items-center justify-center overflow-hidden p-6 text-center">
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
              
              <div className="relative z-10 space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400 shadow-md">
                  <Video className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-zinc-200">Webcam Biometrics Nominal</h4>
                <p className="text-xs text-zinc-500 font-normal">
                  Face detected at (x: 210, y: 180). Ocular gaze vector within acceptable +12° tolerance window.
                </p>
              </div>

              <div className="absolute top-4 left-4 font-mono text-[11px] text-zinc-500 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-white/[0.06]">
                FPS: 29.8 // Resolution: 720p
              </div>
              <div className="absolute top-4 right-4 font-mono text-[11px] text-zinc-300 bg-white/[0.05] px-2.5 py-1 rounded-md border border-white/[0.08]">
                TRUST SCORE: 100%
              </div>
            </div>

            {/* Status Pills */}
            <div className="pt-2 grid grid-cols-3 gap-3 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/[0.04] text-zinc-400">
                <div className="text-[10px] text-zinc-500 mb-0.5">FACE COUNT</div>
                <div className="font-bold text-zinc-300">1 (VERIFIED)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/[0.04] text-zinc-400">
                <div className="text-[10px] text-zinc-500 mb-0.5">GAZE DEVIATION</div>
                <div className="font-bold text-zinc-300">NOMINAL</div>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-950/60 border border-white/[0.04] text-zinc-400">
                <div className="text-[10px] text-zinc-500 mb-0.5">TAB SWITCHES</div>
                <div className="font-bold text-zinc-300">0 DETECTED</div>
              </div>
            </div>

          </SpotlightCard>
        </motion.div>

        {/* Right Column: Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 order-1 lg:order-2 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-zinc-300 text-xs font-medium">
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span>AI Computer Vision Service</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 leading-tight font-display">
            Intelligent, Non-Invasive Proctoring Sensors.
          </h2>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Protect assessment integrity without subjecting candidates to invasive root-level software downloads. Our lightweight browser webcam analysis preserves privacy while eliminating exam collusion.
          </p>

          <div className="space-y-6 pt-4">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
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
                    <h3 className="text-base font-semibold text-zinc-100">{item.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
