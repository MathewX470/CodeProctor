"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ContestProblemLinkProps {
  contestId: string;
  problemId: string;
  requireFullScreen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function ContestProblemLink({
  contestId,
  problemId,
  requireFullScreen = false,
  className = "",
  children
}: ContestProblemLinkProps) {
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (requireFullScreen && typeof document !== "undefined" && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.warn("Could not enter fullscreen:", err);
      }
    }

    router.push(`/contests/${contestId}/problems/${problemId}`);
  };

  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
}
