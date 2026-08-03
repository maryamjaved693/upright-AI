import type { WellnessSignals } from './wellnessMetrics';
import type { WellnessThresholds } from './thresholds';

export interface WellnessIndicators {
  happy: boolean | null;
  sad: boolean | null;
  tiredEyes: boolean | null;
  yawning: boolean | null;
}

export function evaluateWellness(
  signals: WellnessSignals | null,
  thresholds: WellnessThresholds,
): WellnessIndicators {
  if (!signals) {
    return { happy: null, sad: null, tiredEyes: null, yawning: null };
  }
  return {
    happy: signals.happy > thresholds.happyThreshold,
    sad: signals.sad > thresholds.sadThreshold,
    tiredEyes: signals.tiredEyes > thresholds.tiredEyesThreshold,
    yawning: signals.yawning > thresholds.yawningThreshold,
  };
}
