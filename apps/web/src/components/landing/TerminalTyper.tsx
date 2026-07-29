"use client";

import React, { useState, useEffect, useRef } from "react";

interface TerminalTyperProps {
  lines: string[];
  typingSpeed?: number;
  pauseBetweenLines?: number;
  className?: string;
}

export function TerminalTyper({
  lines,
  typingSpeed = 40,
  pauseBetweenLines = 800,
  className = "",
}: TerminalTyperProps) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([""]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Blinking cursor
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorTimer);
  }, []);

  // Typing effect
  useEffect(() => {
    if (currentLineIndex >= lines.length) return;

    const currentLine = lines[currentLineIndex];

    if (currentCharIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const newLines = [...prev];
          newLines[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1);
          return newLines;
        });
        setCurrentCharIndex((prev) => prev + 1);
      }, typingSpeed + Math.random() * 20);
      return () => clearTimeout(timer);
    } else {
      // Line complete, move to next
      const timer = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
        setDisplayedLines((prev) => [...prev, ""]);
      }, pauseBetweenLines);
      return () => clearTimeout(timer);
    }
  }, [currentLineIndex, currentCharIndex, lines, typingSpeed, pauseBetweenLines]);

  const isComplete = currentLineIndex >= lines.length;

  return (
    <div ref={containerRef} className={`font-mono text-xs ${className}`}>
      <div className="flex items-center gap-2 text-zinc-500 mb-3 text-[11px]">
        <span className="w-2 h-2 rounded-full bg-zinc-600" />
        <span>terminal</span>
      </div>
      <div className="space-y-0.5">
        {displayedLines.map((line, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-zinc-600 select-none shrink-0">$</span>
            <span className="text-zinc-300">
              {line}
              {i === currentLineIndex && !isComplete && (
                <span
                  className={`inline-block w-[6px] h-[14px] ml-0.5 -mb-[2px] ${
                    showCursor ? "bg-zinc-400" : "bg-transparent"
                  } transition-colors duration-100`}
                />
              )}
            </span>
          </div>
        ))}
        {isComplete && (
          <div className="flex items-start gap-2 mt-1">
            <span className="text-zinc-600 select-none shrink-0">$</span>
            <span
              className={`inline-block w-[6px] h-[14px] ${
                showCursor ? "bg-zinc-400" : "bg-transparent"
              } transition-colors duration-100`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
