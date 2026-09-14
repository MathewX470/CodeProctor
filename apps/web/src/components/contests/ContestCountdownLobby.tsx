"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, CheckCircle2, ShieldCheck, Trophy } from "lucide-react";

interface ContestCountdownLobbyProps {
  contest: {
    id: string;
    title: string;
    description: string | null;
    startTime: Date | string;
    endTime: Date | string;
    duration: number;
    settings?: any;
  };
  problemCount: number;
  totalPoints: number;
}

export function ContestCountdownLobby({ contest, problemCount, totalPoints }: ContestCountdownLobbyProps) {
  const router = useRouter();
  const startTime = new Date(contest.startTime).getTime();
  
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isStarted: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isStarted: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = startTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isStarted: true });
        router.refresh();
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isStarted: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startTime, router]);

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-zinc-800 shadow-sm text-center relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 border border-blue-100 dark:border-blue-900/50">
          <Clock className="w-3.5 h-3.5" />
          Contest Starting Soon
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          {contest.title}
        </h1>

        {contest.description && (
          <p className="text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 text-base leading-relaxed">
            {contest.description}
          </p>
        )}

        {/* Live Countdown Clock Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto mb-10">
          <div className="bg-slate-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-3xl sm:text-4xl font-mono font-black text-blue-600 dark:text-blue-400">
              {String(timeLeft.days).padStart(2, "0")}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-1">
              Days
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-3xl sm:text-4xl font-mono font-black text-blue-600 dark:text-blue-400">
              {String(timeLeft.hours).padStart(2, "0")}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-1">
              Hours
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-3xl sm:text-4xl font-mono font-black text-blue-600 dark:text-blue-400">
              {String(timeLeft.minutes).padStart(2, "0")}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-1">
              Minutes
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className="text-3xl sm:text-4xl font-mono font-black text-blue-600 dark:text-blue-400 animate-pulse">
              {String(timeLeft.seconds).padStart(2, "0")}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-1">
              Seconds
            </div>
          </div>
        </div>

        {/* Contest Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 text-left">
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
              <div className="text-base font-bold text-slate-900 dark:text-white">{problemCount} Problems</div>
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

        {/* Contest Info & Scoring Rules Box */}
        <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Normal Contest Guidelines & Rules
          </div>
          <ul className="text-sm text-slate-600 dark:text-zinc-400 space-y-2 list-disc pl-5">
            <li>
              <strong>Standard Scoring:</strong> Each problem has a predefined point weight. Ranking is decided first by total points, then by total penalty time.
            </li>
            <li>
              <strong>Penalty Calculation:</strong> Penalty is the time in minutes from your contest start to your first Accepted submission, plus 20 minutes for each wrong submission preceding the Accepted one.
            </li>
            <li>
              <strong>Flexible Navigation:</strong> You can solve problems in any order and switch freely during the contest.
            </li>
            <li>
              <strong>Environment:</strong> Code will be compiled and tested against hidden test cases. You can run custom test cases at any time in the IDE.
            </li>
          </ul>
        </div>

        <div className="mt-8 text-xs text-slate-400 dark:text-zinc-500">
          The Start Assessment button will automatically activate the moment the countdown reaches 00:00:00.
        </div>
      </div>
    </div>
  );
}
