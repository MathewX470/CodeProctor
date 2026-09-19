"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { recordContestViolationServer } from "@/app/actions/contests";
import { CV_DEFAULT_THRESHOLDS } from "@/lib/proctoring/cvThresholds";
import { enqueueOfflineEvent, flushOfflineQueue } from "@/lib/proctoring/offlineQueue";

// Suppress benign MediaPipe / TensorFlow Lite WASM info/warning logs that trigger Next.js error overlays
if (typeof window !== "undefined" && !(window as any).__mediapipe_logs_filtered) {
  (window as any).__mediapipe_logs_filtered = true;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  const isBenignWasmLog = (args: any[]) => {
    const text = args.map(a => (typeof a === "string" ? a : (a?.message || ""))).join(" ");
    return (
      text.includes("INFO: Created TensorFlow Lite") ||
      text.includes("XNNPACK delegate") ||
      text.includes("FaceBlendshapesGraph acceleration") ||
      text.includes("OpenGL error checking")
    );
  };

  console.error = (...args: any[]) => {
    if (isBenignWasmLog(args)) {
      console.info(...args);
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: any[]) => {
    if (isBenignWasmLog(args)) {
      console.info(...args);
      return;
    }
    originalConsoleWarn(...args);
  };
}

export type CVProctorStatus = 
  | "INITIALIZING" 
  | "CALIBRATING" 
  | "NORMAL" 
  | "LOOKING_AWAY" 
  | "NO_FACE" 
  | "MULTIPLE_FACES" 
  | "CAMERA_BLOCKED" 
  | "CAMERA_DISCONNECTED"
  | "ERROR";

export interface CVViolationPayload {
  type: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "CAMERA_BLOCKED" | "CAMERA_DISCONNECTED";
  durationSec: number;
  confidence: number;
  snapshotBase64?: string;
  metadata?: any;
}

interface UseComputerVisionProctorOptions {
  contestId: string;
  enabled: boolean;
  onViolation?: (violation: CVViolationPayload) => void;
  onStatusChange?: (status: CVProctorStatus) => void;
}

export function useComputerVisionProctor({
  contestId,
  enabled,
  onViolation,
  onStatusChange,
}: UseComputerVisionProctorOptions) {
  const [status, setStatus] = useState<CVProctorStatus>("INITIALIZING");
  const [faceCount, setFaceCount] = useState<number>(0);
  const [yaw, setYaw] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Calibration baseline
  const baselineYawRef = useRef<number>(0);
  const baselinePitchRef = useRef<number>(0);
  const isCalibratedRef = useRef<boolean>(false);

  // Duration timers
  const noFaceStartTimeRef = useRef<number | null>(null);
  const multiFaceStartTimeRef = useRef<number | null>(null);
  const lookingAwayStartTimeRef = useRef<number | null>(null);
  const blockedStartTimeRef = useRef<number | null>(null);
  const disconnectStartTimeRef = useRef<number | null>(null);

  // Snapshot cooldown
  const lastSnapshotTimeRef = useRef<number>(0);
  const lastInferenceTimeRef = useRef<number>(0);
  const lastLuminanceCheckTimeRef = useRef<number>(0);

  // Helper to capture a compressed JPEG thumbnail (320x240)
  const captureSnapshot = useCallback((): string | undefined => {
    if (!videoRef.current || videoRef.current.readyState < 2) return undefined;
    const now = Date.now();
    if (now - lastSnapshotTimeRef.current < CV_DEFAULT_THRESHOLDS.minCooldownBetweenSnapshotsMs) {
      return undefined;
    }
    lastSnapshotTimeRef.current = now;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = CV_DEFAULT_THRESHOLDS.snapshotWidth;
      canvas.height = CV_DEFAULT_THRESHOLDS.snapshotHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", CV_DEFAULT_THRESHOLDS.snapshotQuality);
    } catch {
      return undefined;
    }
  }, []);

  // Helper to dispatch violation to server or offline queue
  const emitViolation = useCallback(async (
    type: "NO_FACE" | "MULTIPLE_FACES" | "LOOKING_AWAY" | "CAMERA_BLOCKED" | "CAMERA_DISCONNECTED",
    durationSec: number,
    confidence: number,
    metadata?: any
  ) => {
    const snapshotBase64 = captureSnapshot();
    const payload: CVViolationPayload = {
      type,
      durationSec: Math.round(durationSec * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      snapshotBase64,
      metadata
    };

    if (onViolation) {
      onViolation(payload);
    }

    if (navigator.onLine) {
      try {
        await recordContestViolationServer({
          contestId,
          type,
          durationSec: payload.durationSec,
          confidence: payload.confidence,
          snapshotBase64: payload.snapshotBase64,
          metadata: payload.metadata
        });
      } catch (err) {
        console.warn("[CV Proctor] Failed to send violation, saving to offline queue:", err);
        enqueueOfflineEvent({
          contestId,
          type,
          durationSec: payload.durationSec,
          confidence: payload.confidence,
          snapshotBase64: payload.snapshotBase64,
          startedAt: new Date().toISOString(),
          metadata: payload.metadata
        });
      }
    } else {
      enqueueOfflineEvent({
        contestId,
        type,
        durationSec: payload.durationSec,
        confidence: payload.confidence,
        snapshotBase64: payload.snapshotBase64,
        startedAt: new Date().toISOString(),
        metadata: payload.metadata
      });
    }
  }, [contestId, captureSnapshot, onViolation]);

  // Set up online event listener to drain offline queue
  useEffect(() => {
    const handleOnline = () => {
      flushOfflineQueue(async (ev) => {
        const res = await recordContestViolationServer({
          contestId: ev.contestId,
          type: ev.type as any,
          durationSec: ev.durationSec,
          confidence: ev.confidence,
          snapshotBase64: ev.snapshotBase64,
          metadata: ev.metadata
        });
        return res.success;
      });
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Calculate mean luminance and standard deviation to detect blocked/taped lens
  const checkLuminance = useCallback((): { isBlocked: boolean; meanLuminance: number } => {
    if (!videoRef.current || videoRef.current.readyState < 2) {
      return { isBlocked: false, meanLuminance: 100 };
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 48;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return { isBlocked: false, meanLuminance: 100 };

      ctx.drawImage(videoRef.current, 0, 0, 64, 48);
      const imgData = ctx.getImageData(0, 0, 64, 48).data;
      
      let sum = 0;
      let count = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        // ITU-R BT.601 luma formula
        const luma = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        sum += luma;
        count++;
      }
      const meanLuminance = sum / count;

      // Variance check
      let varianceSum = 0;
      for (let i = 0; i < imgData.length; i += 4) {
        const luma = 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
        varianceSum += (luma - meanLuminance) * (luma - meanLuminance);
      }
      const stdDev = Math.sqrt(varianceSum / count);

      const isBlocked = 
        meanLuminance <= CV_DEFAULT_THRESHOLDS.blockedMeanLuminanceMax || 
        (stdDev <= CV_DEFAULT_THRESHOLDS.blockedStdDevMax && meanLuminance < 40);

      return { isBlocked, meanLuminance };
    } catch {
      return { isBlocked: false, meanLuminance: 100 };
    }
  }, []);

  // Initialize MediaPipe FaceLandmarker
  useEffect(() => {
    if (!enabled) return;
    let isCancelled = false;

    async function initVision() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        if (isCancelled) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numFaces: 2,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: false
        });

        if (!isCancelled) {
          landmarkerRef.current = landmarker;
          setStatus("CALIBRATING");
        }
      } catch (err) {
        console.error("[CV Proctor] Failed to load MediaPipe FaceLandmarker:", err);
        if (!isCancelled) setStatus("ERROR");
      }
    }

    initVision();
    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        try { landmarkerRef.current.close(); } catch {}
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  // Initialize Webcam MediaStream
  useEffect(() => {
    if (!enabled) return;
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
            frameRate: { ideal: 30 }
          },
          audio: false
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            setIsCameraReady(true);
          };
        }

        // Hardware disconnection tracking
        const track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            handleCameraDisconnection();
          };
        }
      } catch (err: any) {
        console.error("[CV Proctor] Camera access denied or failed:", err);
        setStatus("CAMERA_DISCONNECTED");
      }
    }

    function handleCameraDisconnection() {
      disconnectStartTimeRef.current = Date.now();
      // 5-second grace period before emitting violation
      setTimeout(() => {
        if (streamRef.current && !streamRef.current.getVideoTracks()[0]?.readyState.includes("live")) {
          emitViolation("CAMERA_DISCONNECTED", 5.0, 1.0, { detail: "Webcam track ended" });
          setStatus("CAMERA_DISCONNECTED");
        }
      }, CV_DEFAULT_THRESHOLDS.cameraDisconnectGracePeriodMs);
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      streamRef.current = null;
      setIsCameraReady(false);
    };
  }, [enabled, emitViolation]);

  // Main 12.5 FPS Throttled CV Inference Loop
  useEffect(() => {
    if (!enabled || !isCameraReady) return;
    let isActive = true;

    function processFrame(time: number) {
      if (!isActive) return;

      const now = Date.now();
      if (now - lastInferenceTimeRef.current >= CV_DEFAULT_THRESHOLDS.targetInferenceIntervalMs) {
        lastInferenceTimeRef.current = now;

        if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }

        if (videoRef.current && videoRef.current.readyState >= 2 && landmarkerRef.current) {
          try {
            // Periodic luminance check (every 250ms)
            if (now - lastLuminanceCheckTimeRef.current >= CV_DEFAULT_THRESHOLDS.luminanceCheckIntervalMs) {
              lastLuminanceCheckTimeRef.current = now;
              const { isBlocked, meanLuminance } = checkLuminance();
              if (isBlocked) {
                if (!blockedStartTimeRef.current) {
                  blockedStartTimeRef.current = now;
                } else if (now - blockedStartTimeRef.current >= CV_DEFAULT_THRESHOLDS.cameraBlockedMinDurationMs) {
                  const duration = (now - blockedStartTimeRef.current) / 1000;
                  emitViolation("CAMERA_BLOCKED", duration, 0.95, { meanLuminance });
                  setStatus("CAMERA_BLOCKED");
                  blockedStartTimeRef.current = now; // reset interval
                }
              } else {
                blockedStartTimeRef.current = null;
              }
            }

            // Run FaceLandmarker
            const results = landmarkerRef.current.detectForVideo(videoRef.current, now);
            const faces = results.faceLandmarks || [];
            const count = faces.length;
            setFaceCount(count);

            if (count === 0) {
              // Absence check (NO_FACE)
              if (!noFaceStartTimeRef.current) {
                noFaceStartTimeRef.current = now;
              } else if (now - noFaceStartTimeRef.current >= CV_DEFAULT_THRESHOLDS.noFaceMinDurationMs) {
                const duration = (now - noFaceStartTimeRef.current) / 1000;
                emitViolation("NO_FACE", duration, 0.90);
                setStatus("NO_FACE");
                noFaceStartTimeRef.current = now;
              }
            } else {
              noFaceStartTimeRef.current = null;

              if (count >= 2) {
                // Multiple faces check (MULTIPLE_FACES)
                if (!multiFaceStartTimeRef.current) {
                  multiFaceStartTimeRef.current = now;
                } else if (now - multiFaceStartTimeRef.current >= CV_DEFAULT_THRESHOLDS.multipleFacesMinDurationMs) {
                  const duration = (now - multiFaceStartTimeRef.current) / 1000;
                  emitViolation("MULTIPLE_FACES", duration, 0.94, { faceCount: count });
                  setStatus("MULTIPLE_FACES");
                  multiFaceStartTimeRef.current = now;
                }
              } else {
                multiFaceStartTimeRef.current = null;

                // Single face gaze & pose evaluation
                const landmarks = faces[0];
                const nose = landmarks[1];
                const leftEye = landmarks[33];
                const rightEye = landmarks[263];
                const chin = landmarks[152];

                if (nose && leftEye && rightEye && chin) {
                  const distL = Math.hypot(nose.x - leftEye.x, nose.y - leftEye.y);
                  const distR = Math.hypot(nose.x - rightEye.x, nose.y - rightEye.y);
                  const approxYaw = ((distR - distL) / (distR + distL)) * 90;
                  const approxPitch = (nose.y - (leftEye.y + rightEye.y) / 2) * 100;

                  setYaw(Math.round(approxYaw));
                  setPitch(Math.round(approxPitch));

                  // Calibrate baseline if not yet set
                  if (!isCalibratedRef.current) {
                    baselineYawRef.current = approxYaw;
                    baselinePitchRef.current = approxPitch;
                    isCalibratedRef.current = true;
                    setStatus("NORMAL");
                  }

                  const yawDelta = Math.abs(approxYaw - baselineYawRef.current);
                  const pitchDelta = approxPitch - baselinePitchRef.current;

                  const isLookingAway = 
                    yawDelta > CV_DEFAULT_THRESHOLDS.yawDeviationDeg || 
                    pitchDelta > CV_DEFAULT_THRESHOLDS.pitchDownDeviationDeg;

                  if (isLookingAway) {
                    if (!lookingAwayStartTimeRef.current) {
                      lookingAwayStartTimeRef.current = now;
                    } else if (now - lookingAwayStartTimeRef.current >= CV_DEFAULT_THRESHOLDS.lookingAwayMinDurationMs) {
                      const duration = (now - lookingAwayStartTimeRef.current) / 1000;
                      emitViolation("LOOKING_AWAY", duration, 0.82, { yaw: approxYaw, pitch: approxPitch });
                      setStatus("LOOKING_AWAY");
                      lookingAwayStartTimeRef.current = now;
                    }
                  } else {
                    lookingAwayStartTimeRef.current = null;
                    if (status !== "NORMAL") {
                      setStatus("NORMAL");
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error("[CV Proctor] Error during frame detection:", err);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isActive = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, isCameraReady, checkLuminance, emitViolation, status]);

  // Recalibrate center baseline
  const recalibrate = useCallback(() => {
    isCalibratedRef.current = false;
    setStatus("CALIBRATING");
  }, []);

  return {
    videoRef,
    status,
    faceCount,
    yaw,
    pitch,
    isCameraReady,
    recalibrate
  };
}
