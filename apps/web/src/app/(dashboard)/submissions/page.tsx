import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const submissions = await prisma.submission.findMany({
    where: { userId: session.user.id },
    orderBy: { submittedAt: "desc" },
    include: { problem: true, language: true, contest: true },
    take: 50,
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Submissions</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">
            View your recent code executions and problem solving history.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                <th className="px-6 py-4">Time Submitted</th>
                <th className="px-6 py-4">Problem</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">Runtime</th>
                <th className="px-6 py-4">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                    No submissions found. Start practicing to see your history!
                  </td>
                </tr>
              )}
              {submissions.map((sub) => {
                const isAccepted = sub.verdict === "ACCEPTED";
                const isPending = sub.status === "QUEUED" || sub.status === "RUNNING";
                
                let statusText = sub.verdict ? sub.verdict.replace(/_/g, " ") : sub.status;
                if (statusText === "ACCEPTED") statusText = "Accepted";
                else if (statusText === "WRONG ANSWER") statusText = "Wrong Answer";
                else if (statusText === "RUNTIME ERROR") statusText = "Runtime Error";
                else if (statusText === "TIME LIMIT EXCEEDED") statusText = "Time Limit Exceeded";
                else if (statusText === "COMPILATION ERROR") statusText = "Compilation Error";
                
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-300">
                      {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/problems/${sub.problem.slug}`}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {sub.problem.title}
                      </Link>
                      {sub.contestId && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                          Contest
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isAccepted 
                          ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                          : isPending
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                      }`}>
                        {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : (isPending ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : <XCircle className="w-3.5 h-3.5" />)}
                        {statusText}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-zinc-300">
                      {sub.language?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-zinc-300">
                      {sub.executionTime ? `${sub.executionTime} ms` : "--"}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-zinc-300">
                      {sub.memoryUsed ? `${sub.memoryUsed} KB` : "--"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
