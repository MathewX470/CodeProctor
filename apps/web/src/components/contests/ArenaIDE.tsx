"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { 
  Play, Send, Loader2, Code2, Clock, MemoryStick, Tag, 
  ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, 
  XCircle, ArrowLeft, RotateCcw, FileText, History, 
  AlertTriangle, Copy, Terminal, Check
} from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { endContestServer } from "@/app/actions/contests";

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
    sourceCode?: string;
    languageName?: string;
    createdAt: string | Date;
  }[];
};

interface ArenaIDEProps {
  problem: ProblemData;
  contestId: string;
  userEndTime: string;
  allProblems: {
    id: string;
    title: string;
    points?: number;
    status?: string;
  }[];
}

export function ArenaIDE({ problem, contestId, userEndTime, allProblems }: ArenaIDEProps) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  
  // LocalStorage Auto-save Key
  const storageKey = `code-contest-${contestId}-problem-${problem.id}`;

  const [selectedLang, setSelectedLang] = useState<string>(
    problem.templates.length > 0 ? problem.templates[0].languageId : (problem.allLanguages[0]?.id || "")
  );
  
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    const initialMap: Record<string, string> = {};
    problem.templates.forEach(t => {
      initialMap[t.languageId] = t.boilerplate;
    });
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

      // Poll submission status
      const poll = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/submissions/${submissionId}`);
          if (!pollRes.ok) return;
          
          const data = await pollRes.json();
          setSubmissionResult(data);

          if (data.status === "COMPLETED" || data.status === "FINISHED") {
            clearInterval(poll);
            if (actionType === "RUN") setIsRunning(false);
            else setIsSubmitting(false);
            
            if (data.verdict === "ACCEPTED") {
              toast.success(actionType === "SUBMIT" ? "Official Submission: Accepted! (+Points)" : "Sample Cases Passed!");
            } else {
              toast.error(`${data.verdict}`);
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
                  createdAt: new Date().toISOString()
                },
                ...prev
              ]);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1000);
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
            
            <div className="px-3 py-1 font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs sm:text-sm border-x border-slate-200 dark:border-zinc-800">
              <span>{currentIndex + 1}. {problem.title}</span>
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
                            <span className={`text-xs font-bold flex items-center gap-1.5 ${
                              sub.verdict === "ACCEPTED" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            }`}>
                              {sub.verdict === "ACCEPTED" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                              {sub.verdict}
                            </span>
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
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                              <div className="flex items-center gap-3">
                                {submissionResult.verdict === "ACCEPTED" ? (
                                  <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                                    <CheckCircle2 className="w-5 h-5" />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                                    <XCircle className="w-5 h-5" />
                                  </div>
                                )}
                                <div>
                                  <h4 className={`font-black text-base ${
                                    submissionResult.verdict === "ACCEPTED" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                  }`}>
                                    {submissionResult.verdict}
                                  </h4>
                                  <div className="text-xs text-slate-400 font-mono">
                                    {submissionResult.executionTime ? `${submissionResult.executionTime} ms` : "-"} • {submissionResult.memoryUsed ? `${submissionResult.memoryUsed} KB` : "-"}
                                  </div>
                                </div>
                              </div>
                            </div>

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
                                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 space-y-1.5 text-[11px]">
                                        {tc.input && <div><span className="text-slate-400">Input: </span><span className="text-slate-800 dark:text-zinc-200">{tc.input}</span></div>}
                                        {tc.expectedOutput && <div><span className="text-slate-400">Expected: </span><span className="text-green-600">{tc.expectedOutput}</span></div>}
                                        {tc.actualOutput && <div><span className="text-slate-400">Your Output: </span><span className="text-red-600">{tc.actualOutput}</span></div>}
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
