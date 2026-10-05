"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { 
  Play, Send, Loader2, Code2, Clock, MemoryStick, Tag, 
  ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, 
  XCircle, ArrowLeft, RotateCcw, FileText, History, 
  AlertTriangle, Copy, Terminal, Check, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { endContestServer } from "@/app/actions/contests";
import { useStrictProctor } from "@/hooks/useStrictProctor";
import { StrictProctorOverlay } from "./StrictProctorOverlay";
import { useComputerVisionProctor } from "@/hooks/useComputerVisionProctor";
import { WebcamHUD } from "./WebcamHUD";

const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="animate-pulse h-12 w-full bg-slate-100 dark:bg-zinc-800 rounded-xl" /> }
);

type ProblemData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  memoryLimit: number;
  points?: number;
  totalTestCases?: number;
  tags: string[];
  samples: { input: string; expectedOutput: string; explanation?: string | null }[];
  templates: { languageId: string; boilerplate: string }[];
  allLanguages: { id: string; name: string; slug: string }[];
  submissions?: {
    id: string;
    status: string;
    verdict: string | null;
    executionTime: number | null;
    memoryUsed: number | null;
    languageId?: string;
    sourceCode?: string;
    languageName?: string;
    createdAt: string | Date;
    passedTestCases?: number;
    totalTestCases?: number;
    earnedPoints?: number;
  }[];
};

interface ArenaIDEProps {
  problem: ProblemData;
  contestId: string;
  userEndTime: string;
  userId?: string;
  settings?: {
    proctoringMode?: string;
    requireCamera?: boolean;
    requireFullScreen?: boolean;
    detectTabSwitch?: boolean;
    detectCopyPaste?: boolean;
  } | null;
  violationCount?: number;
  isDisqualified?: boolean;
  disqualifiedReason?: string | null;
  allProblems: {
    id: string;
    title: string;
    points?: number;
    earnedPoints?: number;
    passedCases?: number;
    totalCases?: number;
    status?: string;
  }[];
}

export function ArenaIDE({ 
  problem, 
  contestId, 
  userEndTime, 
  allProblems, 
  userId,
  settings,
  violationCount = 0,
  isDisqualified: initialIsDisqualified = false,
  disqualifiedReason: initialDisqualifiedReason = null
}: ArenaIDEProps) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  // Strict & Computer Vision Proctoring Integration
  const isCvProctor = settings?.proctoringMode === "CV_PROCTORED" || !!settings?.requireCamera;
  const isStrictProctor = isCvProctor || settings?.proctoringMode === "FULL_SCREEN" || !!settings?.requireFullScreen;
  const isFullScreenRequired = isCvProctor || settings?.proctoringMode === "FULL_SCREEN" || !!settings?.requireFullScreen;
  const isTabSwitchDetected = isCvProctor || settings?.proctoringMode === "FULL_SCREEN" || !!settings?.detectTabSwitch;
  const isCopyPasteBlocked = isCvProctor || settings?.proctoringMode === "FULL_SCREEN" || !!settings?.detectCopyPaste;

  const {
    isFullscreen,
    violationCount: proctorViolationCount,
    isDisqualified,
    disqualifiedReason,
    activeViolation,
    showWarningModal,
    setShowWarningModal,
    enterFullscreen
  } = useStrictProctor({
    contestId,
    enabled: isStrictProctor,
    requireFullScreen: isFullScreenRequired,
    detectTabSwitch: isTabSwitchDetected,
    detectCopyPaste: isCopyPasteBlocked,
    initialViolations: violationCount,
    isAlreadyDisqualified: initialIsDisqualified,
    disqualifiedReason: initialDisqualifiedReason,
    onDisqualified: (reason) => {
      toast.error(reason || "You have been disqualified for integrity violations.", { duration: 5000 });
    }
  });

  // Computer Vision Proctoring Hook
  const {
    videoRef: cvVideoRef,
    status: cvStatus,
    faceCount: cvFaceCount,
    yaw: cvYaw,
    pitch: cvPitch,
    isCameraReady: cvIsCameraReady,
    recalibrate: cvRecalibrate
  } = useComputerVisionProctor({
    contestId,
    enabled: isCvProctor && !isDisqualified
  });
  
  // LocalStorage Auto-save Key - strictly scoped by userId so different accounts on the same machine never share code
  const storageKey = userId 
    ? `code-user-${userId}-contest-${contestId}-problem-${problem.id}` 
    : `code-contest-${contestId}-problem-${problem.id}`;

  const [selectedLang, setSelectedLang] = useState<string>(
    problem.templates.length > 0 ? problem.templates[0].languageId : (problem.allLanguages[0]?.id || "")
  );
  
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    // 1. Try restoring from user-scoped localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }

    // 2. Initialize default boilerplate for all supported languages
    const initialMap: Record<string, string> = {};
    problem.templates.forEach(t => {
      initialMap[t.languageId] = t.boilerplate;
    });

    // 3. If this user has previous submissions in this contest, prefill with their latest submitted code
    if (problem.submissions && problem.submissions.length > 0) {
      const reversed = [...problem.submissions].reverse();
      reversed.forEach(sub => {
        if (sub.languageId && sub.sourceCode) {
          initialMap[sub.languageId] = sub.sourceCode;
        }
      });
    }

    return initialMap;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Left Panel Tabs
  const [leftTab, setLeftTab] = useState<"description" | "submissions">("description");
  
  // In-IDE Submissions History
  const [submissionsList, setSubmissionsList] = useState(problem.submissions || []);

  // Bottom Console Tabs
  const [bottomTab, setBottomTab] = useState<"testcases" | "result">("testcases");
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [useCustomInput, setUseCustomInput] = useState(false);
  
  // Results State
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const pollRef = React.useRef<NodeJS.Timeout | null>(null);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, []);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    const end = new Date(userEndTime).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;
      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        setIsTimeUp(true);
      } else {
        setTimeLeft(distance);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [userEndTime]);

  // Format time
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const isLowTime = timeLeft < 5 * 60 * 1000 && timeLeft > 0;

  // Auto Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(codeMap));
    }
  }, [codeMap, storageKey]);

  // Handle Timer Expiry
  useEffect(() => {
    if (isTimeUp) {
      toast.error("Contest duration has ended. Submitting your assessment...");
      endContestServer(contestId).finally(() => {
        setTimeout(() => {
          router.push(`/contests/${contestId}`);
          router.refresh();
        }, 1500);
      });
    }
  }, [isTimeUp, router, contestId]);

  const currentLangObj = problem.allLanguages.find(l => l.id === selectedLang);
  const currentCode = selectedLang ? (codeMap[selectedLang] || "") : "";

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLangId = e.target.value;
    setSelectedLang(newLangId);
    if (!codeMap[newLangId]) {
      const tmpl = problem.templates.find(t => t.languageId === newLangId);
      if (tmpl) {
        setCodeMap(prev => ({ ...prev, [newLangId]: tmpl.boilerplate }));
      }
    }
  };

  const handleResetToBoilerplate = () => {
    const tmpl = problem.templates.find(t => t.languageId === selectedLang);
    if (!tmpl) {
      toast.info("No template available for this language.");
      return;
    }
    if (window.confirm("Reset editor to initial template? Your unsaved edits in this language will be replaced.")) {
      setCodeMap(prev => ({ ...prev, [selectedLang]: tmpl.boilerplate }));
      toast.success("Code reset to template.");
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && selectedLang) {
      setCodeMap(prev => ({ ...prev, [selectedLang]: value }));
    }
  };

  const handleLoadSubmissionCode = (sourceCode: string) => {
    if (window.confirm("Load this past submission's code into your editor?")) {
      setCodeMap(prev => ({ ...prev, [selectedLang]: sourceCode }));
      toast.success("Submission code loaded.");
    }
  };

  // Execution: RUN or SUBMIT
  const executeCode = async (actionType: "RUN" | "SUBMIT") => {
    if (isTimeUp) return toast.error("Contest time is up!");
    if (!currentCode.trim()) return toast.error("Please write some code before submitting.");
    
    if (actionType === "RUN") setIsRunning(true);
    else setIsSubmitting(true);

    setBottomTab("result");
    setSubmissionResult({ status: "QUEUED" });
    
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          contestId: contestId,
          languageId: selectedLang,
          sourceCode: currentCode,
          actionType,
          customInput: useCustomInput ? customInput : undefined
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit code");
      }

      const { submissionId } = await res.json();
      let pollAttempts = 0;

      // Poll submission status with ref and timeout
      const poll = setInterval(async () => {
        pollAttempts++;
        if (pollAttempts > 45) {
          clearInterval(poll);
          pollRef.current = null;
          if (actionType === "RUN") setIsRunning(false);
          else setIsSubmitting(false);
          toast.error("Execution timed out. Please check your submissions history.");
          return;
        }

        try {
          const pollRes = await fetch(`/api/submissions/${submissionId}`);
          if (!pollRes.ok) return;
          
          const data = await pollRes.json();
          setSubmissionResult(data);

          if (data.status === "COMPLETED" || data.status === "FINISHED") {
            clearInterval(poll);
            pollRef.current = null;
            if (actionType === "RUN") setIsRunning(false);
            else setIsSubmitting(false);
            
            const passedCases = data.testCases?.filter((tc: any) => tc.verdict === "ACCEPTED").length || 0;
            const totalCases = data.testCases?.length || (problem.totalTestCases || 1);
            const probPoints = problem.points || 100;
            const earnedPts = totalCases > 0 ? Math.round((passedCases / totalCases) * probPoints) : 0;

            if (data.verdict === "ACCEPTED") {
              toast.success(actionType === "SUBMIT" ? `Official Submission: Accepted! Full points awarded (+${probPoints} pts)` : "Sample Cases Passed!");
            } else if (passedCases > 0 && actionType === "SUBMIT") {
              toast.info(`Partial Score: ${passedCases}/${totalCases} test cases passed (+${earnedPts} pts)`);
            } else {
              toast.error(`${data.verdict} (0/${totalCases} passed)`);
            }

            // If official submit, append to submissions tab
            if (actionType === "SUBMIT") {
              setSubmissionsList(prev => [
                {
                  id: data.id,
                  status: data.status,
                  verdict: data.verdict,
                  executionTime: data.executionTime,
                  memoryUsed: data.memoryUsed,
                  sourceCode: currentCode,
                  languageName: currentLangObj?.name,
                  createdAt: new Date().toISOString(),
                  passedTestCases: passedCases,
                  totalTestCases: totalCases,
                  earnedPoints: earnedPts
                },
                ...prev
              ]);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1000);

      pollRef.current = poll;
    } catch (e: any) {
      toast.error(e.message || "Network error while submitting code.");
      if (actionType === "RUN") setIsRunning(false);
      else setIsSubmitting(false);
      setSubmissionResult(null);
    }
  };

  // Keyboard Shortcuts: Ctrl+Enter / Cmd+Enter to Run
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        executeCode("SUBMIT");
      } else {
        executeCode("RUN");
      }
    }
  }, [currentCode, selectedLang, isTimeUp]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const getMonacoLanguage = (slug: string) => {
    if (!slug) return "plaintext";
    if (slug.includes("python")) return "python";
    if (slug.includes("java")) return "java";
    if (slug.includes("cpp") || slug.includes("c++")) return "cpp";
    if (slug.includes("c#")) return "csharp";
    if (slug.includes("go")) return "go";
    if (slug.includes("rust")) return "rust";
    if (slug.includes("javascript")) return "javascript";
    if (slug.includes("typescript")) return "typescript";
    return slug;
  };

  const currentIndex = allProblems?.findIndex(p => p.id === problem.id) ?? -1;
  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex >= 0 && currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  return (
    <div className="h-full w-full overflow-hidden bg-white dark:bg-[#18181b] flex flex-col select-none">
      {/* Top Navbar */}
      <div className="h-14 px-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0 z-10">
        {/* Left: Navigation & Problem Switcher */}
        <div className="flex items-center gap-3">
          <Link 
            href={`/contests/${contestId}`} 
            title="Return to Problem Set"
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Problems</span>
          </Link>
          
          <div className="h-4 w-px bg-slate-200 dark:border-zinc-800" />

          {/* Quick Problem Navigation Controller */}
          <div className="flex items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-sm">
            <Link 
              href={prevProblem ? `/contests/${contestId}/problems/${prevProblem.id}` : "#"} 
              className={`p-1.5 rounded-lg transition-colors ${
                prevProblem 
                  ? "text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800" 
                  : "text-slate-300 dark:text-zinc-700 cursor-not-allowed pointer-events-none"
              }`}
              title={prevProblem ? `Previous: ${prevProblem.title}` : "First Problem"}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            
            <div className="relative flex items-center">
              <select 
                value={problem.id}
                onChange={(e) => {
                  const targetId = e.target.value;
                  if (targetId && targetId !== problem.id) {
                    router.push(`/contests/${contestId}/problems/${targetId}`);
                  }
                }}
                className="appearance-none bg-transparent hover:bg-slate-100 dark:hover:bg-zinc-900 px-3 py-1 font-bold text-slate-900 dark:text-white text-xs sm:text-sm border-x border-slate-200 dark:border-zinc-800 cursor-pointer outline-none pr-7 transition-colors max-w-[200px] sm:max-w-xs truncate"
                title="Select Problem"
              >
                {allProblems?.map((p, idx) => {
                  const label = `${idx + 1}. ${p.title}${
                    p.status === "ACCEPTED" 
                      ? " (✓ Solved)" 
                      : p.status === "PARTIAL" 
                      ? ` (${p.earnedPoints || 0}/${p.points || 0} pts)` 
                      : p.status === "ATTEMPTED" 
                      ? " (⚡ Attempted)" 
                      : ""
                  }`;
                  return (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white font-normal">
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 pointer-events-none text-slate-400" />
            </div>

            <Link 
              href={nextProblem ? `/contests/${contestId}/problems/${nextProblem.id}` : "#"} 
              className={`p-1.5 rounded-lg transition-colors ${
                nextProblem 
                  ? "text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800" 
                  : "text-slate-300 dark:text-zinc-700 cursor-not-allowed pointer-events-none"
              }`}
              title={nextProblem ? `Next: ${nextProblem.title}` : "Last Problem"}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {/* Right: Timer, Language Selector & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Synchronized Live Countdown Clock */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-black text-xs sm:text-sm border transition-colors ${
            isLowTime 
              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60 animate-pulse" 
              : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-zinc-950 dark:text-zinc-300 dark:border-zinc-800"
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isLowTime ? "text-red-500" : "text-blue-500"}`} />
            <span>{String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>

          {/* Strict Proctor Window Change Indicator */}
          {isStrictProctor && (
            <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              proctorViolationCount > 0 
                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800" 
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900"
            }`}>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{proctorViolationCount} {proctorViolationCount === 1 ? "Window Change" : "Window Changes"}</span>
            </div>
          )}

          {/* AI Vision Camera Status Indicator */}
          {isCvProctor && (
            <div className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              cvStatus === "NORMAL"
                ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900"
                : cvStatus === "CALIBRATING"
                ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900"
                : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
            }`}>
              <span className={`w-2 h-2 rounded-full ${cvStatus === "NORMAL" ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
              <span>AI Vision: {cvStatus}</span>
            </div>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

          {/* Language Selector */}
          {problem.allLanguages.length > 0 && (
            <div className="relative hidden sm:block">
              <select 
                value={selectedLang} 
                onChange={handleLanguageChange}
                className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-bold py-1.5 pl-3 pr-8 rounded-xl outline-none cursor-pointer transition-colors"
              >
                {problem.allLanguages.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-zinc-500" />
            </div>
          )}

          {/* Run Code Button */}
          <button 
            onClick={() => executeCode("RUN")}
            disabled={isRunning || isSubmitting || isTimeUp}
            title="Run Code against sample test cases (Ctrl + Enter)"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Play className="w-3.5 h-3.5 text-blue-500 fill-current" />}
            <span className="hidden sm:inline">Run</span>
          </button>
          
          {/* Submit Code Button */}
          <button 
            onClick={() => executeCode("SUBMIT")}
            disabled={isRunning || isSubmitting || isTimeUp}
            title="Submit solution for official contest scoring"
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-green-600/20 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Main IDE Layout using react-resizable-panels */}
      <div className="flex-1 overflow-hidden select-text">
        <Group orientation="horizontal" className="h-full bg-slate-200 dark:bg-zinc-950">
          
          {/* LEFT PANEL: PROBLEM STATEMENT & SUBMISSIONS */}
          <Panel defaultSize={42} minSize={25}>
            <div className="h-full bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
              {/* Left Panel Tabs Header */}
              <div className="h-10 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 flex items-center gap-6 shrink-0">
                <button
                  onClick={() => setLeftTab("description")}
                  className={`h-full text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                    leftTab === "description"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Description
                </button>

                <button
                  onClick={() => setLeftTab("submissions")}
                  className={`h-full text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                    leftTab === "submissions"
                      ? "border-blue-600 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  My Submissions ({submissionsList.length})
                </button>
              </div>

              {/* Left Panel Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {leftTab === "description" ? (
                  <div className="space-y-6">
                    {/* Metadata Header */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">
                          {problem.title}
                        </h1>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          problem.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          problem.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {problem.difficulty}
                        </span>
                      </div>

                      {/* Limits & Tags */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>{problem.timeLimit} ms</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MemoryStick className="w-3.5 h-3.5 text-purple-500" />
                          <span>{problem.memoryLimit / 1000} MB</span>
                        </div>
                        {problem.tags.length > 0 && (
                          <div className="flex items-center gap-1 ml-auto">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            <div className="flex gap-1">
                              {problem.tags.map(t => (
                                <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-300">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Markdown Description */}
                    <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"} className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-zinc-200">
                      <MDPreview 
                        source={problem.description} 
                        style={{ backgroundColor: "transparent", color: "inherit", fontFamily: "inherit" }} 
                      />
                    </div>

                    {/* Sample Cases */}
                    {problem.samples.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sample Cases</h4>
                        <div className="space-y-4">
                          {problem.samples.map((sample, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                                Example {idx + 1}
                              </div>
                              <div className="space-y-2 font-mono text-xs">
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Input</div>
                                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-200 whitespace-pre">
                                    {sample.input}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Output</div>
                                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-green-700 dark:text-green-400 font-bold whitespace-pre">
                                    {sample.expectedOutput}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Submissions Tab */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Contest Attempts for this Problem
                      </h3>
                      <span className="text-xs text-slate-400">
                        {submissionsList.length} total
                      </span>
                    </div>

                    {submissionsList.length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                        <History className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-zinc-400">No submissions yet for this problem.</p>
                        <p className="text-xs text-slate-400 mt-1">Submit your code using the button at top right.</p>
                      </div>
                    ) : (
                      submissionsList.map((sub, idx) => (
                        <div 
                          key={sub.id || idx}
                          className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold flex items-center gap-1.5 ${
                                sub.verdict === "ACCEPTED" 
                                  ? "text-green-600 dark:text-green-400" 
                                  : (sub.earnedPoints && sub.earnedPoints > 0)
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}>
                                {sub.verdict === "ACCEPTED" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {sub.verdict === "ACCEPTED" ? "ACCEPTED" : (sub.earnedPoints && sub.earnedPoints > 0 ? "PARTIAL PASS" : sub.verdict)}
                              </span>
                              {sub.passedTestCases !== undefined && sub.totalTestCases !== undefined && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                  {sub.passedTestCases}/{sub.totalTestCases} Cases • {sub.earnedPoints ?? 0} pts
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(sub.createdAt).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-1 font-mono">
                            <div>
                              {sub.executionTime ? `${sub.executionTime} ms` : "-"} • {sub.memoryUsed ? `${sub.memoryUsed} KB` : "-"}
                            </div>
                            {sub.sourceCode && (
                              <button
                                onClick={() => handleLoadSubmissionCode(sub.sourceCode!)}
                                className="text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                              >
                                Load in Editor
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Resizer Handle */}
          <Separator className="w-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-blue-500 transition-colors flex items-center justify-center group cursor-col-resize">
            <div className="w-0.5 h-8 bg-slate-300 dark:bg-zinc-600 group-hover:bg-white rounded-full transition-colors" />
          </Separator>

          {/* RIGHT PANEL: EDITOR & CONSOLE */}
          <Panel defaultSize={58} minSize={30}>
            <Group orientation="vertical">
              
              {/* TOP: MONACO EDITOR */}
              <Panel defaultSize={65} minSize={30}>
                <div className="h-full bg-white dark:bg-[#1e1e1e] flex flex-col relative overflow-hidden">
                  <div className="h-10 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-zinc-300">
                      <Code2 className="w-3.5 h-3.5 text-blue-500" />
                      Editor ({currentLangObj?.name || "Code"})
                    </div>

                    <button
                      onClick={handleResetToBoilerplate}
                      title="Reset code to default template"
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>

                  <div className="flex-1 relative min-h-0">
                    <Editor
                      height="100%"
                      language={getMonacoLanguage(currentLangObj?.slug || "")}
                      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                      value={currentCode}
                      onChange={handleCodeChange}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        lineHeight: 24,
                        padding: { top: 12, bottom: 12 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        contextmenu: !isCopyPasteBlocked,
                      }}
                      loading={<div className="flex h-full items-center justify-center text-blue-500"><Loader2 className="w-6 h-6 animate-spin" /></div>}
                    />
                  </div>
                </div>
              </Panel>

              {/* Resizer Handle */}
              <Separator className="h-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-blue-500 transition-colors flex items-center justify-center group cursor-row-resize">
                <div className="h-0.5 w-8 bg-slate-300 dark:bg-zinc-600 group-hover:bg-white rounded-full transition-colors" />
              </Separator>

              {/* BOTTOM: INTERACTIVE CONSOLE */}
              <Panel defaultSize={35} minSize={20}>
                <div className="h-full bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
                  {/* Console Header Tabs */}
                  <div className="h-10 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-950/40 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setBottomTab("testcases")}
                        className={`h-full text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                          bottomTab === "testcases"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Test Cases
                      </button>

                      <button
                        onClick={() => setBottomTab("result")}
                        className={`h-full text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
                          bottomTab === "result"
                            ? "border-blue-600 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                        }`}
                      >
                        <BarChart3Icon className="w-3.5 h-3.5" />
                        Execution Result
                      </button>
                    </div>

                    {bottomTab === "testcases" && (
                      <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useCustomInput}
                          onChange={(e) => setUseCustomInput(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        Custom Input
                      </label>
                    )}
                  </div>

                  {/* Console Content */}
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-zinc-950">
                    {bottomTab === "testcases" ? (
                      useCustomInput ? (
                        <div className="space-y-2 h-full flex flex-col">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Custom Test Input
                          </div>
                          <textarea
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Enter custom input values matching the problem specification..."
                            className="w-full flex-1 min-h-[100px] p-3 font-mono text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Case Tabs */}
                          <div className="flex items-center gap-2">
                            {problem.samples.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedCaseIdx(i)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                                  selectedCaseIdx === i
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-zinc-900"
                                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100"
                                }`}
                              >
                                Case {i + 1}
                              </button>
                            ))}
                          </div>

                          {problem.samples[selectedCaseIdx] && (
                            <div className="space-y-3 font-mono text-xs">
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Input</div>
                                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-slate-800 dark:text-zinc-200 whitespace-pre">
                                  {problem.samples[selectedCaseIdx].input}
                                </div>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Expected Output</div>
                                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 text-green-600 dark:text-green-400 font-bold whitespace-pre">
                                  {problem.samples[selectedCaseIdx].expectedOutput}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      /* Execution Result View */
                      <div className="h-full">
                        {isRunning || isSubmitting || (submissionResult && submissionResult.status !== "COMPLETED" && submissionResult.status !== "FINISHED") ? (
                          <div className="flex h-full flex-col justify-center items-center gap-3 py-8 text-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            <span className="text-sm font-bold text-slate-700 dark:text-zinc-300 animate-pulse">
                              {submissionResult?.status || "Judging in CodeProctor Worker Sandbox..."}
                            </span>
                          </div>
                        ) : submissionResult ? (
                          <div className="space-y-4">
                            {/* Verdict Banner */}
                            {(() => {
                              const passedCount = submissionResult.testCases?.filter((tc: any) => tc.verdict === "ACCEPTED").length || 0;
                              const totalCount = submissionResult.testCases?.length || (problem.totalTestCases || 1);
                              const isFullAccepted = submissionResult.verdict === "ACCEPTED";
                              const isPartial = passedCount > 0 && !isFullAccepted;
                              const probPts = problem.points || 100;
                              const earnedPts = totalCount > 0 ? Math.round((passedCount / totalCount) * probPts) : 0;

                              return (
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                                  <div className="flex items-center gap-3">
                                    {isFullAccepted ? (
                                      <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                      </div>
                                    ) : isPartial ? (
                                      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                                        <XCircle className="w-5 h-5" />
                                      </div>
                                    )}
                                    <div>
                                      <h4 className={`font-black text-base flex flex-wrap items-center gap-2 ${
                                        isFullAccepted 
                                          ? "text-green-600 dark:text-green-400" 
                                          : isPartial 
                                          ? "text-amber-600 dark:text-amber-400" 
                                          : "text-red-600 dark:text-red-400"
                                      }`}>
                                        <span>
                                          {isFullAccepted ? "ACCEPTED" : isPartial ? "PARTIAL PASS" : submissionResult.verdict}
                                        </span>
                                        {totalCount > 0 && (
                                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                                            {passedCount}/{totalCount} Cases • {earnedPts}/{probPts} pts
                                          </span>
                                        )}
                                      </h4>
                                      <div className="text-xs text-slate-400 font-mono">
                                        {submissionResult.executionTime ? `${submissionResult.executionTime} ms` : "-"} • {submissionResult.memoryUsed ? `${submissionResult.memoryUsed} KB` : "-"}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Compilation Error Output */}
                            {submissionResult.verdict === "COMPILATION_ERROR" && submissionResult.error && (
                              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl font-mono text-xs text-red-700 dark:text-red-300 whitespace-pre overflow-x-auto">
                                {submissionResult.error}
                              </div>
                            )}

                            {/* Test Cases Results */}
                            {submissionResult.testCases && submissionResult.testCases.length > 0 && (
                              <div className="space-y-2">
                                {submissionResult.testCases.map((tc: any, idx: number) => (
                                  <div key={tc.id || idx} className="p-3.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-mono space-y-2">
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="flex items-center gap-1.5">
                                        {tc.verdict === "ACCEPTED" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                        Test Case {idx + 1}
                                      </span>
                                      <span className={tc.verdict === "ACCEPTED" ? "text-green-600" : "text-red-600"}>
                                        {tc.verdict}
                                      </span>
                                    </div>

                                    {!tc.isHidden && (tc.input || tc.expectedOutput) && (
                                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-[11px]">
                                        {tc.input && <div><div className="text-slate-400 mb-0.5">Input: </div><div className="text-slate-800 dark:text-zinc-200 whitespace-pre-wrap">{tc.input}</div></div>}
                                        {tc.expectedOutput && <div><div className="text-slate-400 mb-0.5">Expected: </div><div className="text-green-600 whitespace-pre-wrap">{tc.expectedOutput}</div></div>}
                                        {tc.actualOutput && <div><div className="text-slate-400 mb-0.5">Your Output: </div><div className="text-red-600 whitespace-pre-wrap">{tc.actualOutput}</div></div>}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col justify-center items-center gap-2 py-8 text-center text-slate-400">
                            <Play className="w-6 h-6 opacity-40" />
                            <span className="text-xs">Run or submit code to inspect execution output here.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </Group>
          </Panel>
        </Group>
      </div>

      {/* Strict Fullscreen Proctoring Overlay & Gateway */}
      <StrictProctorOverlay
        contestId={contestId}
        enabled={isStrictProctor}
        requireFullScreen={isFullScreenRequired}
        isFullscreen={isFullscreen}
        violationCount={proctorViolationCount}
        isDisqualified={isDisqualified}
        disqualifiedReason={disqualifiedReason}
        activeViolation={activeViolation}
        isOpen={showWarningModal}
        onEnterFullscreen={enterFullscreen}
        onDismiss={() => setShowWarningModal(false)}
      />

      {/* Floating Picture-in-Picture Webcam HUD */}
      {isCvProctor && !isDisqualified && (
        <WebcamHUD
          videoRef={cvVideoRef}
          status={cvStatus}
          faceCount={cvFaceCount}
          yaw={cvYaw}
          pitch={cvPitch}
          isCameraReady={cvIsCameraReady}
          onRecalibrate={cvRecalibrate}
        />
      )}
    </div>
  );
}

function BarChart3Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
