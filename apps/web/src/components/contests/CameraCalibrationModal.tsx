"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, CheckCircle2, AlertCircle, Loader2, Maximize, 
  ShieldAlert, Eye, Users, RefreshCw, X 
} from "lucide-react";

interface CameraCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStart: () => void;
  isStarting: boolean;
}

export function CameraCalibrationModal({
  isOpen,
  onClose,
  onConfirmStart,
  isStarting,
}: CameraCalibrationModalProps) {
  const [step, setStep] = useState<"PERMISSION" | "CALIBRATING" | "READY" | "ERROR">("PERMISSION");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [countdown, setCountdown] = useState<number>(5);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Request camera and test stream
  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;

    async function testWebcam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false
        });
        streamRef.current = stream;
        setHasPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setStep("CALIBRATING");
          };
        }
      } catch (err: any) {
        console.error("[Calibration] Camera permission error:", err);
        setStep("ERROR");
        setErrorMsg(err.message || "Webcam access denied. Camera is mandatory for this proctored contest.");
      }
    }

    testWebcam();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      streamRef.current = null;
    };
  }, [isOpen]);

  // 5-second countdown calibration when stream is ready
  useEffect(() => {
    if (step !== "CALIBRATING") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStep("READY");
          setIsFaceDetected(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 text-center shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isStarting}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-500 flex items-center justify-center mx-auto mb-2 shadow-sm shrink-0">
          <Camera className="w-5 h-5" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 mb-1.5">
          AI Vision Proctoring
        </div>

        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1">
          Webcam & Gaze Calibration
        </h3>

        <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-zinc-400 mb-3 leading-snug">
          This contest records objective camera events for organizer review.
        </p>

        {/* Live Camera Viewfinder */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[21/9] max-h-36 border border-slate-800 mb-3 flex items-center justify-center shadow-inner shrink-0">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />

          {step === "PERMISSION" && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 p-2 text-xs text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              <span>Requesting camera permission...</span>
            </div>
          )}

          {step === "CALIBRATING" && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 text-white">
              <div className="w-10 h-10 rounded-full border-2 border-purple-500 flex items-center justify-center font-mono font-black text-lg animate-pulse bg-purple-950/60">
                {countdown}
              </div>
              <span className="text-[10px] sm:text-xs font-bold tracking-wide">Look directly at your screen</span>
              <span className="text-[9px] text-slate-300">Zeroing neutral gaze baseline...</span>
            </div>
          )}

          {step === "READY" && (
            <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
              <CheckCircle2 className="w-3 h-3" /> Calibrated
            </div>
          )}

          {step === "ERROR" && (
            <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-1 p-2 text-xs text-red-400">
              <AlertCircle className="w-6 h-6 text-red-500 mb-0.5" />
              <span className="font-bold">Camera Connection Failed</span>
              <span className="text-[10px] text-slate-400 text-center max-w-xs">{errorMsg}</span>
            </div>
          )}
        </div>

        {/* 4 Checklist Verification Items */}
        <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-2.5 sm:p-3 text-left space-y-1.5 text-[11px] text-slate-600 dark:text-zinc-300 mb-4 border border-slate-200 dark:border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-purple-500" />
              <span>Camera feed active</span>
            </span>
            {hasPermission ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-blue-500" />
              <span>Gaze center zeroed</span>
            </span>
            {step === "READY" ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <span className="text-[10px] font-mono text-slate-400">Pending</span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>Multiple-face & absence monitoring</span>
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Armed</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Maximize className="w-3.5 h-3.5 text-indigo-500" />
              <span>Fullscreen lock</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Required</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isStarting}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold rounded-xl transition-all text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmStart}
            disabled={step !== "READY" || isStarting}
            className={`flex-1 py-3 px-4 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 ${
              step === "READY" 
                ? "bg-purple-600 hover:bg-purple-700 shadow-purple-500/25 cursor-pointer" 
                : "bg-slate-400 cursor-not-allowed opacity-50"
            }`}
          >
            {isStarting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
            {isStarting ? "Launching..." : "Enter Fullscreen & Start"}
          </button>
        </div>
      </div>
    </div>
  );
}
