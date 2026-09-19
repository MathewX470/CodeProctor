"use client";

import React, { useState } from "react";
import { 
  Camera, Eye, Users, AlertTriangle, Minimize2, Maximize2, 
  RefreshCw, CheckCircle2, ShieldAlert 
} from "lucide-react";
import { CVProctorStatus } from "@/hooks/useComputerVisionProctor";

interface WebcamHUDProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CVProctorStatus;
  faceCount: number;
  yaw: number;
  pitch: number;
  isCameraReady: boolean;
  onRecalibrate: () => void;
}

export function WebcamHUD({
  videoRef,
  status,
  faceCount,
  yaw,
  pitch,
  isCameraReady,
  onRecalibrate,
}: WebcamHUDProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  const getStatusConfig = () => {
    switch (status) {
      case "NORMAL":
        return {
          label: "Face Aligned",
          color: "text-green-500",
          bg: "bg-green-500/10",
          border: "border-green-500/30",
          badgeBg: "bg-green-500/20 text-green-400 border-green-500/40",
          icon: CheckCircle2,
        };
      case "LOOKING_AWAY":
        return {
          label: "Gaze Shifted",
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/40",
          badgeBg: "bg-amber-500/20 text-amber-400 border-amber-500/40",
          icon: Eye,
        };
      case "NO_FACE":
        return {
          label: "Face Not In Frame",
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/40",
          badgeBg: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: AlertTriangle,
        };
      case "MULTIPLE_FACES":
        return {
          label: `${faceCount} Faces Detected`,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/40",
          badgeBg: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: Users,
        };
      case "CAMERA_BLOCKED":
        return {
          label: "Lens Blocked / Dark",
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/40",
          badgeBg: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: ShieldAlert,
        };
      case "CAMERA_DISCONNECTED":
        return {
          label: "Camera Disconnected",
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/40",
          badgeBg: "bg-red-500/20 text-red-400 border-red-500/40",
          icon: Camera,
        };
      default:
        return {
          label: "Calibrating Camera...",
          color: "text-blue-500",
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          icon: RefreshCw,
        };
    }
  };

  const cfg = getStatusConfig();
  const Icon = cfg.icon;

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border ${cfg.border} shadow-xl cursor-pointer hover:scale-105 transition-all animate-in fade-in duration-150`}
        title="Click to expand camera monitor"
      >
        <span className={`w-2 h-2 rounded-full ${cfg.bg} ${cfg.color} animate-pulse`} />
        <span className="text-[11px] font-bold text-white tracking-wide">{cfg.label}</span>
        <Maximize2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-40 w-48 sm:w-56 bg-slate-900/95 backdrop-blur-md rounded-2xl border ${cfg.border} shadow-2xl p-2 text-white animate-in zoom-in-95 duration-150 select-none`}>
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-1.5 py-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 truncate max-w-[120px]">
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRecalibrate}
            title="Recalibrate Center Gaze"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize to Pill"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mirrored Live Video Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] border border-slate-800 flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />

        {!isCameraReady && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
            <Camera className="w-5 h-5 animate-pulse text-blue-400" />
            <span>Connecting...</span>
          </div>
        )}

        {/* Live Status Overlay Tag */}
        <div className="absolute bottom-1.5 left-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${cfg.badgeBg}`}>
            {faceCount} {faceCount === 1 ? "FACE" : "FACES"}
          </span>
        </div>
      </div>
    </div>
  );
}
