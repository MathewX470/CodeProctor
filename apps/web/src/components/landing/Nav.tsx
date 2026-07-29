"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { ArrowRight } from "lucide-react";

export function Nav() {
  const links = [
    { name: "Features", href: "#features" },
    { name: "Sandbox Engine", href: "#sandbox" },
    { name: "AI Proctoring", href: "#proctoring" },
    { name: "Security Tiers", href: "#modes" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center group">
          <Logo size={26} className="group-hover:opacity-80 transition-opacity" />
        </Link>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
          {links.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="hover:text-zinc-100 transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-lg text-sm transition-all duration-200 flex items-center gap-1.5 shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
