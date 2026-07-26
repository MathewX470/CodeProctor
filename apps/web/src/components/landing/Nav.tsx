"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export const Nav = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "SANDBOX", href: "#chapter-01" },
    { label: "PROCTOR", href: "#chapter-02" },
    { label: "MODES", href: "#modes" },
  ];

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      data-testid="main-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "backdrop-blur-xl bg-[#030303]/70 border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a href="#top" data-testid="nav-brand" className="font-mono text-sm font-extrabold tracking-tight flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#00FF66] animate-pulse" />
          CodeProctor<span className="text-[#00FF66]">_</span>
        </a>

        <div className="hidden md:flex items-center gap-8 font-mono text-xs text-[#8A8A8A]">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className="hover:text-white transition-colors duration-200 tracking-widest"
            >
              [{l.label}]
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:inline-block font-mono text-xs text-[#8A8A8A] hover:text-white tracking-widest px-3 py-2 transition-colors"
          >
            [SIGN IN]
          </Link>
          <a
            href="#cta"
            data-testid="nav-start-contest-btn"
            className="cp-cta font-mono text-xs font-bold bg-white text-black px-5 py-2.5 tracking-widest hover:shadow-[4px_4px_0_0_#00FF66]"
          >
            GET STARTED
          </a>
        </div>
      </div>
    </motion.nav>
  );
};
