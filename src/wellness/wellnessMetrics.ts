import type { BlendshapeMap } from '../face/types';

// Raw 0..1 signal strengths derived from blendshapes. These are muscle-
// activation averages, not emotion scores — evaluateWellness.ts turns
// them into heuristic indicators, and the UI must present them as
// approximate wellness signals, not diagnosed emotions.
export interface WellnessSignals {
  happy: number; // avg mouth-smile activation
  sad: number; // avg mouth-frown activation
  tiredEyes: number; // avg eye-closure activation (see sustain duration note in thresholds.ts)
  yawning: number; // jaw-open activation
}

function avg(map: BlendshapeMap, keys: string[]): number {
  return keys.reduce((sum, k) => sum + (map[k] ?? 0), 0) / keys.length;
}

export function computeWellnessSignals(blendshapes: BlendshapeMap): WellnessSignals {
  return {
    happy: avg(blendshapes, ['mouthSmileLeft', 'mouthSmileRight']),
    sad: avg(blendshapes, ['mouthFrownLeft', 'mouthFrownRight']),
    tiredEyes: avg(blendshapes, ['eyeBlinkLeft', 'eyeBlinkRight']),
    yawning: blendshapes.jawOpen ?? 0,
  };
}
