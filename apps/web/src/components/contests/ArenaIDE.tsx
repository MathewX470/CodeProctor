"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Play, Send, Loader2, Code2, Clock, MemoryStick, Tag, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="animate-pulse h-10 w-full bg-slate-200 dark:bg-zinc-800 rounded"></div> }
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
  samples: any[];
  templates: any[];
  allLanguages: { id: string, name: string, slug: string }[];
  submissions?: any[];
};

export function ArenaIDE({ problem, contestId, userEndTime, allProblems }: { problem: ProblemData, contestId: string, userEndTime: string, allProblems: {id: string, title: string}[] }) {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  
  // LocalStorage Auto-save Key
  const storageKey = `code-contest-${contestId}-problem-${problem.id}`;

  const [selectedLang, setSelectedLang] = useState<string>(
    problem.templates.length > 0 ? problem.templates[0].languageId : (problem.allLanguages[0]?.id || "")
  );
  
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const initialMap: Record<string, string> = {};
    problem.templates.forEach(t => {
      initialMap[t.languageId] = t.boilerplate;
    });
    return initialMap;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputTab, setOutputTab] = useState<"testcases" | "result">("testcases");
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    const end = new Date(userEndTime).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;
      if (distance < 0) {
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

  // Auto Save
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(codeMap));
  }, [codeMap, storageKey]);

  // Ensure user is kicked out if time is up
  useEffect(() => {
    if (isTimeUp) {
      toast.error("Time is up! Redirecting...");
      setTimeout(() => router.push(`/contests/${contestId}`), 2000);
    }
  }, [isTimeUp, router, contestId]);

  const currentLangObj = problem.allLanguages.find(l => l.id === selectedLang);
  const currentCode = selectedLang ? (codeMap[selectedLang] || "") : "";

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLang(e.target.value);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && selectedLang) {
      setCodeMap(prev => ({ ...prev, [selectedLang]: value }));
    }
  };

  const executeCode = async (actionType: "RUN" | "SUBMIT") => {
    if (isTimeUp) return toast.error("Time is up!");
    if (actionType === "RUN") setIsRunning(true);
    else setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          contestId: contestId,
          languageId: selectedLang,
          sourceCode: currentCode,
          actionType
        }),
      });

      if (!res.ok) throw new Error("Failed to submit code");
      const { submissionId } = await res.json();
      setOutputTab("result");

      // Poll
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
              toast.success("Execution Successful!");
            } else {
              toast.error(`Execution Failed: ${data.verdict}`);
            }
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 1000);
    } catch (e) {
      toast.error("Network error submitting code.");
      if (actionType === "RUN") setIsRunning(false);
      else setIsSubmitting(false);
      setSubmissionResult(null);
    }
  };

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
    <div className="h-full w-full overflow-hidden bg-white dark:bg-[#1e1e1e] flex flex-col">
      {/* Navbar for Arena IDE */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/contests/${contestId}`} className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded transition-colors text-slate-500 dark:text-zinc-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="h-4 w-px bg-slate-300 dark:bg-zinc-700"></div>
          
          <div className="flex items-center bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-0.5">
            <Link 
              href={prevProblem ? `/contests/${contestId}/problems/${prevProblem.id}` : "#"} 
              className={`p-1.5 rounded transition-colors ${prevProblem ? "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800" : "text-slate-300 dark:text-zinc-700 cursor-not-allowed"}`}
              onClick={e => !prevProblem && e.preventDefault()}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            
            <div className="px-3 py-1 font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2 text-sm sm:text-base border-x border-slate-100 dark:border-zinc-800 min-w-[120px] justify-center">
              {currentIndex + 1}. {problem.title}
            </div>

            <Link 
              href={nextProblem ? `/contests/${contestId}/problems/${nextProblem.id}` : "#"} 
              className={`p-1.5 rounded transition-colors ${nextProblem ? "text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800" : "text-slate-300 dark:text-zinc-700 cursor-not-allowed"}`}
              onClick={e => !nextProblem && e.preventDefault()}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm border ${
            timeLeft < 300000 
              ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50" 
              : "bg-white text-slate-700 border-slate-200 dark:bg-zinc-950 dark:text-zinc-300 dark:border-zinc-800"
          }`}>
            <Clock className="w-4 h-4" />
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-zinc-700"></div>

          {problem.allLanguages.length > 0 && (
            <div className="relative hidden sm:block">
              <select 
                value={selectedLang} 
                onChange={handleLanguageChange}
                className="appearance-none bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 text-sm font-medium py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {problem.allLanguages.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-zinc-500" />
            </div>
          )}
          
          <button 
            onClick={() => executeCode("RUN")}
            disabled={isRunning || isSubmitting || isTimeUp}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">Run</span>
          </button>
          
          <button 
            onClick={() => executeCode("SUBMIT")}
            disabled={isRunning || isSubmitting || isTimeUp}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full bg-slate-200 dark:bg-zinc-950">
          <Panel defaultSize={40} minSize={25}>
            <div className="h-full bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto max-w-none p-6 prose prose-sm dark:prose-invert">
                <div className="flex flex-wrap items-center gap-4 mb-6 not-prose border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    {problem.timeLimit}ms
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                    <MemoryStick className="w-3.5 h-3.5" />
                    {problem.memoryLimit / 1000}MB
                  </div>
                  {problem.tags.length > 0 && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <div className="flex gap-1.5">
                        {problem.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded text-[10px] font-medium border border-slate-200 dark:border-zinc-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
                  <MDPreview source={problem.description} style={{ backgroundColor: "transparent", color: "inherit", fontFamily: "inherit" }} />
                </div>

                {problem.samples.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 not-prose">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">Examples</h3>
                    <div className="space-y-6">
                      {problem.samples.map((sample, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg p-4">
                            <div className="font-semibold text-slate-700 dark:text-zinc-300 text-sm mb-2">Example {i + 1}:</div>
                            <div className="space-y-3 font-mono text-sm">
                              <div><span className="text-slate-500 dark:text-zinc-400">Input: </span><span className="text-slate-900 dark:text-zinc-200">{sample.input}</span></div>
                              <div><span className="text-slate-500 dark:text-zinc-400">Output: </span><span className="text-slate-900 dark:text-zinc-200 font-bold">{sample.expectedOutput}</span></div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Separator className="w-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-blue-400 transition-colors flex items-center justify-center group"><div className="w-0.5 h-8 bg-slate-300 dark:bg-zinc-600 group-hover:bg-white rounded-full transition-colors" /></Separator>

          <Panel defaultSize={60} minSize={30}>
            <Group orientation="vertical">
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full bg-white dark:bg-[#1e1e1e] flex flex-col relative overflow-hidden">
                  <div className="flex items-center gap-6 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                    <button className="py-2.5 text-xs font-medium border-b-2 border-blue-600 text-blue-600 flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> Code</button>
                  </div>
                  <div className="flex-1 relative min-h-0 bg-white dark:bg-[#1e1e1e]">
                    <Editor
                      height="100%"
                      language={getMonacoLanguage(currentLangObj?.slug || "")}
                      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                      value={currentCode}
                      onChange={handleCodeChange}
                      options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", lineHeight: 24, padding: { top: 16, bottom: 16 } }}
                      loading={<div className="flex h-full items-center justify-center text-blue-500"><Loader2 className="w-6 h-6 animate-spin" /></div>}
                    />
                  </div>
                </div>
              </Panel>

              <Separator className="h-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-blue-400 transition-colors flex items-center justify-center group"><div className="h-0.5 w-8 bg-slate-300 dark:bg-zinc-600 group-hover:bg-white rounded-full transition-colors" /></Separator>

              <Panel defaultSize={30} minSize={15}>
                <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
                  <div className="flex items-center px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                    <button onClick={() => setOutputTab("testcases")} className={`px-4 py-2 text-xs font-medium border-b-2 ${outputTab === "testcases" ? "border-blue-600 text-slate-800 dark:text-zinc-100" : "border-transparent text-slate-500"}`}>Test Cases</button>
                    <button onClick={() => setOutputTab("result")} className={`px-4 py-2 text-xs font-medium border-b-2 ${outputTab === "result" ? "border-blue-600 text-slate-800 dark:text-zinc-100" : "border-transparent text-slate-500"}`}>Test Result</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-zinc-950">
                    {outputTab === "testcases" && (
                       <div className="space-y-4">
                         {problem.samples.map((sample, i) => (
                           <div key={i}>
                             <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Case {i + 1}</div>
                             <div className="space-y-3">
                               <div><div className="text-[10px] text-slate-400 font-medium mb-1">INPUT</div><div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-2.5 font-mono text-xs">{sample.input}</div></div>
                               <div><div className="text-[10px] text-slate-400 font-medium mb-1">EXPECTED OUTPUT</div><div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-2.5 font-mono text-xs">{sample.expectedOutput}</div></div>
                             </div>
                           </div>
                         ))}
                       </div>
                    )}
                    {outputTab === "result" && (
                      <div className="h-full flex flex-col p-2 text-slate-700 dark:text-zinc-300">
                        {isRunning || isSubmitting || (submissionResult && submissionResult.status !== "COMPLETED" && submissionResult.status !== "FINISHED") ? (
                           <div className="flex h-full flex-col justify-center items-center gap-3"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /><span className="text-sm font-medium animate-pulse">{submissionResult?.status || "Connecting..."}</span></div>
                        ) : submissionResult ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${submissionResult.verdict === "ACCEPTED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{submissionResult.verdict}</span>
                              <span className="text-xs text-slate-500">{submissionResult.executionTime}ms • {submissionResult.memoryUsed}KB</span>
                            </div>
                            {submissionResult.testCases && submissionResult.testCases.map((tc: any, idx: number) => (
                              <div key={tc.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-3 text-xs font-mono mb-2">
                                <div className="font-semibold mb-2 flex items-center gap-2">{tc.verdict === "ACCEPTED" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />} Test Case {idx + 1}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col justify-center items-center gap-2 text-center text-slate-500">
                            <span className="text-sm">Run or submit code to see execution results here.</span>
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
