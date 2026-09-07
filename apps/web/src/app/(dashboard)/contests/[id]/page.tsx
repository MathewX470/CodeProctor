import React from "react";
import { getArenaDataServer } from "@/app/actions/contests";
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
  const isCompleted = !!member.completedAt || isUserTimeUp;

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
    const totalProblems = problems.length;
    let attempted = 0;
    let accepted = 0;
    
    problems.forEach(p => {
      if (p.problem.submissions.length > 0) {
        attempted++;
        if (p.problem.submissions.some((s: any) => s.verdict === "ACCEPTED")) {
          accepted++;
        }
      }
    });

    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Test Completed</h1>
          <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            Your assessment has been officially submitted. Below is a summary of your performance.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{attempted} / {totalProblems}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempted</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/50">
              <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{accepted}</div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Solved</div>
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Questions Summary</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
            {problems.map((cp, idx) => {
              const subs = cp.problem.submissions;
              const hasAttempt = subs.length > 0;
              const isAccepted = subs.some((s: any) => s.verdict === "ACCEPTED");
              
              return (
                <div key={cp.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      !hasAttempt ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400" :
                      isAccepted ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500" :
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500"
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{cp.problem.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-zinc-400">
                        {hasAttempt ? `${subs.length} submission(s)` : "Not attempted"}
                      </p>
                    </div>
                  </div>
                  {hasAttempt && (
                    <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                      isAccepted ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-500"
                    }`}>
                      {isAccepted ? "Solved" : "Attempted"}
                    </span>
                  )}
                </div>
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
