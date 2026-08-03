import { useState } from 'react';
import { usePoseLandmarker } from '../pose/usePoseLandmarker';
import type { WebcamState } from '../pose/useWebcam';
import type { PoseFrame } from '../pose/types';

interface WebcamPoseViewProps extends WebcamState {
  onFrame?: (frame: PoseFrame) => void;
  skeletonColor?: string;
}

// Wires the pose-detection hook to a shared webcam (owned by the parent,
// not this component — the face-wellness pipeline needs the same video
// element, and getUserMedia should only be requested once). Stays "dumb"
// about posture scoring itself — it just exposes raw frames via onFrame
// and accepts a color to tint the skeleton.
export function WebcamPoseView({ videoRef, status: webcamStatus, error: webcamError, onFrame, skeletonColor }: WebcamPoseViewProps) {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = { current: canvasEl };

  const { status: modelStatus, error: modelError } = usePoseLandmarker({
    videoRef,
    canvasRef,
    videoReady: webcamStatus === 'ready',
    onFrame,
    skeletonColor,
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 640,
        height: 480,
        maxWidth: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
      }}
    >
      <video
        ref={videoRef}
        style={{ position: 'absolute', top: 0, left: 0, width: 640, height: 480, transform: 'scaleX(-1)' }}
        playsInline
        muted
      />
      <canvas
        ref={setCanvasEl}
        style={{ position: 'absolute', top: 0, left: 0, width: 640, height: 480, transform: 'scaleX(-1)' }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '6px 10px',
          background: 'rgba(13,14,18,0.75)',
          color: '#fff',
          fontFamily: 'var(--mono)',
          fontSize: 11,
        }}
      >
        webcam: {webcamStatus}
        {webcamError && ` (${webcamError})`} | model: {modelStatus}
        {modelError && ` (${modelError})`}
      </div>
    </div>
  );
}
