import { describe, it, expect } from 'vitest';
import { computeWellnessSignals } from './wellnessMetrics';
import { evaluateWellness } from './wellnessScoring';
import { SustainedWellnessTracker } from './sustainedWellnessTracker';
import { DEFAULT_WELLNESS_THRESHOLDS } from './thresholds';

describe('computeWellnessSignals', () => {
  it('averages left/right blendshapes', () => {
    const signals = computeWellnessSignals({
      mouthSmileLeft: 0.6,
      mouthSmileRight: 0.4,
      jawOpen: 0.1,
    });
    expect(signals.happy).toBeCloseTo(0.5);
    expect(signals.sad).toBe(0);
    expect(signals.yawning).toBeCloseTo(0.1);
  });

  it('treats missing keys as zero', () => {
    const signals = computeWellnessSignals({});
    expect(signals).toEqual({ happy: 0, sad: 0, tiredEyes: 0, yawning: 0 });
  });
});

describe('evaluateWellness', () => {
  it('returns all-null for a missing face', () => {
    expect(evaluateWellness(null, DEFAULT_WELLNESS_THRESHOLDS)).toEqual({
      happy: null,
      sad: null,
      tiredEyes: null,
      yawning: null,
    });
  });

  it('flags happy above threshold', () => {
    const signals = { happy: 0.9, sad: 0, tiredEyes: 0, yawning: 0 };
    const result = evaluateWellness(signals, DEFAULT_WELLNESS_THRESHOLDS);
    expect(result.happy).toBe(true);
    expect(result.sad).toBe(false);
  });
});

describe('SustainedWellnessTracker', () => {
  it('does not flag a single blink as tired eyes', () => {
    const tracker = new SustainedWellnessTracker(DEFAULT_WELLNESS_THRESHOLDS.sustainMs, 500);
    // A normal blink: high for one frame, then gone within ~250ms.
    tracker.update({ happy: false, sad: false, tiredEyes: true, yawning: false }, 0);
    const afterBlink = tracker.update({ happy: false, sad: false, tiredEyes: false, yawning: false }, 250);
    expect(afterBlink.tiredEyes).toBe(false);
  });

  it('flags tired eyes once sustained past the threshold', () => {
    const tracker = new SustainedWellnessTracker(DEFAULT_WELLNESS_THRESHOLDS.sustainMs, 500);
    tracker.update({ happy: false, sad: false, tiredEyes: true, yawning: false }, 0);
    const still = tracker.update({ happy: false, sad: false, tiredEyes: true, yawning: false }, 1000);
    expect(still.tiredEyes).toBe(false); // tiredEyes sustainMs is 2000
    const after = tracker.update({ happy: false, sad: false, tiredEyes: true, yawning: false }, 2000);
    expect(after.tiredEyes).toBe(true);
  });

  it('flags happy faster than tiredEyes since its sustainMs is shorter', () => {
    const tracker = new SustainedWellnessTracker(DEFAULT_WELLNESS_THRESHOLDS.sustainMs, 500);
    tracker.update({ happy: true, sad: false, tiredEyes: false, yawning: false }, 0);
    const after = tracker.update({ happy: true, sad: false, tiredEyes: false, yawning: false }, 800);
    expect(after.happy).toBe(true);
  });
});
