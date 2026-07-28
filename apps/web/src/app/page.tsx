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
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (!isPending && session?.user) return; // Don't initialize Lenis if redirecting

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
    };
  }, [session, isPending]);

  if (!isPending && session?.user) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center font-sans text-sm text-emerald-400 font-medium">
        Redirecting to dashboard...
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-zinc-100 min-h-screen font-sans selection:bg-emerald-500/20 selection:text-emerald-400 overflow-x-hidden">
      <Toaster
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid #27272a",
            color: "#fff",
            borderRadius: "0.75rem",
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
