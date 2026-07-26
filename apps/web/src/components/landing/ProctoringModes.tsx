"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Maximize, Camera } from "lucide-react";

const MODES = [
  {
    id: "normal",
    tag: "MODE 01",
    icon: ShieldCheck,
    title: "Normal",
    desc: "Lightweight integrity checks. Ideal for practice problems and low-stakes contests where flow matters most.",
    accent: "#00FF66",
  },
  {
    id: "fullscreen",
    tag: "MODE 02",
    icon: Maximize,
    title: "Full-Screen Enforcement",
    desc: "Locks the assessment to full-screen. Tab switches and exits are captured via browser APIs and timestamped instantly.",
    accent: "#FFCC00",
  },
  {
    id: "cv",
    tag: "MODE 03",
    icon: Camera,
    title: "CV Webcam Monitoring",
    desc: "OpenCV-powered FastAPI microservice detects face absence, multiple faces, and prolonged gaze diversion in real time.",
    accent: "#FF3B30",
  },
];

export const ProctoringModes = () => {
  return (
    <section id="modes" data-testid="proctoring-modes" className="relative py-32 md:py-48 border-b border-[#1A1A1A]">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="font-mono text-sm text-[#00FF66]">[ 03 ]</span>
            <h2 className="font-display font-extrabold uppercase text-5xl md:text-7xl tracking-tighter leading-[0.9] mt-4">
              Configurable <br /> Proctoring
            </h2>
          </div>
          <p className="max-w-sm font-mono text-sm text-[#8A8A8A] leading-relaxed">
            Any user can spin up a timed contest and dial the surveillance to fit the stakes. Three modes, one transparent record.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#1A1A1A]">
          {MODES.map((m, i) => (
            <motion.div
              key={m.id}
              data-testid={`mode-card-${m.id}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="group relative border-b border-r border-[#1A1A1A] p-8 md:p-10 overflow-hidden hover:bg-[#0A0A0A] transition-colors duration-300"
            >
              <div
                className="absolute top-0 left-0 h-[3px] w-0 group-hover:w-full transition-[width] duration-500 ease-out"
                style={{ background: m.accent }}
              />
              <div className="flex items-center justify-between mb-16">
                <span className="font-mono text-[10px] text-[#8A8A8A] tracking-widest">{m.tag}</span>
                <m.icon className="w-6 h-6" strokeWidth={1.5} style={{ color: m.accent }} />
              </div>
              <h3 className="font-display font-bold text-3xl tracking-tight leading-tight">{m.title}</h3>
              <p className="font-mono text-xs text-[#8A8A8A] leading-relaxed mt-4">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
