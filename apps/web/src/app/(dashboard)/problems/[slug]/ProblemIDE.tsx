"use client";

import React, { useState } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { Play, Send, CheckCircle2, XCircle, AlertCircle, Loader2, Code2, Clock, MemoryStick, Tag, ChevronDown, Terminal, Trophy } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "@uiw/react-markdown-preview/markdown.css";

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

export function ProblemIDE({ problem }: { problem: ProblemData }) {
  const { resolvedTheme } = useTheme();
  
  // State
  const [selectedLang, setSelectedLang] = useState<string>(
    problem.templates.length > 0 ? problem.templates[0].languageId : (problem.allLanguages[0]?.id || "")
  );
  
  const [codeMap, setCodeMap] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    problem.templates.forEach(t => {
      initialMap[t.languageId] = t.boilerplate;
    });
    return initialMap;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputTab, setOutputTab] = useState<"testcases" | "result">("testcases");
  const [leftTab, setLeftTab] = useState<"description" | "submissions">("description");
  const [rightTab, setRightTab] = useState<"code" | "submission">("code");
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [submissionsList, setSubmissionsList] = useState<any[]>(problem.submissions || []);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [activeChart, setActiveChart] = useState<"runtime" | "memory">("runtime");

  // Get current template for UI
  const currentTemplate = problem.templates.find(t => t.languageId === selectedLang);
  const currentLangObj = problem.allLanguages.find(l => l.id === selectedLang);
  const currentCode = selectedLang ? (codeMap[selectedLang] || "") : "";

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLang(newLang);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && selectedLang) {
      setCodeMap(prev => ({ ...prev, [selectedLang]: value }));
    }
  };

  const loadPastSubmission = async (id: string) => {
    setIsRunning(true);
    setSubmissionResult(null);
    setAnalyticsData(null);
    try {
      const res = await fetch(`/api/submissions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissionResult(data);
        // Do not override user's current working code in selectedLang.
        // We will just show data.sourceCode in the read-only submission tab!
        setRightTab("submission");
        setOutputTab("result");
        
        // Fetch analytics if it was accepted
        if (data.verdict === "ACCEPTED") {
          fetchAnalytics(data.id);
        }
      }
    } catch (e) {
      toast.error("Failed to load submission");
    } finally {
      setIsRunning(false);
    }
  };

  const fetchAnalytics = async (submissionId: string) => {
    setIsLoadingAnalytics(true);
    try {
      const res = await fetch(`/api/problems/${problem.slug}/analytics?submissionId=${submissionId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
      }
    } catch (e) {
      console.error("Failed to load analytics");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const executeCode = async (actionType: "RUN" | "SUBMIT") => {
    if (actionType === "RUN") setIsRunning(true);
    else setIsSubmitting(true);

    setOutputTab("result");
    
    try {
      // 1. Submit Code
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId: problem.id,
          languageId: selectedLang,
          sourceCode: currentCode,
          actionType
        }),
      });

      if (!res.ok) throw new Error("Failed to submit code");
      const { submissionId } = await res.json();

      // 2. Poll for Results
      const poll = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/submissions/${submissionId}`);
          if (!pollRes.ok) return;
          
          const data = await pollRes.json();
          setSubmissionResult(data);

          if (data.status === "COMPLETED" || data.status === "FINISHED") {
            clearInterval(poll);
            if (actionType === "RUN") setIsRunning(false);
            else {
               setIsSubmitting(false);
               // Prepend the new submission to the list
               const newSub = {
                 id: data.id,
                 status: data.status,
                 verdict: data.verdict,
                 executionTime: data.executionTime,
                 memoryUsed: data.memoryUsed,
                 languageName: currentLangObj?.name || "Unknown",
                 createdAt: new Date().toISOString()
               };
               setSubmissionsList(prev => [newSub, ...prev]);
               // Switch to the submission right tab to show it
               setRightTab("submission");
            }
            
            if (data.verdict === "ACCEPTED") {
              toast.success("Execution Successful!");
              fetchAnalytics(data.id);
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

  const handleRun = () => executeCode("RUN");
  const handleSubmit = () => executeCode("SUBMIT");

  // Convert language slug to monaco language identifier
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
    return slug; // Fallback
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full overflow-hidden bg-white dark:bg-[#1e1e1e] flex flex-col">
      {/* Navbar for IDE */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-500 font-mono opacity-50">#</span>
            {problem.title}
          </h1>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            problem.difficulty === "EASY" ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" :
            problem.difficulty === "MEDIUM" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
            "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          }`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {problem.allLanguages.length > 0 && (
            <div className="relative">
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
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit
          </button>
        </div>
      </div>

      {/* Split Pane Area */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" className="h-full bg-slate-200 dark:bg-zinc-950">
          
          {/* LEFT PANE: Description */}
          <Panel defaultSize={40} minSize={25}>
            <div className="h-full bg-white dark:bg-zinc-900 flex flex-col overflow-hidden">
              {/* Tab Bar */}
              <div className="flex items-center gap-6 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                <button 
                  onClick={() => setLeftTab("description")}
                  className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                    leftTab === "description" 
                      ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
                >
                  <Code2 className="w-4 h-4" /> Description
                </button>
                <button 
                  onClick={() => setLeftTab("submissions")}
                  className={`py-3 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
                    leftTab === "submissions" 
                      ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                  }`}
                >
                  <Clock className="w-4 h-4" /> Submissions
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto max-w-none">
                {leftTab === "description" && (
                  <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                    {/* Meta details */}
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

                    {/* Markdown */}
                    <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
                      <MDPreview 
                        source={problem.description} 
                        style={{ backgroundColor: "transparent", color: "inherit", fontFamily: "inherit" }} 
                      />
                    </div>

                    {/* Samples */}
                    {problem.samples.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800 not-prose">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-100 mb-4">Examples</h3>
                        <div className="space-y-6">
                          {problem.samples.map((sample, i) => (
                             <div key={i} className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 rounded-lg p-4">
                               <div className="font-semibold text-slate-700 dark:text-zinc-300 text-sm mb-2">Example {i + 1}:</div>
                               <div className="space-y-3 font-mono text-sm">
                                 <div>
                                   <span className="text-slate-500 dark:text-zinc-400 select-none">Input: </span>
                                   <span className="text-slate-900 dark:text-zinc-200">{sample.input}</span>
                                 </div>
                                 <div>
                                   <span className="text-slate-500 dark:text-zinc-400 select-none">Output: </span>
                                   <span className="text-slate-900 dark:text-zinc-200 font-bold">{sample.expectedOutput}</span>
                                 </div>
                                 {sample.explanation && (
                                   <div className="text-slate-600 dark:text-zinc-400 font-sans mt-2 pt-2 border-t border-slate-200 dark:border-zinc-700">
                                     <span className="font-medium text-slate-500 dark:text-zinc-500">Explanation:</span> {sample.explanation}
                                   </div>
                                 )}
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {leftTab === "submissions" && (
                  <div className="flex flex-col h-full w-full">
                    {submissionsList.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 p-8 text-center">
                        <Terminal className="w-10 h-10 mb-3 opacity-20" />
                        <h3 className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-1">No submissions yet</h3>
                        <p className="text-xs">Submit your code to see your past attempts here.</p>
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="grid grid-cols-12 text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider py-3 px-4 border-b border-slate-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                          <div className="col-span-5">Status</div>
                          <div className="col-span-4">Language</div>
                          <div className="col-span-3">Runtime</div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                          {submissionsList.map((sub, i) => {
                            const date = new Date(sub.createdAt);
                            const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
                            const isAccepted = sub.verdict === "ACCEPTED";
                            
                            return (
                              <div 
                                key={sub.id || i} 
                                onClick={() => loadPastSubmission(sub.id)}
                                className="grid grid-cols-12 items-center text-sm py-3 px-4 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                              >
                                <div className="col-span-5 flex flex-col">
                                  <span className={`font-semibold ${isAccepted ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {sub.verdict === "ACCEPTED" ? "Accepted" : sub.verdict?.replace(/_/g, " ")}
                                  </span>
                                  <span className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">{formattedDate}</span>
                                </div>
                                <div className="col-span-4 text-slate-700 dark:text-zinc-300">
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs border border-slate-200 dark:border-zinc-700">
                                    {sub.languageName}
                                  </span>
                                </div>
                                <div className="col-span-3 flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                                  <Clock className="w-3 h-3 opacity-70" />
                                  <span>{sub.executionTime || 0} ms</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* DRAG HANDLE */}
          <Separator className="w-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-blue-400 dark:hover:bg-blue-500/50 transition-colors cursor-col-resize active:bg-blue-500 flex items-center justify-center relative z-20 group">
             <div className="w-0.5 h-8 bg-slate-300 dark:bg-zinc-600 group-hover:bg-white rounded-full transition-colors" />
          </Separator>

          {/* RIGHT PANE: Code Editor & Results */}
          <Panel defaultSize={60} minSize={30}>
            <Group orientation="vertical">
              
              {/* EDITOR TOP */}
              <Panel defaultSize={70} minSize={30}>
                <div className="h-full bg-white dark:bg-[#1e1e1e] flex flex-col relative overflow-hidden">
                  
                  {/* Right Pane Tabs */}
                  <div className="flex items-center gap-6 px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                    <button 
                      onClick={() => setRightTab("code")}
                      className={`py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
                        rightTab === "code" 
                          ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" /> Code
                    </button>
                    {submissionResult && submissionResult.id && (
                      <button 
                        onClick={() => setRightTab("submission")}
                        className={`py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
                          rightTab === "submission" 
                            ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                        }`}
                      >
                        {submissionResult.verdict === "ACCEPTED" ? (
                          <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> <span className="text-green-600 dark:text-green-500">Accepted</span></>
                        ) : submissionResult.verdict ? (
                          <><XCircle className="w-3.5 h-3.5 text-red-500" /> <span className="text-red-600 dark:text-red-500">{submissionResult.verdict.replace(/_/g, " ")}</span></>
                        ) : (
                          <><Clock className="w-3.5 h-3.5" /> Submission</>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Right Pane Content Area */}
                  <div className="flex-1 relative min-h-0 bg-white dark:bg-[#1e1e1e]">
                    
                    {/* Active Editor Tab */}
                    <div className={`absolute inset-0 ${rightTab === "code" ? "flex flex-col" : "hidden"}`}>
                      {!selectedLang ? (
                        <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-zinc-500 text-sm">
                          Select a language to start coding
                        </div>
                      ) : (
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
                            padding: { top: 16, bottom: 16 },
                            scrollBeyondLastLine: false,
                            smoothScrolling: true,
                            cursorBlinking: "smooth",
                            cursorSmoothCaretAnimation: "on",
                            formatOnPaste: true,
                            renderLineHighlight: "all",
                          }}
                          loading={
                            <div className="flex h-full items-center justify-center text-blue-500">
                              <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                          }
                        />
                      )}
                    </div>

                    {/* Submission Details Tab */}
                    {submissionResult && submissionResult.id && (
                      <div className={`absolute inset-0 overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-6 ${rightTab === "submission" ? "block" : "hidden"}`}>
                        
                        {/* Analytics View */}
                        {submissionResult.verdict === "ACCEPTED" && (
                          <div className="mb-8">
                            {isLoadingAnalytics || !analyticsData ? (
                              <div className="h-40 flex items-center justify-center text-sm text-slate-500">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading analytics...
                              </div>
                            ) : (
                              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                                  <div 
                                    onClick={() => setActiveChart("runtime")}
                                    className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors border-2 ${activeChart === "runtime" ? "border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/50" : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800/30"}`}
                                  >
                                    <div className="text-slate-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Runtime</div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                      <div className="text-3xl font-black text-slate-800 dark:text-zinc-100">{submissionResult.executionTime}</div>
                                      <div className="text-slate-500 dark:text-zinc-400 font-medium">ms</div>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-600 dark:text-zinc-300 flex items-center gap-1.5">
                                      Beats <span className="text-green-600 dark:text-green-400 text-base">{analyticsData.runtimePercentile}%</span>
                                      <Trophy className="w-4 h-4 text-green-500" />
                                    </div>
                                  </div>
                                  
                                </div>

                                {/* Histogram */}
                                <div className="mt-4 border-t border-slate-100 dark:border-zinc-800 pt-6">
                                  <div className="text-xs font-bold text-slate-500 dark:text-zinc-400 mb-6 flex justify-between">
                                    <span>Runtime Distribution</span>
                                    <span className="font-medium bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{analyticsData.totalSubmissions} users</span>
                                  </div>
                                  <div className="h-32 flex items-end gap-[2px] border-b-2 border-slate-200 dark:border-zinc-800 pb-1 relative px-2">
                                    {analyticsData.runtimeDistribution.map((bucket: any, idx: number) => {
                                      const maxCount = Math.max(...analyticsData.runtimeDistribution.map((b: any) => b.count), 1);
                                      const heightPercent = (bucket.count / maxCount) * 100;
                                      return (
                                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                          {bucket.isCurrent && (
                                            <div className="absolute -top-7 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 whitespace-nowrap">
                                              You
                                              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500"></div>
                                            </div>
                                          )}
                                          <div 
                                            className={`w-full rounded-t-[2px] transition-all duration-300 ${bucket.isCurrent ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] z-0' : 'bg-slate-300 dark:bg-zinc-700 group-hover:bg-slate-400 dark:group-hover:bg-zinc-600'}`}
                                            style={{ height: `${Math.max(2, heightPercent)}%` }}
                                          ></div>
                                          
                                          {/* Tooltip */}
                                          <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20 transition-opacity">
                                            {activeChart === "memory" 
                                              ? `${(bucket.min / 1024).toFixed(1)}-${(bucket.max / 1024).toFixed(1)} MB` 
                                              : `${bucket.min}-${bucket.max} ms`}
                                            : {bucket.count} users
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Read-only Code View */}
                        <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-sm">
                          <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900/80">
                            <div className="text-sm font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                              <Code2 className="w-4 h-4 text-blue-500" />
                              Submitted Code
                            </div>
                            <span className="px-2.5 py-1 bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded text-xs font-medium">
                              {submissionResult.languageName || submissionResult.languageId}
                            </span>
                          </div>
                          <div className="h-[400px]">
                            <Editor
                              height="100%"
                              language={getMonacoLanguage(problem.allLanguages.find(l => l.id === submissionResult.languageId)?.slug || "")}
                              theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
                              value={submissionResult.sourceCode}
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                lineHeight: 22,
                                padding: { top: 16, bottom: 16 },
                                scrollBeyondLastLine: false,
                              }}
                            />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              </Panel>

              {/* VERTICAL DRAG HANDLE */}
              <Separator className="h-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-blue-400 dark:hover:bg-blue-500/50 transition-colors cursor-row-resize active:bg-blue-500 flex items-center justify-center relative z-20 group">
                 <div className="h-0.5 w-8 bg-slate-300 dark:bg-zinc-600 group-hover:bg-white rounded-full transition-colors" />
              </Separator>

              {/* EDITOR BOTTOM: Console / Test Cases */}
              <Panel defaultSize={30} minSize={15}>
                <div className="h-full bg-white dark:bg-zinc-900 flex flex-col">
                  {/* Console Tabs */}
                  <div className="flex items-center px-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 shrink-0">
                    <button 
                      onClick={() => setOutputTab("testcases")}
                      className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                        outputTab === "testcases" 
                          ? "border-blue-600 text-slate-800 dark:text-zinc-100" 
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                      }`}
                    >
                      Test Cases
                    </button>
                    <button 
                      onClick={() => setOutputTab("result")}
                      className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                        outputTab === "result" 
                          ? "border-blue-600 text-slate-800 dark:text-zinc-100" 
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-300"
                      }`}
                    >
                      Test Result
                    </button>
                  </div>
                  
                  {/* Console Content */}
                  <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-zinc-950">
                    {outputTab === "testcases" && (
                       <div className="space-y-4">
                         {problem.samples.map((sample, i) => (
                           <div key={i} className="mb-6 last:mb-0">
                             <div className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Case {i + 1}</div>
                             <div className="space-y-3">
                               <div>
                                 <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mb-1">INPUT</div>
                                 <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-2.5 font-mono text-xs text-slate-800 dark:text-zinc-300 whitespace-pre-wrap">
                                   {sample.input}
                                 </div>
                               </div>
                               <div>
                                 <div className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium mb-1">EXPECTED OUTPUT</div>
                                 <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-2.5 font-mono text-xs text-slate-800 dark:text-zinc-300 whitespace-pre-wrap">
                                   {sample.expectedOutput}
                                 </div>
                               </div>
                             </div>
                           </div>
                         ))}
                         {problem.samples.length === 0 && (
                           <div className="text-sm text-slate-500 dark:text-zinc-500">No public test cases available to preview.</div>
                         )}
                       </div>
                    )}

                    {outputTab === "result" && (
                      <div className="h-full flex flex-col p-2 text-slate-700 dark:text-zinc-300">
                        {isRunning || isSubmitting || (submissionResult && submissionResult.status !== "COMPLETED" && submissionResult.status !== "FINISHED") ? (
                           <div className="flex h-full flex-col justify-center items-center gap-3">
                             <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                             <span className="text-sm font-medium animate-pulse">
                               {submissionResult?.status || "Connecting..."}
                             </span>
                           </div>
                        ) : submissionResult ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                              <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                submissionResult.verdict === "ACCEPTED" 
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              }`}>
                                {submissionResult.verdict}
                              </span>
                              <span className="text-xs text-slate-500">
                                {submissionResult.executionTime}ms • {submissionResult.memoryUsed}KB
                              </span>
                            </div>
                            
                            {submissionResult.testCases && submissionResult.testCases.map((tc: any, idx: number) => (
                              <div key={tc.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded p-3 text-xs font-mono mb-2">
                                <div className="font-semibold mb-2 flex items-center gap-2">
                                  {tc.verdict === "ACCEPTED" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                  Test Case {idx + 1} {tc.isHidden ? "(Hidden)" : ""}
                                </div>
                                {!tc.isHidden && (
                                  <>
                                    <div className="text-slate-500 mt-2">Input:</div>
                                    <div className="text-slate-800 dark:text-zinc-300">{tc.input}</div>
                                    <div className="text-slate-500 mt-2">Expected:</div>
                                    <div className="text-slate-800 dark:text-zinc-300">{tc.expectedOutput}</div>
                                    <div className="text-slate-500 mt-2">Actual:</div>
                                    <div className="text-slate-800 dark:text-zinc-300">{tc.actualOutput}</div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full flex-col justify-center items-center gap-2 text-center text-slate-500">
                            <Terminal className="w-8 h-8 text-slate-300 dark:text-zinc-700" />
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
