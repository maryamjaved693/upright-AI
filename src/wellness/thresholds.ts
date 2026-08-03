export interface WellnessThresholds {
  happyThreshold: number;
  sadThreshold: number;
  tiredEyesThreshold: number;
  yawningThreshold: number;
  /** Per-signal sustain durations. A normal blink spikes eyeBlink for
   *  ~200-300ms, so tiredEyes needs a much longer sustain window than
   *  happy/sad to avoid flagging every blink as "tired". */
  sustainMs: {
    happy: number;
    sad: number;
    tiredEyes: number;
    yawning: number;
  };
  recoveryMs: number;
}

export const DEFAULT_WELLNESS_THRESHOLDS: WellnessThresholds = {
  happyThreshold: 0.35,
  sadThreshold: 0.3,
  tiredEyesThreshold: 0.5,
  yawningThreshold: 0.5,
  sustainMs: {
    happy: 800,
    sad: 1500,
    tiredEyes: 2000,
    yawning: 1200,
  },
  recoveryMs: 500,
};
