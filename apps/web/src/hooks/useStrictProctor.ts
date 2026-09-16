"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { recordContestViolationServer } from "@/app/actions/contests";
import { toast } from "sonner";

interface UseStrictProctorOptions {
  contestId: string;
  enabled: boolean;
  requireFullScreen?: boolean;
  detectTabSwitch?: boolean;
  detectCopyPaste?: boolean;
  initialViolations?: number;
  isAlreadyDisqualified?: boolean;
  disqualifiedReason?: string | null;
  onDisqualified?: (reason: string) => void;
}

export interface ProctorViolationEvent {
  type: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "PASTE";
  title: string;
  description: string;
  timestamp: Date;
}

export function useStrictProctor({
  contestId,
  enabled,
  requireFullScreen = false,
  detectTabSwitch = false,
  detectCopyPaste = false,
  initialViolations = 0,
  isAlreadyDisqualified = false,
  disqualifiedReason: initialDisqualifiedReason = null,
  onDisqualified
}: UseStrictProctorOptions) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(initialViolations);
  const [isDisqualified, setIsDisqualified] = useState(isAlreadyDisqualified);
  const [disqualifiedReason, setDisqualifiedReason] = useState<string | null>(initialDisqualifiedReason);
  const [activeViolation, setActiveViolation] = useState<ProctorViolationEvent | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Debounce flag to avoid duplicate triggers for the same tab switch / blur
  const lastViolationTimeRef = useRef<number>(0);
  const isHandlingViolationRef = useRef<boolean>(false);
  const isEnablingFullscreenRef = useRef<boolean>(false);

  // Check current fullscreen state on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsFullscreen(!!document.fullscreenElement);
    }
  }, []);

  // Request entering fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      isEnablingFullscreenRef.current = true;
      if (document.documentElement && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setShowWarningModal(false);
      }
    } catch (err) {
      console.warn("Could not enter fullscreen:", err);
      toast.error("Please grant fullscreen permission to continue the assessment.");
    } finally {
      setTimeout(() => {
        isEnablingFullscreenRef.current = false;
      }, 500);
    }
  }, []);

  // Record a violation
  const handleViolation = useCallback(async (
    type: "TAB_SWITCH" | "FULLSCREEN_EXIT" | "PASTE",
    title: string,
    description: string,
    metadata?: any
  ) => {
    if (!enabled || isDisqualified) return;

    const now = Date.now();
    // Debounce duplicate violations within 1.5 seconds
    if (now - lastViolationTimeRef.current < 1500) {
      return;
    }
    lastViolationTimeRef.current = now;

    const violationEvent: ProctorViolationEvent = {
      type,
      title,
      description,
      timestamp: new Date()
    };
    setActiveViolation(violationEvent);
    setShowWarningModal(true);

    try {
      const res = await recordContestViolationServer({
        contestId,
        type,
        metadata
      });

      if (res.success) {
        if (typeof res.violationCount === "number") {
          setViolationCount(res.violationCount);
        }
        if (res.isDisqualified) {
          setIsDisqualified(true);
          setDisqualifiedReason(res.reason || "Disqualified for repeated violations");
          if (onDisqualified) {
            onDisqualified(res.reason || "Disqualified for repeated violations");
          }
        }
      }
    } catch (e) {
      console.error("Failed to log violation to server:", e);
    }
  }, [contestId, enabled, isDisqualified, onDisqualified]);

  // 1. Fullscreen Change Listener
  useEffect(() => {
    if (!enabled || !requireFullScreen || isDisqualified) return;

    const onFullscreenChange = () => {
      const currentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(currentlyFullscreen);

      if (!currentlyFullscreen && !isEnablingFullscreenRef.current) {
        handleViolation(
          "FULLSCREEN_EXIT",
          "Fullscreen Mode Exited",
          "You exited the required fullscreen environment. Fullscreen is mandatory for this assessment.",
          { detail: "document.fullscreenElement was cleared" }
        );
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled, requireFullScreen, isDisqualified, handleViolation]);

  // 2. Tab Switch & Window Blur Listeners
  useEffect(() => {
    if (!enabled || !detectTabSwitch || isDisqualified) return;

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleViolation(
          "TAB_SWITCH",
          "Tab Switch Detected",
          "You switched away from the contest tab or minimized your browser.",
          { detail: "document.visibilityState changed to hidden" }
        );
      }
    };

    const onWindowBlur = () => {
      // Blur can fire when clicking native elements or switching windows (Alt+Tab)
      if (document.visibilityState === "visible" && !isEnablingFullscreenRef.current) {
        handleViolation(
          "TAB_SWITCH",
          "Window Focus Lost",
          "Your browser lost focus. Switching windows or applications during the contest is prohibited.",
          { detail: "window blur event fired" }
        );
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [enabled, detectTabSwitch, isDisqualified, handleViolation]);

  // 3. Strict Copy/Paste and Context Menu Blocking
  useEffect(() => {
    if (!enabled || !detectCopyPaste || isDisqualified) return;

    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Pasting code is disabled in this contest.", { duration: 2500 });
    };

    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Copying from the test arena is disabled.", { duration: 2500 });
    };

    const onCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.error("Cutting code is disabled.", { duration: 2500 });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Block Ctrl+V / Cmd+V
      if (modKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Pasting code is disabled in this contest.", { duration: 2000 });
        return;
      }

      // Block Ctrl+C / Cmd+C
      if (modKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Copying code is disabled in this contest.", { duration: 2000 });
        return;
      }

      // Block F11 (native fullscreen) to prevent browser unhooks
      if (e.key === "F11") {
        e.preventDefault();
        return;
      }

      // Block F12 and Ctrl+Shift+I / Cmd+Opt+I (Developer Tools)
      if (
        e.key === "F12" ||
        (modKey && e.shiftKey && (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "j"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast.error("Developer Tools are restricted during assessment.", { duration: 3000 });
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("paste", onPaste, true);
    window.addEventListener("copy", onCopy, true);
    window.addEventListener("cut", onCut, true);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("contextmenu", onContextMenu, true);

    return () => {
      window.removeEventListener("paste", onPaste, true);
      window.removeEventListener("copy", onCopy, true);
      window.removeEventListener("cut", onCut, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, [enabled, detectCopyPaste, isDisqualified, handleViolation]);

  return {
    isFullscreen,
    violationCount,
    isDisqualified,
    disqualifiedReason,
    activeViolation,
    showWarningModal,
    setShowWarningModal,
    enterFullscreen
  };
}
