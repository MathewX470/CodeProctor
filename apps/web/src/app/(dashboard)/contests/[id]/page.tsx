import React from "react";
import { getArenaDataServer, getContestResultsServer } from "@/app/actions/contests";
import { getSessionWithRoles } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import { Clock, ShieldCheck, CheckCircle2, ChevronRight, AlertTriangle, Trophy, Code2 } from "lucide-react";
import Link from "next/link";
import { ArenaStartButton } from "@/components/contests/ArenaStartButton";
import { ArenaEndButton } from "@/components/contests/ArenaEndButton";
import { ContestCountdownLobby } from "@/components/contests/ContestCountdownLobby";
import { ContestResultsDashboard } from "@/components/contests/ContestResultsDashboard";
import { ContestLiveTimer } from "@/components/contests/ContestLiveTimer";

export const dynamic = "force-dynamic";

export default async function ContestArenaDashboard(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSessionWithRoles();
  if (!session.session?.user) {
    redirect("/login");
  }

  const isAdmin = session.isSuperAdmin || session.permissions.includes("RBAC_CONTESTS");
  if (isAdmin) {
    redirect(`/contests/${params.id}/manage`);
  }

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

  // User personal timer calculation
  const hasStarted = !!member.startedAt;
  const startedAt = member.startedAt ? new Date(member.startedAt) : null;
  
  let userEndTime: Date | null = null;
  if (startedAt) {
    const timeBasedOnDuration = new Date(startedAt.getTime() + contest.duration * 60000);
    const globalEndTime = new Date(contest.endTime);
    userEndTime = timeBasedOnDuration < globalEndTime ? timeBasedOnDuration : globalEndTime;
  }

  const isUserTimeUp = userEndTime ? now > userEndTime : false;
  // If contest globally ended or member submitted/timed out, show results dashboard
  const isCompleted = !!(member as any).completedAt || isUserTimeUp || isEndedGlobal;

  const totalPoints = problems.reduce((acc: number, p: any) => acc + (p.points || 100), 0);

  // ==========================================
  // 0. STATE: ORGANIZER (OWNER / MODERATOR)
  // ==========================================
  const isOrganizer = member.role === "OWNER" || member.role === "MODERATOR";

  if (isOrganizer) {
    redirect(`/contests/${params.id}/manage`);
  }

  // ==========================================
  // 1. STATE: COMPLETED / TIME IS UP
  // ==========================================
  if (isCompleted) {
    const results = await getContestResultsServer(params.id);
    return (
      <ContestResultsDashboard 
        results={results} 
        currentUserId={session.session.user.id} 
      />
    );
  }

  // ==========================================
  // 2. STATE: NOT STARTED YET
  // ==========================================
  if (!hasStarted) {
    // If contest has not reached startTime yet -> Countdown Lobby
    if (!isStartedGlobal) {
      return (
        <ContestCountdownLobby 
          contest={contest} 
          problemCount={problems.length} 
          totalPoints={totalPoints} 
        />
      );
    }

    // If global contest has already expired without starting
    if (isEndedGlobal) {
      return (
        <div className="max-w-2xl mx-auto p-6 md:p-10 text-center space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-10 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Contest Concluded</h2>
            <p className="text-slate-500 dark:text-zinc-400 text-sm">
              This contest closed on {new Date(contest.endTime).toLocaleString()}. You did not participate during the assessment window.
            </p>
            <div className="pt-4">
              <Link 
                href="/contests"
                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium text-sm transition-colors"
              >
                Return to Contests
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // If contest is active -> Readiness & Start Briefing
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-zinc-800 shadow-sm text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-wider mb-6 border border-green-200 dark:border-green-900/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Contest Is Live Now
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            {contest.title}
          </h1>

          {contest.description && (
            <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 text-base leading-relaxed">
              {contest.description}
            </p>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-left">
            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Duration</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{contest.duration} Minutes</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Questions</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{problems.length} Problems</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400">Total Points</div>
                <div className="text-base font-bold text-slate-900 dark:text-white">{totalPoints} Points</div>
              </div>
            </div>
          </div>

          {/* Guidelines Box */}
          <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-6 mb-10 text-left text-sm text-blue-900 dark:text-blue-200">
            <h4 className="font-bold flex items-center gap-2 mb-3 text-base">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Important Guidelines Before You Start
            </h4>
            <ul className="space-y-2 list-disc pl-5 opacity-90 leading-relaxed">
              <li>Your personal timer of <strong>{contest.duration} minutes</strong> will begin the instant you click the button below.</li>
              <li>The global contest window closes at <strong>{new Date(contest.endTime).toLocaleTimeString()}</strong>. If you begin with less than {contest.duration} minutes remaining, your timer will end at the global deadline.</li>
              <li>You can switch between problems at any time and run test cases before final submission.</li>
              <li>Penalty time is calculated based on ICPC rules: time elapsed to first Accepted solve + 20 minutes per wrong submission.</li>
            </ul>
          </div>

          <ArenaStartButton contestId={contest.id} />
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. STATE: IN PROGRESS (ACTIVE DASHBOARD)
  // ==========================================
  const solvedCount = problems.filter((p: any) => p.userStatus === "ACCEPTED").length;
  const currentEarnedPoints = problems
    .filter((p: any) => p.userStatus === "ACCEPTED")
    .reduce((acc: number, p: any) => acc + (p.points || 100), 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10 space-y-8">
      {/* Top Active Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
              Assessment In Progress
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {contest.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Solve problems and submit your solutions before the timer expires.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <ArenaEndButton contestId={contest.id} />
          {userEndTime && (
            <ContestLiveTimer 
              userEndTime={userEndTime.toISOString()} 
              contestId={contest.id} 
            />
          )}
        </div>
      </div>

      {/* Progress Ticker Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Current Score
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {currentEarnedPoints}
            <span className="text-xs font-normal text-slate-400"> / {totalPoints}</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Problems Solved
          </div>
          <div className="text-2xl font-black text-green-600 dark:text-green-500">
            {solvedCount} / {problems.length}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Started At
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-zinc-200">
            {startedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Total Problems
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {problems.length}
          </div>
        </div>
      </div>

      {/* Problem Set List */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
            <Code2 className="w-5 h-5 text-blue-500" />
            Contest Problem Set
          </div>
          <span className="text-xs font-semibold text-slate-400 uppercase">
            Click to solve in IDE
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {problems.map((cp: any, idx: number) => {
            const isAccepted = cp.userStatus === "ACCEPTED";
            const isAttempted = cp.userStatus === "ATTEMPTED";

            return (
              <Link 
                key={cp.id} 
                href={`/contests/${contest.id}/problems/${cp.problem.id}`}
                className="flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition-colors group"
              >
                <div className="flex items-center gap-5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base transition-colors ${
                    isAccepted
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : isAttempted
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/40 group-hover:text-blue-600"
                  }`}>
                    {idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cp.problem.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        cp.problem.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        cp.problem.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {cp.problem.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">
                        {cp.points} Points
                      </span>
                      <span>•</span>
                      <span className={`font-semibold flex items-center gap-1 ${
                        isAccepted ? "text-green-600 dark:text-green-400" :
                        isAttempted ? "text-amber-600 dark:text-amber-400" :
                        "text-slate-400"
                      }`}>
                        {isAccepted ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                        {isAccepted ? "Solved" : isAttempted ? "Attempted (Unsolved)" : "Not Attempted"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                    isAccepted 
                      ? "bg-green-50 dark:bg-green-950/40 text-green-600 border-green-200 dark:border-green-900/50" 
                      : "bg-blue-600 text-white border-blue-600 group-hover:bg-blue-700"
                  }`}>
                    {isAccepted ? "Review Solution" : "Solve Problem"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
