"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, useSession } from "@/lib/auth-client";
import { Logo } from "@/components/landing/Logo";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

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
        callbackURL: "/dashboard",
      });
      if (error) {
        toast.error("Sign in failed", {
          description: error.message || "Please check your email and password and try again.",
        });
      } else {
        toast.success("Welcome back!", {
          description: "Redirecting to your dashboard...",
        });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to contact authentication server.";
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-white/[0.02] blur-[120px] pointer-events-none rounded-full" />

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

        {/* Minimalist Auth Card */}
        <div className="bg-white/[0.03] border border-white/[0.06] p-8 sm:p-10 rounded-2xl relative shadow-2xl backdrop-blur-md">
          
          <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
            Sign in to access your proctored assessments and Docker evaluation sandbox.
          </p>

          <form className="space-y-5" onSubmit={handleLogin}>
            
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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-white/[0.08] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-zinc-100 text-sm transition-all outline-none placeholder:text-zinc-600 rounded-xl disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label
                  className="block text-xs font-medium text-zinc-300"
                  htmlFor="password"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold text-sm bg-white hover:bg-zinc-200 text-zinc-950 py-3.5 px-6 rounded-xl shadow-lg shadow-white/5 mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center justify-between">
            <span className="border-b border-white/[0.06] flex-1" />
            <span className="text-xs text-zinc-500 font-medium px-4">
              Or continue with
            </span>
            <span className="border-b border-white/[0.06] flex-1" />
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all rounded-xl gap-2 shadow-inner"
            >
              <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all rounded-xl gap-2 shadow-inner"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Google</span>
            </button>
          </div>

          {/* Switch to Signup */}
          <div className="text-center mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-xs text-zinc-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-zinc-100 font-semibold hover:text-white transition-colors ml-1"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
