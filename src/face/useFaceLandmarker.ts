import { useEffect, useRef, useState } from 'react';
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarker as FaceLandmarkerType,
} from '@mediapipe/tasks-vision';
import type { BlendshapeMap, FaceFrameListener } from './types';

const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_PATH = '/models/face_landmarker.task';

export type FaceLandmarkerStatus = 'loading' | 'ready' | 'error';

interface UseFaceLandmarkerArgs {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoReady: boolean;
  onFace?: FaceFrameListener;
}

function extractBlendshapes(categories: { categoryName: string; score: number }[]): BlendshapeMap {
  const map: BlendshapeMap = {};
  for (const c of categories) map[c.categoryName] = c.score;
  return map;
}

// Headless twin of usePoseLandmarker: runs Face Landmarker against the
// same shared <video> element (no separate camera stream) and reports
// blendshape scores per frame. No drawing — the wellness UI is text/icon
// based, not a face overlay.
export function useFaceLandmarker({
  videoRef,
  videoReady,
  onFace,
}: UseFaceLandmarkerArgs): { status: FaceLandmarkerStatus; error: string | null } {
  const [status, setStatus] = useState<FaceLandmarkerStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const onFaceRef = useRef(onFace);
  onFaceRef.current = onFace;

  useEffect(() => {
    if (!videoReady) return;

    let landmarker: FaceLandmarkerType | null = null;
    let rafId = 0;
    let cancelled = false;
    let lastVideoTime = -1;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: true,
        });
        if (cancelled) {
          landmarker.close();
          return;
        }
        setStatus('ready');
        loop();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    }

    function loop() {
      const video = videoRef.current;
      if (!video || !landmarker || cancelled) return;

      // See usePoseLandmarker's identical guard: videoWidth/videoHeight
      // can still be 0 right after the stream attaches, before the first
      // frame decodes, and MediaPipe crashes on a zero-size ROI.
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const timestampMs = performance.now();
        const result = landmarker.detectForVideo(video, timestampMs);
        const categories = result.faceBlendshapes[0]?.categories;
        if (categories) {
          onFaceRef.current?.({ blendshapes: extractBlendshapes(categories), timestampMs });
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      landmarker?.close();
    };
  }, [videoReady, videoRef]);

  return { status, error };
}
