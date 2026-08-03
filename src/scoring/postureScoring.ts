import type { RawMetrics } from './postureMetrics';
import type { PostureThresholds } from './thresholds';

// Per-issue verdict for a single frame. `null` means "unknown" — either
// the whole frame had low-confidence landmarks, or (for slouching and
// lateral lean) the specific landmarks needed just aren't in the
// camera's field of view. The sustain tracker must not treat null as
// either good or bad.
export interface PostureIssues {
  forwardNeck: boolean | null;
  slouching: boolean | null;
  tooClose: boolean | null;
  leaningLeft: boolean | null;
  leaningRight: boolean | null;
}

export function evaluateFrame(
  current: RawMetrics | null,
  thresholds: PostureThresholds,
): PostureIssues {
  if (!current) {
    return { forwardNeck: null, slouching: null, tooClose: null, leaningLeft: null, leaningRight: null };
  }

  const forwardNeck = current.neckDropRatio < thresholds.neckDropRatioMin;
  const slouching = current.torsoRatio === null ? null : current.torsoRatio < thresholds.torsoRatioMin;
  const tooClose = current.shoulderWidthNorm > thresholds.shoulderWidthMax;

  let leaningLeft: boolean | null = null;
  let leaningRight: boolean | null = null;
  if (current.lateralLeanRatio !== null) {
    leaningRight = current.lateralLeanRatio > thresholds.lateralLeanRatioMin;
    leaningLeft = current.lateralLeanRatio < -thresholds.lateralLeanRatioMin;
  }

  return { forwardNeck, slouching, tooClose, leaningLeft, leaningRight };
}
