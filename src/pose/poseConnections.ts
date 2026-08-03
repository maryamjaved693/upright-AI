// Bone connections for skeleton drawing (subset of the full 33-point
// MediaPipe graph — just enough to see posture-relevant limbs; the full
// hand/foot mesh adds visual noise without helping this use case).
export const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 23], [12, 24], // shoulder -> hip
  [23, 24], // hips
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [0, 11], [0, 12], // nose -> shoulders (neck approximation)
  [7, 0], [8, 0], // ears -> nose
];
