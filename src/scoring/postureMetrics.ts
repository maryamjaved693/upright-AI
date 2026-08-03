import type { Landmark } from '../pose/types';
import { POSE_LANDMARKS } from '../pose/types';

// Raw scalar metrics derived from a single frame's landmarks, all
// normalized by shoulder width. That normalization is what lets these
// use fixed thresholds without a per-user calibration step: shoulder
// width scales with both camera distance AND body size, so dividing by
// it cancels out most of that variance, leaving mostly posture-driven
// signal. (MediaPipe's landmark z-depth was tried for the neck signal
// initially but is too noisy in the lite pose model on a single 2D
// webcam to threshold reliably — 2D geometry is more robust here.)
export interface RawMetrics {
  /** (shoulderMidY - earMidY) / shoulderWidth. Shrinks as the head drops forward/down toward the shoulders. */
  neckDropRatio: number;
  /** (hipMidY - shoulderMidY) / shoulderWidth. Shrinks as the torso compresses/rounds forward. Null if hips aren't in frame (common with laptop webcams). */
  torsoRatio: number | null;
  /** Shoulder width as a fraction of frame width. Grows as the person moves closer to the camera. */
  shoulderWidthNorm: number;
  /**
   * (rightPointY - leftPointY) / shoulderWidth, using the ear line (or
   * eye line as fallback). Positive = the right side is lower (leaning
   * right, using MediaPipe's subject-relative left/right — unaffected
   * by the mirrored CSS preview, since that only flips the x-axis for
   * display and this metric only uses y). Negative = leaning left.
   * Null if neither ears nor eyes are confidently visible.
   */
  lateralLeanRatio: number | null;
}

const MIN_VISIBILITY = 0.5;
// Hips need a stricter bar: when they're out of frame (common with a
// laptop webcam mounted close to the face), MediaPipe still emits a
// guessed position rather than omitting the landmark, and that guess
// can score above 0.5 confidence despite being garbage. A higher bar
// plus the below-shoulders sanity check filters most of that out.
const MIN_HIP_VISIBILITY = 0.7;
// Shoulders are load-bearing for every metric (neck drop, torso, "too
// close" all key off shoulder position/width), so they get the same
// stricter bar as hips: a hand or other object blocking the camera can
// make MediaPipe emit a guessed shoulder pose that still clears 0.5
// confidence, and a guessed pose tends to read as artificially narrow
// (shoulderWidthNorm shrinks), which falsely clears a real "too close"
// alert almost immediately (recoveryMs is short by design).
const MIN_SHOULDER_VISIBILITY = 0.7;

function isVisible(lm: Landmark | undefined, minVisibility = MIN_VISIBILITY): lm is Landmark {
  return !!lm && (lm.visibility ?? 1) >= minVisibility;
}

function midpoint(a: Landmark, b: Landmark) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// Returns null if the landmarks required for scoring aren't confidently
// visible (e.g. user turned away, poor lighting) — callers should treat
// null as "unknown this frame", not as bad posture.
export function computeRawMetrics(landmarks: Landmark[]): RawMetrics | null {
  const nose = landmarks[POSE_LANDMARKS.NOSE];
  const leftEar = landmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = landmarks[POSE_LANDMARKS.RIGHT_EAR];
  const leftEye = landmarks[POSE_LANDMARKS.LEFT_EYE];
  const rightEye = landmarks[POSE_LANDMARKS.RIGHT_EYE];
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER];
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER];
  const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP];
  const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP];

  if (!isVisible(leftShoulder, MIN_SHOULDER_VISIBILITY) || !isVisible(rightShoulder, MIN_SHOULDER_VISIBILITY)) {
    return null;
  }

  // Ears are frequently occluded by hair/angle; fall back to the nose
  // (offset slightly less reliable but keeps the metric available).
  const earMid =
    isVisible(leftEar) && isVisible(rightEar)
      ? midpoint(leftEar, rightEar)
      : isVisible(nose)
        ? nose
        : null;
  if (!earMid) return null;

  const shoulderMid = midpoint(leftShoulder, rightShoulder);
  const shoulderWidth = Math.hypot(
    leftShoulder.x - rightShoulder.x,
    leftShoulder.y - rightShoulder.y,
  );
  if (shoulderWidth < 1e-6) return null; // degenerate frame, avoid divide-by-zero

  const hipsVisible =
    isVisible(leftHip, MIN_HIP_VISIBILITY) && isVisible(rightHip, MIN_HIP_VISIBILITY);
  const hipMid = hipsVisible ? midpoint(leftHip, rightHip) : null;
  // Hips must be physically below the shoulders in the image; if not,
  // the "visible" landmark is an extrapolated guess, not a real position.
  const torsoRatio = hipMid && hipMid.y > shoulderMid.y ? (hipMid.y - shoulderMid.y) / shoulderWidth : null;

  // Prefer the ear line (wider baseline = more accurate angle); fall
  // back to the eye line, which is almost always visible whenever the
  // face is, even when ears are hidden by hair or a side angle.
  let lateralLeanRatio: number | null = null;
  if (isVisible(leftEar) && isVisible(rightEar)) {
    lateralLeanRatio = (rightEar.y - leftEar.y) / shoulderWidth;
  } else if (isVisible(leftEye) && isVisible(rightEye)) {
    lateralLeanRatio = (rightEye.y - leftEye.y) / shoulderWidth;
  }

  return {
    neckDropRatio: (shoulderMid.y - earMid.y) / shoulderWidth,
    torsoRatio,
    shoulderWidthNorm: shoulderWidth,
    lateralLeanRatio,
  };
}
