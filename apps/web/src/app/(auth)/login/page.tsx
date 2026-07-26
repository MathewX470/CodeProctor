"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Terminal, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn.email({
        email,
        password,
        callbackURL: "/",
      });
      if (error) {
        toast.error(`[ AUTH EXCEPTION: ${error.message || "ACCESS DENIED"} ]`, {
          description: "Please verify your credentials and security passphrase.",
        });
      } else {
        toast.success("[ SUCCESS: SESSION INITIALIZED ]", {
          description: "Identity confirmed. Accessing secure assessment arena...",
        });
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to reach authentication endpoint.";
      toast.error("[ SYSTEM FAULT: CONNECTION REFUSED ]", {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-6 relative overflow-hidden cp-grain w-full">
      {/* Background cyber grid & ambient lighting */}
      <div className="absolute inset-0 cp-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] hero-glow opacity-50 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 my-8"
      >
        {/* Brand Nav Header */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link href="/" className="flex items-center group">
            <Logo size={26} className="group-hover:opacity-90 transition-opacity" />
          </Link>
          <span className="font-mono text-[10px] text-[#8A8A8A] tracking-widest uppercase">[ AUTH PORTAL ]</span>
        </div>

        {/* Cyber-Terminal Card Box */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 md:p-10 relative shadow-2xl overflow-hidden group">
          {/* Neon green top status border */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#00FF66]" />
          
          <div className="flex items-center gap-2 mb-3 text-[#00FF66] font-mono text-[10px] tracking-widest uppercase">
            <Terminal className="w-3.5 h-3.5" />
            <span>SESSION // INIT</span>
          </div>

          <h1 className="font-display font-extrabold uppercase text-4xl tracking-tight leading-none mb-3">
            SYSTEM <span className="text-stroke">LOGIN</span>
          </h1>
          <p className="font-mono text-xs text-[#8A8A8A] mb-8 leading-relaxed">
            Authenticate identity to enter isolated execution arenas and inspect candidate telemetry.
          </p>

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="space-y-2 group/input">
              <label
                className="block text-[11px] font-mono uppercase text-[#8A8A8A] tracking-widest"
                htmlFor="email"
              >
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#606060] group-focus-within/input:text-[#00FF66] transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="solver@domain.dev"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#030303] border border-[#1A1A1A] focus:border-[#00FF66] text-white font-mono text-xs transition-colors outline-none placeholder:text-[#505050] rounded-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group/input">
              <div className="flex justify-between items-center">
                <label
                  className="block text-[11px] font-mono uppercase text-[#8A8A8A] tracking-widest"
                  htmlFor="password"
                >
                  PASSWORD
                </label>
                <a
                  href="#"
                  className="text-[10px] font-mono text-[#00FF66] hover:underline tracking-widest"
                >
                  [ FORGOT ? ]
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#606060] group-focus-within/input:text-[#00FF66] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••••••"
                  className="w-full pl-11 pr-11 py-3.5 bg-[#030303] border border-[#1A1A1A] focus:border-[#00FF66] text-white font-mono text-xs transition-colors outline-none placeholder:text-[#505050] rounded-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#606060] hover:text-[#00FF66] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Brutalist Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cp-cta w-full font-mono text-xs font-bold bg-white text-black py-4 px-6 tracking-widest hover:shadow-[5px_5px_0_0_#00FF66] mt-4 uppercase flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>AUTHENTICATING... [ ■■■□□ ]</span>
                </>
              ) : (
                <>
                  <span>AUTHENTICATE SESSION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8 mb-6 flex items-center justify-between">
            <span className="border-b border-[#1A1A1A] flex-1"></span>
            <span className="font-mono text-[10px] text-[#606060] uppercase tracking-widest px-4">
              OAUTH // VERIFIED
            </span>
            <span className="border-b border-[#1A1A1A] flex-1"></span>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-[#030303] border border-[#1A1A1A] hover:border-[#8A8A8A] font-mono text-[11px] text-[#8A8A8A] hover:text-white transition-all group cursor-pointer tracking-wider rounded-none"
            >
              <svg className="w-4 h-4 mr-2 fill-current text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GITHUB</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-3 px-4 bg-[#030303] border border-[#1A1A1A] hover:border-[#8A8A8A] font-mono text-[11px] text-[#8A8A8A] hover:text-white transition-all group cursor-pointer tracking-wider rounded-none"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>GOOGLE</span>
            </button>
          </div>

          {/* Switch to Signup */}
          <div className="text-center mt-8 pt-6 border-t border-[#1A1A1A]">
            <p className="font-mono text-xs text-[#8A8A8A]">
              No credentials established?{" "}
              <Link
                href="/signup"
                className="text-white font-bold hover:text-[#00FF66] transition-colors tracking-wider"
              >
                [ REGISTER IDENTITY ]
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center flex items-center justify-center gap-6 font-mono text-[10px] text-[#606060] tracking-widest uppercase">
          <span>SHA-256 SECURED</span>
          <span>•</span>
          <span>ZERO-TRUST ENVIRONMENT</span>
        </div>
      </motion.div>
    </div>
  );
}
