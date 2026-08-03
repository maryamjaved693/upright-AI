// Shared pose types used across the pose-detection pipeline and the
// (separately testable) scoring module. Kept dependency-free so the
// scoring module never needs to import React or MediaPipe types directly.

export interface Landmark {
  x: number; // normalized [0,1] relative to image width
  y: number; // normalized [0,1] relative to image height
  z: number; // normalized depth, roughly relative to hip midpoint
  visibility?: number; // 0..1 confidence this landmark is visible
}

// Indices match MediaPipe Pose's 33-point landmark model.
// https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE: 2,
  RIGHT_EYE: 5,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
} as const;

// One frame's worth of pose data, timestamped so downstream consumers
// (scoring, break timer) can reason about elapsed time and frame rate.
export interface PoseFrame {
  landmarks: Landmark[];
  timestampMs: number;
}

export type PoseFrameListener = (frame: PoseFrame) => void;
