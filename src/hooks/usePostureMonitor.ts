import { useCallback, useRef, useState } from 'react';
import type { PoseFrame } from '../pose/types';
import { computeRawMetrics, type RawMetrics } from '../scoring/postureMetrics';
import { evaluateFrame } from '../scoring/postureScoring';
import { SustainedAlertTracker, type OverallStatus, type SustainResult } from '../scoring/sustainedAlertTracker';
import { DEFAULT_THRESHOLDS, type PostureThresholds } from '../scoring/thresholds';

export interface PostureMonitorState {
  overall: OverallStatus;
  alerting: SustainResult['alerting'];
}

const IDLE_ALERTING = {
  forwardNeck: false,
  slouching: false,
  tooClose: false,
  leaningLeft: false,
  leaningRight: false,
};

function alertingEqual(a: typeof IDLE_ALERTING, b: typeof IDLE_ALERTING): boolean {
  return (
    a.forwardNeck === b.forwardNeck &&
    a.slouching === b.slouching &&
    a.tooClose === b.tooClose &&
    a.leaningLeft === b.leaningLeft &&
    a.leaningRight === b.leaningRight
  );
}

// Real-time, no calibration step: every frame is scored directly
// against fixed, shoulder-width-normalized thresholds (see
// postureMetrics.ts / thresholds.ts for why that's workable without a
// per-user baseline).
export function usePostureMonitor(thresholds: PostureThresholds = DEFAULT_THRESHOLDS) {
  const [state, setState] = useState<PostureMonitorState>({
    overall: 'unknown',
    alerting: IDLE_ALERTING,
  });

  const trackerRef = useRef(new SustainedAlertTracker(thresholds));
  const overallRef = useRef<OverallStatus>('unknown');
  // Not React state — updated every frame for the debug panel to poll on
  // its own timer, so watching raw numbers doesn't force a re-render of
  // the whole app 30x/sec (same reasoning as overallRef/useAudioAlert).
  const metricsRef = useRef<RawMetrics | null>(null);

  const handleFrame = useCallback(
    (frame: PoseFrame) => {
      const metrics = computeRawMetrics(frame.landmarks);
      metricsRef.current = metrics;
      const issues = evaluateFrame(metrics, thresholds);
      const result = trackerRef.current.update(issues, frame.timestampMs);
      overallRef.current = result.overall;

      setState((prev) => {
        if (prev.overall === result.overall && alertingEqual(prev.alerting, result.alerting)) {
          return prev;
        }
        return { overall: result.overall, alerting: result.alerting };
      });
    },
    [thresholds],
  );

  return { ...state, overallRef, metricsRef, handleFrame };
}
