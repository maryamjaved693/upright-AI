import { describe, it, expect } from 'vitest';
import type { Landmark } from '../pose/types';
import { computeRawMetrics } from './postureMetrics';
import { evaluateFrame } from './postureScoring';
import { SustainedAlertTracker } from './sustainedAlertTracker';
import { DEFAULT_THRESHOLDS } from './thresholds';

// Builds a 33-point landmark array with sane defaults, overridable by
// index for the handful of points these tests care about.
function makeLandmarks(overrides: Record<number, Partial<Landmark>> = {}): Landmark[] {
  const base: Landmark = { x: 0.5, y: 0.5, z: 0, visibility: 1 };
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ ...base }));

  // A relaxed, upright seated pose as the default "good" shape.
  Object.assign(landmarks[0], { x: 0.5, y: 0.3, z: -0.05 }); // nose
  Object.assign(landmarks[2], { x: 0.47, y: 0.29, z: -0.03 }); // left eye
  Object.assign(landmarks[5], { x: 0.53, y: 0.29, z: -0.03 }); // right eye
  Object.assign(landmarks[7], { x: 0.46, y: 0.32, z: -0.02 }); // left ear
  Object.assign(landmarks[8], { x: 0.54, y: 0.32, z: -0.02 }); // right ear
  Object.assign(landmarks[11], { x: 0.4, y: 0.45, z: 0 }); // left shoulder
  Object.assign(landmarks[12], { x: 0.6, y: 0.45, z: 0 }); // right shoulder
  Object.assign(landmarks[23], { x: 0.42, y: 0.75, z: 0 }); // left hip
  Object.assign(landmarks[24], { x: 0.58, y: 0.75, z: 0 }); // right hip

  for (const [idx, partial] of Object.entries(overrides)) {
    Object.assign(landmarks[Number(idx)], partial);
  }
  return landmarks;
}

const NO_ISSUES = { forwardNeck: false, slouching: false, tooClose: false, leaningLeft: false, leaningRight: false };
const ALL_NULL = { forwardNeck: null, slouching: null, tooClose: null, leaningLeft: null, leaningRight: null };

describe('computeRawMetrics', () => {
  it('returns null when shoulders are not visible', () => {
    const landmarks = makeLandmarks({ 11: { visibility: 0.1 } });
    expect(computeRawMetrics(landmarks)).toBeNull();
  });

  it('returns null when shoulder visibility is low-confidence but above the general 0.5 bar (e.g. camera occlusion)', () => {
    // MediaPipe can emit a guessed shoulder pose scoring above the general
    // 0.5 landmark-visibility bar even when the camera view is blocked
    // (e.g. a hand in front of the lens) — shoulders need the same
    // stricter bar as hips so a guessed, artificially narrow pose doesn't
    // get scored as real and falsely clear a sustained alert.
    const landmarks = makeLandmarks({ 11: { visibility: 0.6 }, 12: { visibility: 0.6 } });
    expect(computeRawMetrics(landmarks)).toBeNull();
  });

  it('falls back to nose when ears are not visible', () => {
    const landmarks = makeLandmarks({ 7: { visibility: 0 }, 8: { visibility: 0 } });
    const metrics = computeRawMetrics(landmarks);
    expect(metrics).not.toBeNull();
  });

  it('computes a positive torsoRatio for an upright pose', () => {
    const metrics = computeRawMetrics(makeLandmarks());
    expect(metrics!.torsoRatio).toBeGreaterThan(0);
  });

  it('reports torsoRatio as null when hips are not visible (e.g. cropped webcam framing)', () => {
    const metrics = computeRawMetrics(makeLandmarks({ 23: { visibility: 0 }, 24: { visibility: 0 } }));
    expect(metrics).not.toBeNull();
    expect(metrics!.torsoRatio).toBeNull();
  });

  it('does not require hips to compute neck/shoulder-width metrics', () => {
    const metrics = computeRawMetrics(makeLandmarks({ 23: { visibility: 0 }, 24: { visibility: 0 } }));
    expect(metrics!.neckDropRatio).toBeGreaterThan(0);
    expect(metrics!.shoulderWidthNorm).toBeGreaterThan(0);
  });

  it('computes a near-zero lateralLeanRatio for a level head', () => {
    const metrics = computeRawMetrics(makeLandmarks());
    expect(Math.abs(metrics!.lateralLeanRatio!)).toBeLessThan(0.02);
  });

  it('falls back to the eye line when ears are not visible', () => {
    const metrics = computeRawMetrics(
      makeLandmarks({ 7: { visibility: 0 }, 8: { visibility: 0 }, 5: { y: 0.4 } }),
    );
    expect(metrics!.lateralLeanRatio).not.toBeNull();
    expect(metrics!.lateralLeanRatio!).toBeGreaterThan(0);
  });

  it('reports lateralLeanRatio as null when neither ears nor eyes are visible', () => {
    const metrics = computeRawMetrics(
      makeLandmarks({ 2: { visibility: 0 }, 5: { visibility: 0 }, 7: { visibility: 0 }, 8: { visibility: 0 } }),
    );
    expect(metrics).not.toBeNull();
    expect(metrics!.lateralLeanRatio).toBeNull();
  });
});

describe('evaluateFrame', () => {
  it('flags nothing for an upright, comfortably-distanced pose', () => {
    const current = computeRawMetrics(makeLandmarks())!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues).toEqual(NO_ISSUES);
  });

  it('flags forwardNeck when the head drops toward the shoulders', () => {
    // Shrink the ear-to-shoulder vertical gap so neckDropRatio falls below threshold.
    const current = computeRawMetrics(
      makeLandmarks({ 7: { y: 0.42 }, 8: { y: 0.42 } }),
    )!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.forwardNeck).toBe(true);
  });

  it('flags slouching when torso compresses', () => {
    const current = computeRawMetrics(
      makeLandmarks({ 11: { y: 0.68 }, 12: { y: 0.68 } }),
    )!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.slouching).toBe(true);
  });

  it('reports slouching as null (not false) when hips are out of frame', () => {
    const current = computeRawMetrics(makeLandmarks({ 23: { visibility: 0 }, 24: { visibility: 0 } }))!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.slouching).toBeNull();
  });

  it('flags tooClose when shoulder width grows', () => {
    const current = computeRawMetrics(
      makeLandmarks({ 11: { x: 0.2 }, 12: { x: 0.8 } }),
    )!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.tooClose).toBe(true);
  });

  it('flags leaningRight when the right ear drops relative to the left', () => {
    // rightEar.y > leftEar.y => positive lateralLeanRatio => leaning right.
    const current = computeRawMetrics(makeLandmarks({ 8: { y: 0.44 } }))!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.leaningRight).toBe(true);
    expect(issues.leaningLeft).toBe(false);
  });

  it('flags leaningLeft when the left ear drops relative to the right', () => {
    const current = computeRawMetrics(makeLandmarks({ 7: { y: 0.44 } }))!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.leaningLeft).toBe(true);
    expect(issues.leaningRight).toBe(false);
  });

  it('reports leaningLeft/leaningRight as null when no ear/eye pair is visible', () => {
    const current = computeRawMetrics(
      makeLandmarks({ 2: { visibility: 0 }, 5: { visibility: 0 }, 7: { visibility: 0 }, 8: { visibility: 0 } }),
    )!;
    const issues = evaluateFrame(current, DEFAULT_THRESHOLDS);
    expect(issues.leaningLeft).toBeNull();
    expect(issues.leaningRight).toBeNull();
  });

  it('returns all-null for an unscoreable frame', () => {
    const issues = evaluateFrame(null, DEFAULT_THRESHOLDS);
    expect(issues).toEqual(ALL_NULL);
  });
});

describe('SustainedAlertTracker', () => {
  const thresholds = { sustainMs: 1000, recoveryMs: 500 };

  it('stays good with no bad issues', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    const result = tracker.update(NO_ISSUES, 0);
    expect(result.overall).toBe('good');
  });

  it('does not alert on a single bad frame', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    const result = tracker.update({ ...NO_ISSUES, forwardNeck: true }, 0);
    expect(result.overall).toBe('good');
    expect(result.alerting.forwardNeck).toBe(false);
  });

  it('alerts once bad posture is sustained past sustainMs', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    tracker.update({ ...NO_ISSUES, forwardNeck: true }, 0);
    const mid = tracker.update({ ...NO_ISSUES, forwardNeck: true }, 500);
    expect(mid.overall).toBe('good'); // not yet sustained long enough
    const after = tracker.update({ ...NO_ISSUES, forwardNeck: true }, 1000);
    expect(after.overall).toBe('bad');
    expect(after.alerting.forwardNeck).toBe(true);
  });

  it('does not clear the alert on a brief good blip shorter than recoveryMs', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    tracker.update({ ...NO_ISSUES, forwardNeck: true }, 0);
    tracker.update({ ...NO_ISSUES, forwardNeck: true }, 1000); // now alerting
    const blip = tracker.update(NO_ISSUES, 1200);
    expect(blip.alerting.forwardNeck).toBe(true); // recoveryMs (500) not yet elapsed
  });

  it('clears the alert after good posture sustained past recoveryMs', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    tracker.update({ ...NO_ISSUES, forwardNeck: true }, 0);
    tracker.update({ ...NO_ISSUES, forwardNeck: true }, 1000); // now alerting
    tracker.update(NO_ISSUES, 1000);
    const recovered = tracker.update(NO_ISSUES, 1500);
    expect(recovered.alerting.forwardNeck).toBe(false);
    expect(recovered.overall).toBe('good');
  });

  it('treats null (unknown) frames as freezing state, not resetting it', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    tracker.update({ ...NO_ISSUES, forwardNeck: true }, 0);
    tracker.update(ALL_NULL, 400); // dropout
    const after = tracker.update({ ...NO_ISSUES, forwardNeck: true }, 1000);
    expect(after.overall).toBe('bad'); // 1000 - 0 >= sustainMs, dropout didn't reset badSince
  });

  it('reports unknown overall status when nothing is known', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    const result = tracker.update(ALL_NULL, 0);
    expect(result.overall).toBe('unknown');
  });

  it('tracks leaningLeft and leaningRight independently', () => {
    const tracker = new SustainedAlertTracker(thresholds);
    tracker.update({ ...NO_ISSUES, leaningRight: true }, 0);
    const after = tracker.update({ ...NO_ISSUES, leaningRight: true }, 1000);
    expect(after.alerting.leaningRight).toBe(true);
    expect(after.alerting.leaningLeft).toBe(false);
  });
});
