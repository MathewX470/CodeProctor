"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Lenis from "lenis";
import { Toaster } from "sonner";
import { useSession } from "@/lib/auth-client";
import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { ChapterSandbox } from "@/components/landing/ChapterSandbox";
import { ChapterProctor } from "@/components/landing/ChapterProctor";
import { ProctoringModes } from "@/components/landing/ProctoringModes";
import { CtaFooter } from "@/components/landing/CtaFooter";

export default function App() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("isLoggingOut");
    }
    
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session?.user) return;

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
  }, [session, isPending]);

  if (!isPending && session?.user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center font-sans text-sm text-zinc-400 font-medium">
        Redirecting to dashboard...
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-50 min-h-screen font-sans selection:bg-zinc-800 selection:text-zinc-100 overflow-x-hidden relative">
      
      {/* Animated floating gradient orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="orb-1 absolute -top-40 -left-32 w-[600px] h-[600px] rounded-full bg-zinc-700/30 blur-[140px]" />
        <div className="orb-2 absolute top-1/3 -right-48 w-[500px] h-[500px] rounded-full bg-zinc-800/25 blur-[140px]" />
        <div className="orb-3 absolute -bottom-32 left-1/4 w-[450px] h-[450px] rounded-full bg-zinc-700/15 blur-[140px]" />
      </div>

      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#fafafa",
            borderRadius: "0.75rem",
          },
        }}
      />
      <div className="relative z-10">
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
    </div>
  );
}
