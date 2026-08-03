interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

// The click handler is also what unlocks the AudioContext (see
// useAudioAlert / BeepPlayer.unlock) — browsers require a user gesture
// before audio can play, so this button is that gesture.
export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <button type="button" onClick={onToggle}>
      {enabled ? 'Sound: On' : 'Enable Sound Alerts'}
    </button>
  );
}
