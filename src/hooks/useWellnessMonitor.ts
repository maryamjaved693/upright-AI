import { useCallback, useRef, useState } from 'react';
import type { FaceFrame } from '../face/types';
import { computeWellnessSignals } from '../wellness/wellnessMetrics';
import { evaluateWellness } from '../wellness/wellnessScoring';
import { SustainedWellnessTracker } from '../wellness/sustainedWellnessTracker';
import { DEFAULT_WELLNESS_THRESHOLDS, type WellnessThresholds } from '../wellness/thresholds';

const IDLE_INDICATORS = { happy: false, sad: false, tiredEyes: false, yawning: false };

function equal(a: typeof IDLE_INDICATORS, b: typeof IDLE_INDICATORS): boolean {
  return a.happy === b.happy && a.sad === b.sad && a.tiredEyes === b.tiredEyes && a.yawning === b.yawning;
}

// No calibration step here (unlike posture) — blendshape activation
// scores are already normalized 0..1 and reasonably consistent across
// different faces, so fixed thresholds are a reasonable v1 approach.
export function useWellnessMonitor(thresholds: WellnessThresholds = DEFAULT_WELLNESS_THRESHOLDS) {
  const [indicators, setIndicators] = useState<typeof IDLE_INDICATORS>(IDLE_INDICATORS);
  const trackerRef = useRef(new SustainedWellnessTracker(thresholds.sustainMs, thresholds.recoveryMs));

  const handleFace = useCallback(
    (frame: FaceFrame) => {
      const signals = computeWellnessSignals(frame.blendshapes);
      const raw = evaluateWellness(signals, thresholds);
      const active = trackerRef.current.update(raw, frame.timestampMs);
      setIndicators((prev) => (equal(prev, active) ? prev : active));
    },
    [thresholds],
  );

  return { indicators, handleFace };
}
