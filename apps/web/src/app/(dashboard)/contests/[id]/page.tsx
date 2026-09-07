import React from "react";
import { getArenaDataServer, getContestResultsServer } from "@/app/actions/contests";
import { redirect } from "next/navigation";
import { Clock, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ArenaStartButton } from "@/components/contests/ArenaStartButton";
import { ArenaEndButton } from "@/components/contests/ArenaEndButton";

export default async function ContestArenaDashboard(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let data;
  try {
    data = await getArenaDataServer(params.id);
  } catch (e: any) {
    if (e.message.includes("Unauthorized") || e.message.includes("Not a member")) {
      redirect("/contests");
    }
    throw e;
  }

  const { contest, problems, member } = data;

  const now = new Date();
  const isStartedGlobal = now >= new Date(contest.startTime);
  const isEndedGlobal = now > new Date(contest.endTime);

  // User's specific timer logic
  const hasStarted = !!member.startedAt;
  const startedAt = member.startedAt ? new Date(member.startedAt) : null;
  
  let userEndTime = null;
  if (startedAt) {
    const timeBasedOnDuration = new Date(startedAt.getTime() + contest.duration * 60000);
    const globalEndTime = new Date(contest.endTime);
    // User must stop at duration OR global end time, whichever comes first
    userEndTime = timeBasedOnDuration < globalEndTime ? timeBasedOnDuration : globalEndTime;
  }

  const isUserTimeUp = userEndTime ? now > userEndTime : false;
  const isCompleted = !!(member as any).completedAt || isUserTimeUp;

  // Render: Not Started Yet
  if (!hasStarted) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{contest.title}</h1>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-2xl mx-auto">
            You are enrolled in this contest. Please review the rules and timing details below before you begin.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-1">Duration</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                {contest.duration} Minutes
              </div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-1">Questions</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                {problems.length} Problems
              </div>
            </div>
            <div className="p-5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-1">Proctoring</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-500" />
                {contest.settings?.proctoringMode === "NORMAL" ? "Standard" : "Strict"}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5 mb-8 text-left text-sm text-blue-800 dark:text-blue-200">
            <h4 className="font-bold flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4" /> Important Timing Rules
            </h4>
            <ul className="list-disc pl-5 space-y-1 opacity-90">
              <li>Your timer of {contest.duration} minutes begins exactly when you click Start.</li>
              <li>The global contest ends at {new Date(contest.endTime).toLocaleTimeString()}. If you start late, you will only have until this global end time.</li>
              <li>You can navigate between questions during the assessment.</li>
            </ul>
          </div>

          {isEndedGlobal ? (
            <div className="inline-block px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold rounded-lg border border-red-200 dark:border-red-900/50">
              This contest has officially ended.
            </div>
          ) : !isStartedGlobal ? (
            <div className="inline-block px-6 py-3 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-lg border border-slate-200 dark:border-zinc-700">
              Contest starts at {new Date(contest.startTime).toLocaleTimeString()}
            </div>
          ) : (
            <ArenaStartButton contestId={contest.id} />
          )}
        </div>
      </div>
    );
  }

  // Render: Completed / Time is Up
  if (isCompleted) {
    const results = await getContestResultsServer(params.id);

    return (
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Contest Results</h1>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            Your assessment has been officially submitted. Below is a detailed summary of your performance.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{results.stats.score}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">#{results.stats.rank}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{results.stats.solved} / {results.stats.total}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solved</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{results.stats.penalty}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Penalty (mins)</div>
            </div>
          </div>

          <Link 
            href="/contests"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Submission Breakdown</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {results.problems.map((p, idx) => {
              const isAccepted = p.bestSubmission?.verdict === "ACCEPTED";
              const hasAttempt = p.history.length > 0;
              
              return (
                <details key={p.id} className="group">
                  <summary className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors list-none">
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        !hasAttempt ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400" :
                        isAccepted ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500"
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{p.title}</h3>
                        <div className="flex gap-4 mt-1 text-sm">
                          <span className={isAccepted ? "text-green-600 dark:text-green-500 font-semibold" : "text-slate-500 dark:text-zinc-400"}>
                            {isAccepted ? `✓ Accepted` : hasAttempt ? `✗ Attempted` : `Not attempted`}
                          </span>
                          {isAccepted && p.bestSubmission && (
                            <>
                              <span className="text-slate-300 dark:text-zinc-700">•</span>
                              <span className="text-slate-500 dark:text-zinc-400">Runtime: {p.bestSubmission.executionTime} ms</span>
                              <span className="text-slate-300 dark:text-zinc-700">•</span>
                              <span className="text-slate-500 dark:text-zinc-400">Memory: {p.bestSubmission.memoryUsed} KB</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {isAccepted && <span className="font-bold text-green-600 dark:text-green-500">+{p.points}</span>}
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-open:-rotate-90 transition-transform">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </summary>
                  
                  {hasAttempt && (
                    <div className="px-6 pb-6 pt-2 bg-slate-50/50 dark:bg-zinc-900/50 border-t border-slate-100 dark:border-zinc-800/50">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-3">Submission History</h4>
                      <div className="space-y-2">
                        {p.history.map((sub: any) => (
                          <div key={sub.id} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-zinc-950 rounded-lg border border-slate-200 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                              <span className={`font-semibold ${sub.verdict === 'ACCEPTED' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                {sub.verdict === 'ACCEPTED' ? '✓ Accepted' : `✗ ${sub.verdict || 'PENDING'}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-6 text-slate-500 dark:text-zinc-400 font-mono text-xs">
                              <span className="w-20 text-right">{sub.executionTime ? `${sub.executionTime} ms` : '-'}</span>
                              <span className="w-20 text-right">{sub.memoryUsed ? `${sub.memoryUsed} KB` : '-'}</span>
                              <span className="w-32 text-right">{new Date(sub.submittedAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </details>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render: Active Dashboard
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{contest.title}</h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
            Assessment in progress
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <ArenaEndButton contestId={contest.id} />
          
          <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 text-right">
            <div className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Time Remaining</div>
            <div className="text-xl font-mono font-bold text-blue-600 dark:text-blue-400">
              {userEndTime && Math.max(0, Math.floor((userEndTime.getTime() - now.getTime()) / 60000))} mins
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            Problem Set
          </h2>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
          {problems.map((cp, idx) => (
            <Link 
              key={cp.id} 
              href={`/contests/${contest.id}/problems/${cp.problem.id}`}
              className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-slate-500 dark:text-zinc-400">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cp.problem.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500 dark:text-zinc-400">
                    <span className={`font-semibold ${
                      cp.problem.difficulty === "EASY" ? "text-green-600" :
                      cp.problem.difficulty === "MEDIUM" ? "text-amber-600" : "text-red-600"
                    }`}>
                      {cp.problem.difficulty}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-700"></span>
                    <span>{cp.points} Points</span>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                <ChevronRight className="w-5 h-5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
