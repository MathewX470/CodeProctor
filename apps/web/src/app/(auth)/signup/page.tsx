"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Mail, Lock, ArrowRight, Terminal, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("[ SECURITY ALERT: PASSPHRASE MISMATCH ]", {
        description: "Your passphrase confirmation does not equal your initial passphrase.",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/",
      });
      if (error) {
        toast.error(`[ AUTH EXCEPTION: ${error.message || "REGISTER FAILED"} ]`, {
          description: "Could not initialize identity in Neon PostgreSQL.",
        });
      } else {
        toast.success("[ SUCCESS: IDENTITY ESTABLISHED ]", {
          description: "Welcome to CodeProctor. Your telemetry profile is now active.",
        });
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to contact authentication server.";
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
          <Link href="/" className="font-mono text-sm font-extrabold tracking-tight flex items-center gap-2 group">
            <span className="inline-block w-2 h-2 bg-[#00FF66] animate-pulse" />
            CodeProctor<span className="text-[#00FF66] group-hover:translate-x-0.5 transition-transform">_</span>
          </Link>
          <span className="font-mono text-[10px] text-[#8A8A8A] tracking-widest uppercase">[ REGISTRATION ]</span>
        </div>

        {/* Cyber-Terminal Card Box */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 md:p-10 relative shadow-2xl overflow-hidden group">
          {/* Neon green top status border */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#00FF66]" />

          <div className="flex items-center gap-2 mb-3 text-[#00FF66] font-mono text-[10px] tracking-widest uppercase">
            <Terminal className="w-3.5 h-3.5" />
            <span>IDENTITY // GENERATE</span>
          </div>

          <h1 className="font-display font-extrabold uppercase text-4xl tracking-tight leading-none mb-3">
            CREATE <span className="text-stroke">ACCOUNT</span>
          </h1>
          <p className="font-mono text-xs text-[#8A8A8A] mb-8 leading-relaxed">
            Register your developer profile to compete in timed arenas, deploy practice code, or orchestrate fair proctored assessments.
          </p>

          <form className="space-y-5" onSubmit={handleSignUp}>
            {/* Full Name Field */}
            <div className="space-y-2 group/input">
              <label
                className="block text-[11px] font-mono uppercase text-[#8A8A8A] tracking-widest"
                htmlFor="full-name"
              >
                CANDIDATE NAME
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#606060] group-focus-within/input:text-[#00FF66] transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="full-name"
                  name="full-name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#030303] border border-[#1A1A1A] focus:border-[#00FF66] text-white font-mono text-xs transition-colors outline-none placeholder:text-[#505050] rounded-none disabled:opacity-50"
                />
              </div>
            </div>

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
                  placeholder="solver@domain.dev"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3.5 bg-[#030303] border border-[#1A1A1A] focus:border-[#00FF66] text-white font-mono text-xs transition-colors outline-none placeholder:text-[#505050] rounded-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group/input">
              <label
                className="block text-[11px] font-mono uppercase text-[#8A8A8A] tracking-widest"
                htmlFor="password"
              >
                SECURITY PASSPHRASE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#606060] group-focus-within/input:text-[#00FF66] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-11 py-3.5 bg-[#030303] border border-[#1A1A1A] focus:border-[#00FF66] text-white font-mono text-xs transition-colors outline-none placeholder:text-[#505050] rounded-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#606060] hover:text-[#00FF66] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#606060] pt-1">
                <ShieldCheck className="w-3 h-3 text-[#00FF66]" />
                <span>Minimum 8 characters · SHA-256 hashed</span>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2 group/input">
              <label
                className="block text-[11px] font-mono uppercase text-[#8A8A8A] tracking-widest"
                htmlFor="confirm-password"
              >
                CONFIRM PASSPHRASE
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#606060] group-focus-within/input:text-[#00FF66] transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-11 py-3.5 bg-[#030303] border border-[#1A1A1A] focus:border-[#00FF66] text-white font-mono text-xs transition-colors outline-none placeholder:text-[#505050] rounded-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide confirmation passphrase" : "Show confirmation passphrase"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#606060] hover:text-[#00FF66] transition-colors cursor-pointer"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Brutalist Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cp-cta w-full font-mono text-xs font-bold bg-white text-black py-4 px-6 tracking-widest hover:shadow-[5px_5px_0_0_#00FF66] mt-6 uppercase flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>INITIALIZING... [ ■■■□□ ]</span>
                </>
              ) : (
                <>
                  <span>INITIALIZE PROFILE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="text-center mt-8 pt-6 border-t border-[#1A1A1A]">
            <p className="font-mono text-xs text-[#8A8A8A]">
              Existing identity verified?{" "}
              <Link
                href="/login"
                className="text-white font-bold hover:text-[#00FF66] transition-colors tracking-wider"
              >
                [ SIGN IN ]
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center flex items-center justify-center gap-6 font-mono text-[10px] text-[#606060] tracking-widest uppercase">
          <span>DOCKER ISOLATED</span>
          <span>•</span>
          <span>EXPLAINABLE PROCTORING</span>
        </div>
      </motion.div>
    </div>
  );
}
