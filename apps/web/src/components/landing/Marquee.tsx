"use client";

import React from "react";

const WORDS = [
  "TRANSPARENT PROCTORING",
  "EXPLAINABLE MALPRACTICE",
  "SANDBOXED EXECUTION",
  "EVIDENCE-BASED DECISIONS",
];

export const Marquee = () => {
  const row = [...WORDS, ...WORDS];
  return (
    <section data-testid="marquee-section" className="relative py-16 border-y border-[#1A1A1A] overflow-hidden">
      <div className="marquee-track">
        {row.map((w, i) => (
          <span
            key={i}
            className="font-display font-extrabold uppercase text-6xl md:text-8xl text-stroke px-8 flex items-center shrink-0"
          >
            {w}
            <span className="text-[#00FF66] px-8 not-italic" style={{ WebkitTextStroke: "0" }}>
              ✳
            </span>
          </span>
        ))}
      </div>
    </section>
  );
};
