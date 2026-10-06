import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { User, Mail, Calendar, Target, Globe, Code2, Trophy, CheckCircle2, XCircle, Clock, History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const [dbUser, userRank, recentSubmissions, totalProblems] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.userRank.findUnique({ where: { userId: session.user.id } }),
    prisma.submission.findMany({
      where: { userId: session.user.id },
      orderBy: { submittedAt: "desc" },
      take: 10,
      include: { problem: true, language: true }
    }),
    prisma.problem.count()
  ]);

  if (!dbUser) redirect("/sign-in");

  const joinDate = new Date(dbUser.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  const rating = userRank?.rating || 1200;
  const globalRank = userRank?.globalRank ? `#${userRank.globalRank}` : "Unranked";
  const problemsSolved = userRank?.problemsSolved || 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <User className="w-8 h-8 text-blue-500" />
          My Profile
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">
          Manage your account and view your competitive programming statistics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none p-6 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              {dbUser.image ? (
                <Image
                  src={dbUser.image}
                  alt={dbUser.name || "User"}
                  fill
                  className="rounded-full object-cover border-4 border-slate-50 dark:border-zinc-800"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl shadow-sm border-4 border-slate-50 dark:border-zinc-800">
                  {dbUser.name?.charAt(0).toUpperCase() || dbUser.email.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {dbUser.name || "Developer"}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500 dark:text-zinc-400">
              <Mail className="w-4 h-4" />
              {dbUser.email}
            </div>
            <div className="flex items-center justify-center gap-2 mt-1 text-sm text-slate-500 dark:text-zinc-400">
              <Calendar className="w-4 h-4" />
              Joined {joinDate}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-3 divide-x divide-slate-100 dark:divide-zinc-800/80">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{rating}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mt-1">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{problemsSolved}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mt-1">Solved</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{globalRank}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-400 mt-1.5">Global</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats and Recent Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Completion Rate</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {totalProblems > 0 ? Math.round((problemsSolved / totalProblems) * 100) : 0}%
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-1">Total Submissions</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {recentSubmissions.length > 0 ? "10+" : "0"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" />
                Recent Submissions
              </h3>
              <Link href="/submissions" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                View All
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {recentSubmissions.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500 dark:text-zinc-400 text-sm">
                  You haven't made any submissions yet. Start practicing!
                </div>
              ) : (
                recentSubmissions.slice(0, 5).map((sub) => {
                  const isAccepted = sub.verdict === "ACCEPTED";
                  const isPending = sub.status === "QUEUED" || sub.status === "RUNNING";
                  
                  return (
                    <div key={sub.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors">
                      <div>
                        <Link href={`/problems/${sub.problem.slug}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
                          {sub.problem.title}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-zinc-400">
                          <span>{sub.language?.name || "Unknown"}</span>
                          <span>•</span>
                          <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isAccepted 
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                          : isPending
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                      }`}>
                        {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : (isPending ? <Clock className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />)}
                        {sub.verdict ? sub.verdict.replace(/_/g, " ") : sub.status}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
