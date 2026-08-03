import { useEffect, useRef, useState } from 'react';

export interface WebcamState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: 'idle' | 'requesting' | 'ready' | 'error';
  error: string | null;
}

// Requests the webcam once on mount and attaches it to a <video> element.
// We deliberately don't put the MediaStream itself in React state — only
// the small status enum — because the stream object is mutable and
// re-rendering on it would be pointless churn.
export function useWebcam(): WebcamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<WebcamState['status']>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      setStatus('requesting');
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus('error');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, status, error };
}
