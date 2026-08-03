import { useEffect, useRef, useState } from 'react';
import {
  FilesetResolver,
  PoseLandmarker,
  type PoseLandmarker as PoseLandmarkerType,
} from '@mediapipe/tasks-vision';
import { drawSkeleton } from './drawLandmarks';
import type { PoseFrameListener } from './types';

// WASM runtime binaries — these come from a CDN because that's the
// documented, supported way @mediapipe/tasks-vision loads its runtime.
// The model itself (the thing that actually varies/updates) is served
// from public/models so the app works offline after first load.
const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_PATH = '/models/pose_landmarker_lite.task';

export type PoseLandmarkerStatus = 'loading' | 'ready' | 'error';

interface UsePoseLandmarkerArgs {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  videoReady: boolean;
  onFrame?: PoseFrameListener;
  skeletonColor?: string;
}

export function usePoseLandmarker({
  videoRef,
  canvasRef,
  videoReady,
  onFrame,
  skeletonColor,
}: UsePoseLandmarkerArgs): { status: PoseLandmarkerStatus; error: string | null } {
  const [status, setStatus] = useState<PoseLandmarkerStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  // onFrame/skeletonColor are stored in refs so the detection-loop effect
  // below doesn't need to tear down and rebuild the MediaPipe model every
  // time the caller passes a new inline callback or the posture status
  // (and therefore the desired skeleton color) changes.
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;
  const skeletonColorRef = useRef(skeletonColor);
  skeletonColorRef.current = skeletonColor;

  useEffect(() => {
    if (!videoReady) return;

    let landmarker: PoseLandmarkerType | null = null;
    let rafId = 0;
    let cancelled = false;
    let lastVideoTime = -1;

    async function init() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
        landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
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
      const canvas = canvasRef.current;
      if (!video || !landmarker || cancelled) return;

      // Before the video's first frame has actually decoded, videoWidth/
      // videoHeight are still 0 even though readyState/currentTime may
      // already look "live" — feeding that to detectForVideo crashes the
      // MediaPipe graph with an ROI-must-be-positive error. Wait for real
      // pixel dimensions.
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      // detectForVideo requires a new video frame each call; skip if the
      // decoder hasn't advanced (avoids duplicate work on faster rAF ticks).
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const timestampMs = performance.now();
        const result = landmarker.detectForVideo(video, timestampMs);
        const landmarks = result.landmarks[0];

        if (canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (landmarks) {
              drawSkeleton(ctx, landmarks, canvas.width, canvas.height, skeletonColorRef.current);
            } else {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
          }
        }

        if (landmarks) {
          onFrameRef.current?.({ landmarks, timestampMs });
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
  }, [videoReady, videoRef, canvasRef]);

  return { status, error };
}
