"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useRef } from "react";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";

const MESH =
  "https://images.unsplash.com/photo-1718844054447-42759fd577e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMGRhcmslMjBkYXRhJTIwbWF0cml4JTIwbWVzaHxlbnwwfHx8fDE3ODUwODU1MDl8MA&ixlib=rb-4.1.0&q=85";

const line: Variants = {
  hidden: { y: "110%" },
  show: (i: number) => ({
    y: "0%",
    transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const, delay: 0.4 + i * 0.12 },
  }),
};


const LineMask = ({
  children,
  i,
  className = "",
}: {
  children: React.ReactNode;
  i: number;
  className?: string;
}) => (
  <span className="block overflow-hidden">
    <motion.span variants={line} custom={i} initial="hidden" animate="show" className={`block ${className}`}>
      {children}
    </motion.span>
  </span>
);

export const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const meshY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleMouse = (e: React.MouseEvent<HTMLElement>) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 2;
    const y = (e.clientY / innerHeight - 0.5) * 2;
    mouse.current = { x, y };
    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`;
    }
  };

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={handleMouse}
      data-testid="hero-section"
      className="relative min-h-screen w-full overflow-hidden cp-grid-bg flex items-center"
    >
      {/* parallax mesh */}
      <motion.div
        style={{ y: meshY }}
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
      >
        <img src={MESH} alt="" className="w-full h-full object-cover mix-blend-lighten" />
      </motion.div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#030303]/40 to-[#030303] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-10 w-full pt-28 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: kinetic headline */}
        <motion.div style={{ y: textY, opacity: fade }} className="lg:col-span-7">

          <h1 className="font-display font-extrabold uppercase text-[13vw] leading-[0.86] lg:text-[7.5vw] tracking-tighter">
            <LineMask i={0}>The Sandbox</LineMask>
            <LineMask i={1}>
              That <span className="text-[#00FF66]">Watches</span>
            </LineMask>
            <LineMask i={2} className="text-stroke">Back.</LineMask>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-8 max-w-md font-mono text-sm text-[#8A8A8A] leading-relaxed"
          >
            Automated code evaluation meets explainable, evidence-based proctoring. No black-box cheating flags — a transparent, timestamped record of every event.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <a
              href="#cta"
              data-testid="hero-primary-cta"
              className="cp-cta font-mono text-xs font-bold bg-white text-black px-7 py-4 tracking-widest hover:shadow-[5px_5px_0_0_#00FF66]"
            >
              LAUNCH A CONTEST →
            </a>
            <a
              href="#chapter-02"
              data-testid="hero-secondary-cta"
              className="cp-cta font-mono text-xs font-bold border border-white/20 text-white px-7 py-4 tracking-widest hover:border-[#00FF66] hover:text-[#00FF66]"
            >
              SEE THE PROCTOR
            </a>
          </motion.div>
        </motion.div>

        {/* Right: tilting editor mock */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <div ref={cardRef} className="transition-transform duration-300 ease-out will-change-transform">
            <div className="bg-[#0A0A0A] border border-[#1A1A1A]">
              <div className="flex items-center justify-between border-b border-[#1A1A1A] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 bg-[#FF3B30]" />
                  <span className="w-3 h-3 bg-[#FFCC00]" />
                  <span className="w-3 h-3 bg-[#00FF66]" />
                </div>
                <span className="font-mono text-[10px] text-[#8A8A8A]">solution.py — sandboxed</span>
              </div>
              <div className="p-5 font-mono text-[11px] md:text-xs leading-6">
                <div><span className="text-[#8A8A8A]">01</span>  <span className="text-[#FF3B30]">def</span> <span className="text-[#00FF66]">two_sum</span>(nums, target):</div>
                <div><span className="text-[#8A8A8A]">02</span>    seen = {"{}"}</div>
                <div><span className="text-[#8A8A8A]">03</span>    <span className="text-[#FF3B30]">for</span> i, n <span className="text-[#FF3B30]">in</span> enumerate(nums):</div>
                <div><span className="text-[#8A8A8A]">04</span>      <span className="text-[#FF3B30]">if</span> target - n <span className="text-[#FF3B30]">in</span> seen:</div>
                <div><span className="text-[#8A8A8A]">05</span>        <span className="text-[#FF3B30]">return</span> [seen[target-n], i]</div>
                <div><span className="text-[#8A8A8A]">06</span>      seen[n] = i</div>
                <div className="mt-4 border-t border-[#1A1A1A] pt-3 text-[#8A8A8A]">
                  <span className="text-[#00FF66]">✓ accepted</span> · 42ms · docker:isolated · mem 12MB
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 font-mono text-[10px] tracking-[0.3em] text-[#8A8A8A] flex flex-col items-center gap-2">
        <span>SCROLL</span>
        <span className="w-px h-8 bg-gradient-to-b from-[#00FF66] to-transparent" />
      </div>
    </section>
  );
};
