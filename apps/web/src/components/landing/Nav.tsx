"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { useSession, signOut } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const { data: session, isPending } = useSession();

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

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("[ SUCCESS: SESSION TERMINATED ]", {
            description: "You have securely disconnected from CodeProctor.",
          });
        },
      },
    });
  };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      data-testid="main-nav"
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "backdrop-blur-xl bg-[#030303]/80 border-b border-[#1A1A1A]" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <a href="#top" data-testid="nav-brand" className="flex items-center group">
          <Logo size={28} className="group-hover:opacity-90 transition-opacity" />
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
          {!isPending && session?.user ? (
            <>
              <span className="font-mono text-xs text-[#00FF66] border border-[#1A1A1A] bg-[#0A0A0A] px-3 py-2 hidden sm:inline-block tracking-wider">
                ● {session.user.name?.toUpperCase() || "AUTHENTICATED"}
              </span>
              <button
                onClick={handleLogout}
                className="cp-cta font-mono text-xs font-bold bg-[#1A1A1A] text-white border border-[#333] px-4 py-2.5 tracking-widest hover:border-[#00FF66] hover:text-[#00FF66] cursor-pointer transition-all uppercase"
              >
                [ LOGOUT ]
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block font-mono text-xs text-[#8A8A8A] hover:text-white tracking-widest px-3 py-2 transition-colors"
              >
                [SIGN IN]
              </Link>
              <Link
                href="/signup"
                data-testid="nav-start-contest-btn"
                className="cp-cta font-mono text-xs font-bold bg-white text-black px-5 py-2.5 tracking-widest hover:shadow-[4px_4px_0_0_#00FF66] inline-block"
              >
                GET STARTED
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}

export { Nav };
