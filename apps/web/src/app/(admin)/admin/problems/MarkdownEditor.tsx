"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="p-4 h-64 flex items-center justify-center text-slate-400">Loading editor...</div> }
);

export function MarkdownEditor({ markdown, onChange }: { markdown: string, onChange: (val: string) => void }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check if html has dark class on mount
    const checkDark = () => {
      const darkActive = document.documentElement.classList.contains('dark');
      setIsDark(darkActive);
    };
    
    checkDark();
    
    // Setup observer to watch for class changes on html
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="h-[60vh] min-h-[400px] w-full" data-color-mode={isDark ? "dark" : "light"}>
      <MDEditor
        value={markdown}
        onChange={(val) => onChange(val || "")}
        height="100%"
        preview="live"
        className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800"
      />
    </div>
  );
}
