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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && session?.user && !loading) {
      import("@/app/actions/auth").then(({ getUserRoleServer }) => {
        getUserRoleServer().then((role) => {
          if (role === "ADMIN") {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
        });
      });
    }
  }, [session, isPending, router, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn.email({
        email,
        password,
      });
      if (error) {
        toast.error("Sign in failed", {
          description: error.message || "Please check your email and password and try again.",
        });
      } else {
        toast.success("Welcome back!", {
          description: "Authenticating profile...",
        });
        
        // Dynamically import to avoid client-side error if there's an issue with top-level await imports
        const { getUserRoleServer } = await import("@/app/actions/auth");
        const role = await getUserRoleServer();
        
        if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
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
