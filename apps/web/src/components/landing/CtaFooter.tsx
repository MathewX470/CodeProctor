"use client";

import React from "react";
import { motion } from "framer-motion";

export const CtaFooter = () => {
  return (
    <footer id="cta" data-testid="cta-footer" className="relative pt-24 md:pt-36 border-t border-[#1A1A1A] overflow-hidden w-full max-w-full">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        {/* meta */}
        <div className="flex flex-col md:flex-row justify-between gap-4 pb-16 font-mono text-[10px] text-[#8A8A8A] tracking-widest">
          <span>© {new Date().getFullYear()} CODEPROCTOR — SECURE CODING ASSESSMENT</span>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition-colors">PRACTICE</span>
            <span className="hover:text-white cursor-pointer transition-colors">CONTESTS</span>
            <span className="hover:text-white cursor-pointer transition-colors">PROCTORING</span>
          </div>
        </div>
      </div>

      {/* Reduced brutalist wordmark size to provide clean breathing room aroundbrand name */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-full overflow-hidden px-4 md:px-12 pb-4 select-none pointer-events-none flex justify-center"
      >
        <h2 className="font-display font-extrabold uppercase text-center leading-none tracking-tight text-[8.5vw] md:text-[9vw] whitespace-nowrap -mb-2 text-white">
          CODE<span className="text-stroke">PROCTOR</span>
        </h2>
      </motion.div>
    </footer>
  );
};
