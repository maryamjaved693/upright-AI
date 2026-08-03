import type { Landmark } from './types';
import { POSE_CONNECTIONS } from './poseConnections';

// Pure canvas-drawing function: no React, no MediaPipe types beyond
// Landmark. Takes a 2D context sized to match the video element and
// draws the skeleton in normalized [0,1] coordinates scaled to canvas
// pixels. Kept separate from the capture/inference hook so the drawing
// code can change (colors, style) without touching detection logic.
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  width: number,
  height: number,
  color: string = '#00e676',
): void {
  ctx.clearRect(0, 0, width, height);

  const visible = (i: number) => (landmarks[i]?.visibility ?? 1) > 0.5;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  for (const [a, b] of POSE_CONNECTIONS) {
    if (!landmarks[a] || !landmarks[b]) continue;
    if (!visible(a) || !visible(b)) continue;
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * width, landmarks[a].y * height);
    ctx.lineTo(landmarks[b].x * width, landmarks[b].y * height);
    ctx.stroke();
  }

  ctx.fillStyle = '#ffeb3b';
  landmarks.forEach((lm, i) => {
    if (!visible(i)) return;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
    ctx.fill();
  });
}
