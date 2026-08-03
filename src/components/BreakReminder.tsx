interface BreakReminderProps {
  dueForBreak: boolean;
  remainingMs: number;
  onAcknowledge: () => void;
}

function formatMinutes(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function BreakReminder({ dueForBreak, remainingMs, onAcknowledge }: BreakReminderProps) {
  if (!dueForBreak) {
    return (
      <div className="card">
        <div className="card-title">Break timer</div>
        <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>Next break in {formatMinutes(remainingMs)}</p>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="card"
      style={{
        borderColor: 'var(--yellow)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="card-title" style={{ color: 'var(--yellow)' }}>
        Break timer
      </div>
      <span style={{ fontSize: 13 }}>Time to stand up and stretch — you've been sitting a while.</span>
      <button type="button" onClick={onAcknowledge} style={{ alignSelf: 'flex-start' }}>
        I stood up
      </button>
    </div>
  );
}
