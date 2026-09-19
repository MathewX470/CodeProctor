/**
 * Initial Heuristic Baseline Parameters for CV & Multi-Signal Proctoring.
 * 
 * NOTE: These are empirical defaults intended to be tuned across different
 * webcams, laptop angles, lighting conditions, and glasses.
 */
export const CV_DEFAULT_THRESHOLDS = {
  // Inference Timing & Throttling
  targetInferenceIntervalMs: 80,       // ~12.5 FPS (reduces CPU usage compared to 30 FPS)
  luminanceCheckIntervalMs: 250,       // 4 FPS for camera blockage check

  // Temporal Debounce Thresholds (continuous duration required before emitting event)
  noFaceMinDurationMs: 4500,           // 4.5s of zero faces before NO_FACE
  multipleFacesMinDurationMs: 2000,    // 2.0s of 2+ faces before MULTIPLE_FACES
  lookingAwayMinDurationMs: 4000,      // 4.0s of deviated gaze before LOOKING_AWAY
  cameraBlockedMinDurationMs: 3000,    // 3.0s of covered/dark frame before CAMERA_BLOCKED
  cameraDisconnectGracePeriodMs: 5000, // 5.0s grace period for hardware reconnect

  // Angular Head Pose & Gaze Limits (degrees deviation from candidate's calibrated center)
  yawDeviationDeg: 28,                 // Left/Right gaze limit
  pitchDownDeviationDeg: 25,           // Downward pitch limit (e.g. lap/phone)
  pitchUpDeviationDeg: 25,             // Upward pitch limit

  // Luminance & Lens Blockage Thresholds (0 - 255 grayscale)
  blockedMeanLuminanceMax: 16,         // Below this mean luminance is pitch black
  blockedStdDevMax: 5,                 // Very low variation indicates solid tape/paper/finger over lens

  // Snapshot Capture Constraints
  minCooldownBetweenSnapshotsMs: 8000, // Throttles snapshot uploads (max 1 per 8s per participant)
  snapshotQuality: 0.65,               // JPEG compression ratio
  snapshotWidth: 320,
  snapshotHeight: 240,
};

export type CVThresholds = typeof CV_DEFAULT_THRESHOLDS;
