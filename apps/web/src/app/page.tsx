"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { ChapterSandbox } from "@/components/landing/ChapterSandbox";
import { ChapterProctor } from "@/components/landing/ChapterProctor";
import { ProctoringModes } from "@/components/landing/ProctoringModes";
import { CtaFooter } from "@/components/landing/CtaFooter";

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let raf: number;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // anchor smooth scroll
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (id && id.length > 1) {
        const el = document.querySelector(id) as HTMLElement | null;
        if (el) {
          e.preventDefault();
          lenis.scrollTo(el, { offset: -60 });
        }
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="cp-grain relative bg-[#030303] text-white min-h-screen font-body-base">
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#0A0A0A",
            border: "1px solid #1A1A1A",
            color: "#fff",
            borderRadius: 0,
            fontFamily: "'JetBrains Mono', monospace",
          },
        }}
      />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <ChapterSandbox />
        <ChapterProctor />
        <ProctoringModes />
        <CtaFooter />
      </main>
    </div>
  );
}
