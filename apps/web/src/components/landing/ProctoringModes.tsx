"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, Eye, Lock, Check } from "lucide-react";
import { SpotlightCard } from "@/components/landing/SpotlightCard";

export function ProctoringModes() {
  const modes = [
    {
      title: "Standard Mode",
      badge: "Practice & Homework",
      description: "Lightweight monitoring designed for daily training sessions and unmonitored assignments.",
      features: [
        "Docker isolated runtime execution",
        "Basic window focus warning alerts",
        "Unlimited practice submissions",
        "Standard test case breakdown",
      ],
      icon: Shield,
      isHighlighted: false,
    },
    {
      title: "Full-Screen Lock",
      badge: "University Exams",
      description: "Enforces full-screen examination isolation and disables unauthorized OS interactions.",
      features: [
        "Strict browser full-screen enforcement",
        "Tab-switching violation logging",
        "Disabled clipboard bulk copy/paste",
        "Real-time evaluation latency (<20ms)",
      ],
      icon: Lock,
      isHighlighted: false,
    },
    {
      title: "AI Vision Proctored",
      badge: "High-Stakes Competitions",
      description: "Complete zero-trust monitoring with real-time ocular gaze analysis and facial biometric presence verification.",
      features: [
        "Real-time webcam eye-gaze tracking",
        "Facial absence & multiple-person alerts",
        "Cryptographic audit log timeline",
        "Automated candidate fairness scoring",
      ],
      icon: Eye,
      isHighlighted: true,
    },
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto border-t border-white/[0.06]" id="modes">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-3xl mx-auto mb-16 space-y-4"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-50 font-display">
          Configurable Security Tiers for Any Assessment.
        </h2>
        <p className="text-base text-zinc-400">
          From casual classroom algorithms to high-stakes recruitment championships, dial in the exact level of proctoring enforcement you require.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <SpotlightCard
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 border h-full ${
                  mode.isHighlighted
                    ? "bg-white/[0.04] border-white/[0.15] shadow-2xl"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                      mode.isHighlighted
                        ? "bg-white/[0.08] text-zinc-200 border border-white/[0.12] font-semibold"
                        : "bg-white/[0.04] text-zinc-400 border border-white/[0.06]"
                    }`}>
                      {mode.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-zinc-100">{mode.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed min-h-[40px]">
                    {mode.description}
                  </p>

                  <div className="my-6 border-t border-white/[0.06]" />

                  <ul className="space-y-3.5 text-sm text-zinc-300">
                    {mode.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <a
                    href="/signup"
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center ${
                      mode.isHighlighted
                        ? "bg-white hover:bg-zinc-200 text-zinc-950 shadow-md"
                        : "bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] hover:border-white/[0.12]"
                    }`}
                  >
                    Select Mode
                  </a>
                </div>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
