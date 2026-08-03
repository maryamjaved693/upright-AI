import type { WellnessIndicators } from './wellnessScoring';
import type { WellnessThresholds } from './thresholds';

type WellnessKey = keyof WellnessIndicators;

interface KeyState {
  badSinceMs: number | null;
  goodSinceMs: number | null;
  active: boolean;
}

const KEYS: WellnessKey[] = ['happy', 'sad', 'tiredEyes', 'yawning'];

// Same hysteresis pattern as SustainedAlertTracker (posture), but each
// key gets its own sustain duration (see thresholds.ts) since a blink
// and a genuine tired-eyes signal need very different debounce windows.
export class SustainedWellnessTracker {
  state: Record<WellnessKey, KeyState> = {
    happy: { badSinceMs: null, goodSinceMs: null, active: false },
    sad: { badSinceMs: null, goodSinceMs: null, active: false },
    tiredEyes: { badSinceMs: null, goodSinceMs: null, active: false },
    yawning: { badSinceMs: null, goodSinceMs: null, active: false },
  };
  sustainMs: WellnessThresholds['sustainMs'];
  recoveryMs: number;

  constructor(sustainMs: WellnessThresholds['sustainMs'], recoveryMs: number) {
    this.sustainMs = sustainMs;
    this.recoveryMs = recoveryMs;
  }

  update(indicators: WellnessIndicators, timestampMs: number): Record<WellnessKey, boolean> {
    for (const key of KEYS) {
      const value = indicators[key];
      const s = this.state[key];
      if (value === null) continue; // unknown frame: freeze, don't reset

      if (value) {
        s.goodSinceMs = null;
        if (s.badSinceMs === null) s.badSinceMs = timestampMs;
        if (!s.active && timestampMs - s.badSinceMs >= this.sustainMs[key]) {
          s.active = true;
        }
      } else {
        s.badSinceMs = null;
        if (s.goodSinceMs === null) s.goodSinceMs = timestampMs;
        if (s.active && timestampMs - s.goodSinceMs >= this.recoveryMs) {
          s.active = false;
        }
      }
    }

    return {
      happy: this.state.happy.active,
      sad: this.state.sad.active,
      tiredEyes: this.state.tiredEyes.active,
      yawning: this.state.yawning.active,
    };
  }

  reset(): void {
    for (const key of KEYS) {
      this.state[key] = { badSinceMs: null, goodSinceMs: null, active: false };
    }
  }
}
