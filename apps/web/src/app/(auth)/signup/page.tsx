"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { User, Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import { signUp, useSession } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

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
      toast.error("Password mismatch", {
        description: "Your password confirmation does not match your initial password.",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/dashboard",
      });
      if (error) {
        toast.error("Registration failed", {
          description: error.message || "Could not complete registration. Please try again.",
        });
      } else {
        toast.success("Account created successfully!", {
          description: "Welcome to CodeProctor. Initializing your developer workspace...",
        });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to contact authentication server.";
      toast.error("Connection error", {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start sm:justify-center py-12 px-4 sm:px-6 relative font-sans selection:bg-zinc-800 selection:text-zinc-100 w-full overflow-y-auto">
      
      {/* Subtle Neutral Backdrop Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-white/[0.02] blur-[130px] pointer-events-none rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 my-8"
      >
        {/* Brand Nav Header */}
        <div className="flex items-center justify-between mb-8 px-1">
          <Link href="/" className="flex items-center group">
            <Logo size={26} className="group-hover:opacity-90 transition-opacity" />
          </Link>
        </div>

        {/* Minimalist Signup Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] p-8 sm:p-10 rounded-2xl relative shadow-2xl backdrop-blur-md">
          
          <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-tight mb-2">
            Create account
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            Register your profile to compete in proctored assessments.
          </p>

          <form className="space-y-5" onSubmit={handleSignUp}>
            
            {/* Full Name Field */}
            <div className="space-y-2">
              <label
                className="block text-xs font-medium text-zinc-300"
                htmlFor="full-name"
              >
                Full name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
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
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-white/[0.08] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 text-sm transition-all outline-none placeholder:text-zinc-600 rounded-xl disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label
                className="block text-xs font-medium text-zinc-300"
                htmlFor="email"
              >
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-white/[0.08] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 text-sm transition-all outline-none placeholder:text-zinc-600 rounded-xl disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                className="block text-xs font-medium text-zinc-300"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
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
                  className="w-full pl-11 pr-11 py-3 bg-zinc-950/50 border border-white/[0.08] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 text-sm transition-all outline-none placeholder:text-zinc-600 rounded-xl disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Minimum 8 characters with encryption</span>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label
                className="block text-xs font-medium text-zinc-300"
                htmlFor="confirm-password"
              >
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
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
                  className="w-full pl-11 pr-11 py-3 bg-zinc-950/50 border border-white/[0.08] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 text-sm transition-all outline-none placeholder:text-zinc-600 rounded-xl disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold text-sm bg-white hover:bg-zinc-200 text-zinc-950 py-3.5 px-6 rounded-xl shadow-lg shadow-white/5 mt-4 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="text-center mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-zinc-100 font-semibold hover:text-white transition-colors ml-1"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
