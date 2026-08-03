// Blendshape scores are MediaPipe's ARKit-style facial muscle-movement
// coefficients (e.g. "mouthSmileLeft", "eyeBlinkLeft"), each 0..1. This
// is raw muscle-activation data, not an emotion label — see wellness/
// for the heuristic mapping to indicators, and its accuracy caveats.
export type BlendshapeMap = Record<string, number>;

export interface FaceFrame {
  blendshapes: BlendshapeMap;
  timestampMs: number;
}

export type FaceFrameListener = (frame: FaceFrame) => void;
