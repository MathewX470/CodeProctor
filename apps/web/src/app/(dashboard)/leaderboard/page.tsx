import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {  Medal, Target, Code2 } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session || !session.user) {
    redirect("/sign-in");
  }

  const currentUser = session.user;

  // Fetch all users with a rank, order by rating desc
  const leaderboard = await prisma.userRank.findMany({
    orderBy: [
      { rating: "desc" },
      { problemsSolved: "desc" },
      { updatedAt: "asc" }
    ],
    include: { user: true },
    take: 100
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            Global Leaderboard
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1">
            See how you stack up against the best developers on the platform.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800/80 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                <th className="px-6 py-4 w-24 text-center">Rank</th>
                <th className="px-6 py-4">Developer</th>
                <th className="px-6 py-4 text-center">Rating</th>
                <th className="px-6 py-4 text-center">Problems Solved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                    No users have been ranked yet!
                  </td>
                </tr>
              )}
              {leaderboard.map((rank, idx) => {
                const currentRank = idx + 1;
                const isCurrentUser = rank.userId === currentUser.id;
                
                let RankIcon = null;
                if (currentRank === 1) RankIcon = <Medal className="w-6 h-6 text-yellow-500 mx-auto drop-shadow-sm" />;
                else if (currentRank === 2) RankIcon = <Medal className="w-6 h-6 text-slate-400 mx-auto drop-shadow-sm" />;
                else if (currentRank === 3) RankIcon = <Medal className="w-6 h-6 text-amber-600 mx-auto drop-shadow-sm" />;
                
                return (
                  <tr key={rank.id} className={`transition-colors ${
                    isCurrentUser 
                      ? "bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/20" 
                      : "hover:bg-slate-50/50 dark:hover:bg-zinc-800/20"
                  }`}>
                    <td className="px-6 py-4 text-center">
                      {RankIcon ? RankIcon : (
                        <span className="text-lg font-bold text-slate-500 dark:text-zinc-500">
                          {currentRank}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {rank.user.image ? (
                          <Image
                            src={rank.user.image}
                            alt={rank.user.name}
                            width={32}
                            height={32}
                            className="rounded-full bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {rank.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            {rank.user.name}
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-zinc-400">
                            Joined {new Date(rank.user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 font-bold">
                        <Target className="w-4 h-4" />
                        {rank.rating}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 font-medium">
                        <Code2 className="w-4 h-4" />
                        {rank.problemsSolved}
                      </div>
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
