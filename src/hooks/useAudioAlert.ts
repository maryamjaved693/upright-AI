import { useCallback, useEffect, useRef } from 'react';
import type { OverallStatus } from '../scoring/sustainedAlertTracker';
import { AlertCadence } from '../audio/alertCadence';
import { BeepPlayer } from '../audio/beepPlayer';

// Polls overallStatusRef on its own timer rather than reacting to React
// state changes — see the chat explanation: a status that stays 'bad'
// for minutes at a time must still retrigger the beep periodically, and
// React won't re-render for a value that hasn't changed.
export function useAudioAlert(overallStatusRef: React.RefObject<OverallStatus>, enabled: boolean) {
  const cadenceRef = useRef(new AlertCadence());
  const playerRef = useRef(new BeepPlayer());

  useEffect(() => {
    if (!enabled) {
      cadenceRef.current.reset();
      return;
    }
    const id = setInterval(() => {
      const shouldPlay = cadenceRef.current.notify(overallStatusRef.current, Date.now());
      if (shouldPlay) playerRef.current.play();
    }, 1000);
    return () => clearInterval(id);
  }, [enabled, overallStatusRef]);

  const unlock = useCallback(() => playerRef.current.unlock(), []);

  return { unlock };
}
