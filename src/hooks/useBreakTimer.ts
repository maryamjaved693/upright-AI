import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const PRESENCE_TIMEOUT_MS = 5000; // no frame in this long => treat as "stepped away"

// Nudges the user every ~intervalMs of *active sitting time*, not wall
// clock. markPresent() should be called from the pose-frame handler
// (any frame with visible landmarks implies a person is there); a 1s
// poll only counts a second toward the total if presence was marked
// recently, so stepping away pauses the countdown instead of letting it
// fire the moment you sit back down.
export function useBreakTimer(intervalMs: number = DEFAULT_INTERVAL_MS) {
  const lastSeenAtRef = useRef<number>(0);
  const activeMsRef = useRef(0);
  const [dueForBreak, setDueForBreak] = useState(false);
  const [remainingMs, setRemainingMs] = useState(intervalMs);

  const markPresent = useCallback(() => {
    lastSeenAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const present = Date.now() - lastSeenAtRef.current <= PRESENCE_TIMEOUT_MS;
      if (present) {
        activeMsRef.current += 1000;
      }
      setRemainingMs(Math.max(0, intervalMs - activeMsRef.current));
      if (activeMsRef.current >= intervalMs) {
        setDueForBreak(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [intervalMs]);

  const acknowledgeBreak = useCallback(() => {
    activeMsRef.current = 0;
    setDueForBreak(false);
    setRemainingMs(intervalMs);
  }, [intervalMs]);

  return { markPresent, dueForBreak, acknowledgeBreak, remainingMs };
}
