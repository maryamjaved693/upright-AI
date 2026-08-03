import type { OverallStatus } from '../scoring/sustainedAlertTracker';

// Pure decision logic for "should we beep right now", kept separate from
// the actual Web Audio playback so it's unit-testable without a browser
// audio stack. Fires once immediately on the good->bad transition, then
// re-fires every retriggerMs while status remains bad.
export class AlertCadence {
  wasBad = false;
  lastPlayedMs: number | null = null;
  retriggerMs: number;

  constructor(retriggerMs: number = 20000) {
    this.retriggerMs = retriggerMs;
  }

  notify(overall: OverallStatus, timestampMs: number): boolean {
    if (overall !== 'bad') {
      this.wasBad = false;
      return false;
    }

    if (!this.wasBad) {
      this.wasBad = true;
      this.lastPlayedMs = timestampMs;
      return true;
    }

    if (this.lastPlayedMs === null || timestampMs - this.lastPlayedMs >= this.retriggerMs) {
      this.lastPlayedMs = timestampMs;
      return true;
    }

    return false;
  }

  reset(): void {
    this.wasBad = false;
    this.lastPlayedMs = null;
  }
}
