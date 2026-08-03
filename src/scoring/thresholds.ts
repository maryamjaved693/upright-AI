// Fixed thresholds — no calibration step. See postureMetrics.ts for why
// shoulder-width normalization makes fixed thresholds workable here.
// These starting values are estimates for a laptop webcam at typical
// desk distance (~50-70cm) and WILL need tuning per setup — that's
// expected, not a bug, if an issue fires too eagerly or not at all.
export interface PostureThresholds {
  /** Below this, the head has dropped far enough toward the shoulders to count as forward-neck lean. */
  neckDropRatioMin: number;
  /** Below this, the torso has compressed enough to count as slouching. Only checked when hips are visible. */
  torsoRatioMin: number;
  /** Above this fraction of frame width, shoulders are wide enough to count as sitting too close. */
  shoulderWidthMax: number;
  /** Absolute value of lateralLeanRatio above this counts as leaning left/right. */
  lateralLeanRatioMin: number;
  /** How long a posture issue must be continuously flagged before it's a sustained alert. */
  sustainMs: number;
  /** How long good posture must be continuously held before an active alert clears. */
  recoveryMs: number;
}

export const DEFAULT_THRESHOLDS: PostureThresholds = {
  neckDropRatioMin: 0.45,
  torsoRatioMin: 1.0,
  shoulderWidthMax: 0.45,
  lateralLeanRatioMin: 0.15,
  sustainMs: 4000,
  recoveryMs: 1000,
};
